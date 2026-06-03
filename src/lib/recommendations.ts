import { z } from 'zod'
import type { GuideResponse, MenuItem, RecommendRequest, RestaurantMenu } from '../types'

const AI_API_URL_ENV = 'MENU_BUDDY_AI_API_URL'

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
  if (currentOrderHasEnoughFood(params.menu, params.request)) {
    return currentOrderComplete(params.request.locale)
  }

  const recommendableItems = getRecommendableItems(params.menu, params.request)
  if (!recommendableItems.length) return noMoreRecommendations(params.request.locale)

  return createValidatedRecommendation(params, recommendableItems)
}

async function createValidatedRecommendation(
  params: {
    menu: RestaurantMenu
    request: RecommendRequest
  },
  recommendableItems: MenuItem[],
): Promise<GuideResponse> {
  const chat = buildChat(params.menu, params.request, recommendableItems)
  const firstReply = await callAiApi(chat)

  try {
    return parseAndValidateGuide(firstReply, params.menu, params.request)
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : 'Unknown validation error.'
    const repairedReply = await callAiApi({
      system: chat.system,
      messages: [
        ...chat.messages,
        { role: 'assistant', content: firstReply },
        {
          role: 'user',
          content: [
            'Your previous answer was invalid for this app.',
            `Validation error: ${reason}`,
            'Return one corrected JSON object only, with no Markdown fences and no explanation.',
          ].join('\n'),
        },
      ],
    })
    return parseAndValidateGuide(repairedReply, params.menu, params.request)
  }
}

async function callAiApi(chat: ChatRequest): Promise<string> {
  const response = await fetch(aiApiUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(chat),
  })

  const body = await response.text()
  if (!response.ok) {
    throw new Error(`Recommendation call failed (${response.status}): ${body.slice(0, 500)}`)
  }

  const parsed = JSON.parse(body) as { reply?: unknown }
  if (typeof parsed.reply !== 'string' || !parsed.reply.trim()) {
    throw new Error('Recommendation call returned an empty response.')
  }

  return parsed.reply.trim()
}

function aiApiUrl() {
  const value = process.env[AI_API_URL_ENV]?.trim()
  if (!value) throw new Error(`${AI_API_URL_ENV} is not configured.`)
  return value
}

type ChatRequest = {
  system: string
  messages: ChatMessage[]
}

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

function buildInstructions(locale: RecommendRequest['locale']) {
  const localizedRule = {
    'zh-Hans':
      'All user-facing text must be Simplified Chinese. title must be at most 18 Chinese characters; description must be at most 70 Chinese characters.',
    'zh-Hant':
      'All user-facing text must be natural Taiwanese Mandarin in Traditional Chinese, not a Simplified Chinese conversion. Use Taiwanese restaurant wording such as 點餐, 餐點, 菜單, 飲品, and 甜點 where appropriate. title must be at most 18 Chinese characters; description must be at most 70 Chinese characters.',
    en: 'All user-facing text must be natural English. title must be at most 8 words; description must be at most 28 words.',
  }[locale]

  return [
    'You are an AI ordering assistant for one restaurant, helping guests build a shared table one step at a time.',
    'Use only the real menu items provided in menuItems.',
    'menuItems contains only dishes that are currently allowed to recommend.',
    'Never invent dish names, IDs, photos, or dishes outside the menu.',
    'Only recommend dish IDs that appear in menuItems.',
    'Do not recommend dishes already present in selectedItemIds.',
    'Do not recommend dishes in dismissedItemIds.',
    'Use peopleCount, appetite, selectedItemIds, and the menu metadata to decide whether the table already has enough food.',
    'Reference portions: normal appetite is usually about 3 dishes for 2 people, 4 dishes for 3 people, 5 dishes for 4 people, and 6 to 8 dishes for 5 people; reduce for light appetite and increase for hungry appetite.',
    'Do not over-order just to keep recommending; when the current order fits the party size, appetite, variety, staple needs, and flavor balance, mark it complete.',
    'If the table has enough food, set status to complete and return an empty recommendedItemIds array.',
    'If the current order is empty, recommend exactly 3 dishes that make the best opening set, or exactly 2 dishes when peopleCount is 1.',
    'If the table still needs food, set status to pairing and recommend 1 to 3 dishes for the next step.',
    'If description says more dishes are needed or suggests continuing to add dishes, status must be pairing.',
    'Do not recommend drinks too early; prioritize mains, vegetables, cold appetizers, or staples.',
    'Use food knowledge to balance portion, texture, flavor, spice, freshness, and shareability.',
    localizedRule,
    'When status is complete, title must clearly say the table has enough food and must not ask whether to keep adding dishes.',
    'description may explain this round of recommendations or, when complete, why the portion is suitable.',
    'description should mention only the current ordered dishes or this round of recommended dishes.',
    'For English, keep title punchy and do not use a subtitle after a dash, colon, or semicolon.',
    'Return exactly one JSON object matching this TypeScript type: { status: "pairing" | "complete"; title: string; description: string; recommendedItemIds: string[] }.',
    'Do not wrap the JSON in Markdown fences. Do not include commentary before or after the JSON.',
  ].join('\n')
}

function buildChat(
  menu: RestaurantMenu,
  request: RecommendRequest,
  recommendableItems: MenuItem[],
): ChatRequest {
  return {
    system: buildInstructions(request.locale),
    messages: [
      {
        role: 'user',
        content: [
          'Choose the next ordering recommendation from this JSON payload.',
          'The response must be raw JSON only.',
          buildInput(menu, request, recommendableItems),
        ].join('\n\n'),
      },
    ],
  }
}

function buildInput(menu: RestaurantMenu, request: RecommendRequest, recommendableItems: MenuItem[]) {
  const selected = new Set(request.selectedItemIds)

  return JSON.stringify({
    restaurant: menu.restaurant,
    selectedItems: menu.items.filter((item) => selected.has(item.id)).map(toPromptItem),
    menuItems: recommendableItems.map(toPromptItem),
    request: {
      peopleCount: request.peopleCount,
      locale: request.locale,
      appetite: request.appetite,
      vibe: request.vibe,
      selectedItemIds: request.selectedItemIds,
      dismissedItemIds: request.dismissedItemIds,
    },
  })
}

function parseAndValidateGuide(
  output: string,
  menu: RestaurantMenu,
  request: RecommendRequest,
): GuideResponse {
  return validateGuide(JSON.parse(extractJsonObject(output)) as unknown, menu, request)
}

function extractJsonObject(output: string): string {
  const trimmed = output.trim()
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  const text = fenced?.[1]?.trim() ?? trimmed
  const start = text.indexOf('{')
  if (start === -1) throw new Error('AI response did not include a JSON object.')

  let depth = 0
  let inString = false
  let escaped = false

  for (let index = start; index < text.length; index += 1) {
    const char = text[index]

    if (inString) {
      if (escaped) {
        escaped = false
      } else if (char === '\\') {
        escaped = true
      } else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
    } else if (char === '{') {
      depth += 1
    } else if (char === '}') {
      depth -= 1
      if (depth === 0) return text.slice(start, index + 1)
    }
  }

  throw new Error('AI response included incomplete JSON.')
}

function validateGuide(value: unknown, menu: RestaurantMenu, request: RecommendRequest): GuideResponse {
  let guide = GuideResponseSchema.parse(value)

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

  guide = normalizeLocalizedText(normalizeOpeningGuide(guide, menu, request), request.locale)

  if (guide.status === 'complete') {
    return { ...guide, recommendedItemIds: [] }
  }

  if (!guide.recommendedItemIds.length) {
    throw new Error('AI did not recommend any displayable dishes.')
  }

  if (
    request.selectedItemIds.length === 0 &&
    guide.recommendedItemIds.length !== openingRecommendationCount(request)
  ) {
    throw new Error(
      `Opening recommendation must include exactly ${openingRecommendationCount(request)} dish IDs.`,
    )
  }

  return guide
}

function normalizeOpeningGuide(
  guide: GuideResponse,
  menu: RestaurantMenu,
  request: RecommendRequest,
): GuideResponse {
  if (request.selectedItemIds.length > 0) return guide
  if (guide.status === 'complete') throw new Error('Opening recommendation cannot be complete.')

  const target = openingRecommendationCount(request)
  const ids = [...new Set(guide.recommendedItemIds)].slice(0, target)
  const used = new Set(ids)

  while (ids.length < target) {
    const [item] = rankOpeningItems(menu, request, used)
    if (!item) break
    ids.push(item.id)
    used.add(item.id)
  }

  if (ids.length < target) return { ...guide, recommendedItemIds: ids }

  return {
    ...openingGuideText(request.locale),
    recommendedItemIds: ids,
  }
}

function rankOpeningItems(menu: RestaurantMenu, request: RecommendRequest, used: Set<string>) {
  const current = new Set(request.selectedItemIds)
  const dismissed = new Set(request.dismissedItemIds)
  const usedCategories = new Set(
    menu.items.filter((item) => used.has(item.id)).map((item) => item.category),
  )

  return menu.items
    .filter((item) => !current.has(item.id) && !dismissed.has(item.id) && !used.has(item.id))
    .filter((item) => item.category !== 'drink' && item.category !== 'dessert')
    .map((item, index) => ({ item, score: openingItemScore(item, usedCategories), index }))
    .sort((left, right) => right.score - left.score || left.index - right.index)
    .map(({ item }) => item)
}

function openingItemScore(item: MenuItem, usedCategories: Set<string>) {
  const categoryScore: Record<string, number> = {
    main: 50,
    vegetable: 44,
    staple: 40,
    appetizer: 36,
    cold_appetizer: 32,
  }

  return (
    (categoryScore[item.category] ?? 20) +
    (usedCategories.has(item.category) ? -16 : 0) +
    (item.shareable ? 8 : 0) +
    (item.portion === 'large' ? 5 : item.portion === 'medium' ? 3 : 0)
  )
}

function normalizeLocalizedText(
  guide: GuideResponse,
  locale: RecommendRequest['locale'],
): GuideResponse {
  if (locale === 'en') {
    const plainTitle = guide.title.split(/[;:—–-]/)[0]?.trim() || guide.title
    return {
      ...guide,
      title: limitWords(plainTitle, 8),
      description: limitWords(guide.description, 28),
    }
  }

  return {
    ...guide,
    title: limitVisibleLength(guide.title, 18),
    description: limitVisibleLength(guide.description, 70),
  }
}

function limitWords(text: string, maxWords: number) {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (words.length <= maxWords) return text.trim()
  return words.slice(0, maxWords).join(' ')
}

function limitVisibleLength(text: string, maxLength: number) {
  const chars = Array.from(text.replace(/\s/g, ''))
  if (chars.length <= maxLength) return text.trim()
  return chars.slice(0, maxLength).join('')
}

function getRecommendableItems(menu: RestaurantMenu, request: RecommendRequest) {
  const current = new Set(request.selectedItemIds)
  const dismissed = new Set(request.dismissedItemIds)
  return menu.items.filter((item) => !current.has(item.id) && !dismissed.has(item.id))
}

function currentOrderHasEnoughFood(menu: RestaurantMenu, request: RecommendRequest) {
  const selectedFoodCount = menu.items.filter(
    (item) =>
      request.selectedItemIds.includes(item.id) &&
      item.category !== 'drink' &&
      item.category !== 'dessert',
  ).length

  return selectedFoodCount >= targetDishCount(request)
}

function targetDishCount(request: RecommendRequest) {
  const normal =
    request.peopleCount <= 2
      ? 3
      : request.peopleCount === 3
        ? 4
        : request.peopleCount <= 4
          ? 5
          : Math.min(8, request.peopleCount + 2)

  if (request.appetite === 'light') return Math.max(1, normal - 1)
  if (request.appetite === 'hungry') return normal + 1
  return normal
}

function openingRecommendationCount(request: RecommendRequest) {
  return request.peopleCount === 1 ? 2 : 3
}

function openingGuideText(locale: RecommendRequest['locale']): Omit<GuideResponse, 'recommendedItemIds'> {
  if (locale === 'en') {
    return {
      status: 'pairing',
      title: 'Opening Table Set',
      description: 'A balanced first round to anchor dinner for the table.',
    }
  }

  if (locale === 'zh-Hant') {
    return {
      status: 'pairing',
      title: '先來這幾道',
      description: '先搭一輪餐點，讓份量和口味都剛剛好。',
    }
  }

  return {
    status: 'pairing',
    title: '先上桌的搭配',
    description: '先用几道菜打底，让口味与分量都更均衡。',
  }
}

function currentOrderComplete(locale: RecommendRequest['locale']): GuideResponse {
  if (locale === 'en') {
    return {
      status: 'complete',
      title: 'Order Complete',
      description: 'The current order has enough food for the table and appetite.',
      recommendedItemIds: [],
    }
  }

  if (locale === 'zh-Hant') {
    return {
      status: 'complete',
      title: '餐點夠了',
      description: '目前點的餐點已符合人數與食量，不需要再加點。',
      recommendedItemIds: [],
    }
  }

  return {
    status: 'complete',
    title: '菜量已足够',
    description: '目前点单已符合人数与食量，不需要再加菜。',
    recommendedItemIds: [],
  }
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
      title: '沒有更多餐點',
      description: '這一輪已經沒有其他適合推薦的餐點。',
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
    names: item.names,
    originalName: item.originalName,
    category: item.category,
    price: item.price,
    portion: item.portion,
    shareable: item.shareable,
    spicyLevel: item.spicyLevel,
    tags: item.tags,
    textureTags: item.textureTags,
  }
}
