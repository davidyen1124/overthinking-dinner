import { createHash } from 'node:crypto'
import { z } from 'zod'
import { getCodexChatGptAuth } from './ai/openaiAuth'
import { collectResponseText, readResponseBody } from './ai/responseText'
import type { GuideResponse, MenuItem, RecommendRequest, RestaurantMenu } from '../types'

const MODEL = process.env.MENU_BUDDY_TEXT_MODEL ?? 'gpt-5.5'

const GuideResponseSchema = z.object({
  status: z.enum(['pairing', 'complete']),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  recommendedItemIds: z.array(z.string()).max(3),
})

export async function createRecommendation(params: {
  menu: RestaurantMenu
  request: RecommendRequest
}): Promise<GuideResponse> {
  const recommendableItems = getRecommendableItems(params.menu, params.request)
  if (!recommendableItems.length) return noMoreRecommendations(params.request.locale)

  const auth = await getCodexChatGptAuth()
  const response = await fetch(`${auth.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${auth.token}`,
      'ChatGPT-Account-ID': auth.accountId,
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      version: '0.125.0',
    },
    body: JSON.stringify({
      model: MODEL,
      instructions: buildInstructions(params.request.locale),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: buildInput(params.menu, params.request, recommendableItems),
            },
          ],
        },
      ],
      reasoning: { effort: 'medium' },
      text: {
        format: {
          type: 'json_schema',
          name: 'menu_recommendation',
          strict: true,
          schema: responseSchema(recommendableItems.map((item) => item.id)),
        },
      },
      prompt_cache_key: `overthinking-dinner:${params.menu.restaurant.id}:${menuHash(params.menu)}`,
      stream: true,
      store: false,
    }),
  })

  const body = await readResponseBody(response)
  if (!response.ok) {
    throw new Error(`Recommendation call failed (${response.status}): ${body.slice(0, 500)}`)
  }

  const output = collectResponseText(body).trim()
  if (!output) throw new Error('Recommendation call returned an empty response.')

  return validateGuide(JSON.parse(output) as unknown, params.menu, params.request)
}

function buildInstructions(locale: RecommendRequest['locale']) {
  const localizedRule = {
    'zh-Hans':
      'All user-facing text must be Simplified Chinese. title must be at most 18 Chinese characters; description must be at most 70 Chinese characters.',
    'zh-Hant':
      'All user-facing text must be Traditional Chinese. title must be at most 18 Chinese characters; description must be at most 70 Chinese characters.',
    en: 'All user-facing text must be natural English. title must be at most 8 words; description must be at most 28 words.',
  }[locale]

  return [
    'You are an AI ordering assistant for one restaurant, helping guests build a shared table one step at a time.',
    'Use only the real menu items provided in the request.',
    'Never invent dish names, IDs, photos, or dishes outside the menu.',
    'Only recommend dish IDs from recommendableItemIds.',
    'Do not recommend dishes already present in selectedItemIds.',
    'Do not recommend dishes in dismissedItemIds.',
    'Use peopleCount, appetite, selectedItemIds, and the menu metadata to decide whether the table already has enough food.',
    'Reference portions: normal appetite is usually about 3 dishes for 2 people, 5 dishes for 4 people, and 6 to 8 dishes for 5 people; reduce for light appetite and increase for hungry appetite.',
    'Do not over-order just to keep recommending; when the current order fits the party size, appetite, variety, staple needs, and flavor balance, mark it complete.',
    'If the table has enough food, set status to complete and return an empty recommendedItemIds array.',
    'If the current order is empty, recommend up to 3 dishes that make the best opening set.',
    'If the table still needs food, set status to pairing and recommend 1 to 3 dishes for the next step.',
    'If description says more dishes are needed or suggests continuing to add dishes, status must be pairing.',
    'Do not recommend drinks too early; prioritize mains, vegetables, cold appetizers, or staples.',
    'Use food knowledge to balance portion, texture, flavor, spice, freshness, and shareability.',
    localizedRule,
    'When status is complete, title must clearly say the table has enough food and must not ask whether to keep adding dishes.',
    'description may explain this round of recommendations or, when complete, why the portion is suitable.',
    'description should mention only the current ordered dishes or this round of recommended dishes.',
  ].join('\n')
}

function buildInput(menu: RestaurantMenu, request: RecommendRequest, recommendableItems: MenuItem[]) {
  return JSON.stringify({
    restaurant: menu.restaurant,
    menuItems: menu.items.map(toPromptItem),
    request: {
      peopleCount: request.peopleCount,
      locale: request.locale,
      appetite: request.appetite,
      vibe: request.vibe,
      selectedItemIds: request.selectedItemIds,
      dismissedItemIds: request.dismissedItemIds,
      recommendableItemIds: recommendableItems.map((item) => item.id),
    },
  })
}

function responseSchema(menuItemIds: string[]) {
  return {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        enum: ['pairing', 'complete'],
      },
      title: { type: 'string' },
      description: { type: 'string' },
      recommendedItemIds: {
        type: 'array',
        maxItems: 3,
        items: {
          type: 'string',
          enum: menuItemIds,
        },
      },
    },
    required: ['status', 'title', 'description', 'recommendedItemIds'],
    additionalProperties: false,
  }
}

function validateGuide(value: unknown, menu: RestaurantMenu, request: RecommendRequest): GuideResponse {
  const guide = GuideResponseSchema.parse(value)
  const current = new Set(request.selectedItemIds)
  const dismissed = new Set(request.dismissedItemIds)
  const menuItemById = new Map(menu.items.map((item) => [item.id, item]))
  const seen = new Set<string>()

  for (const id of guide.recommendedItemIds) {
    const item = menuItemById.get(id)
    if (!item) throw new Error(`AI recommended an unknown dish ID: ${id}.`)
    if (current.has(id)) throw new Error(`AI recommended an already ordered dish ID: ${id}.`)
    if (dismissed.has(id)) throw new Error(`AI recommended a dismissed dish ID: ${id}.`)
    if (seen.has(id)) throw new Error(`AI repeated dish ID: ${id}.`)
    if (!item.name) throw new Error(`AI recommended a dish missing display data: ${id}.`)
    seen.add(id)
  }

  if (guide.status === 'complete') {
    return { ...guide, recommendedItemIds: [] }
  }

  if (!guide.recommendedItemIds.length) {
    throw new Error('AI did not recommend any displayable dishes.')
  }

  return guide
}

function getRecommendableItems(menu: RestaurantMenu, request: RecommendRequest) {
  const current = new Set(request.selectedItemIds)
  const dismissed = new Set(request.dismissedItemIds)
  return menu.items.filter((item) => !current.has(item.id) && !dismissed.has(item.id))
}

function noMoreRecommendations(locale: RecommendRequest['locale']): GuideResponse {
  if (locale === 'en') {
    return {
      status: 'complete',
      title: 'Order Complete',
      description: 'There are no more available dishes to recommend for this round.',
      recommendedItemIds: [],
    }
  }

  if (locale === 'zh-Hant') {
    return {
      status: 'complete',
      title: '已沒有更多菜品',
      description: '這一輪沒有更多可推薦的菜品。',
      recommendedItemIds: [],
    }
  }

  return {
    status: 'complete',
    title: '已没有更多菜品',
    description: '这一轮没有更多可推荐的菜品。',
    recommendedItemIds: [],
  }
}

function toPromptItem(item: MenuItem) {
  return {
    id: item.id,
    name: item.name,
    originalName: item.originalName,
    category: item.category,
    portion: item.portion,
    shareable: item.shareable,
    spicyLevel: item.spicyLevel,
    tags: item.tags,
    textureTags: item.textureTags,
  }
}

function menuHash(menu: RestaurantMenu) {
  return createHash('sha256').update(JSON.stringify(menu)).digest('hex').slice(0, 16)
}
