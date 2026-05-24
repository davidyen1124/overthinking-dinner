import { NextResponse } from 'next/server'
import { z } from 'zod'
import menuData from '../../../data/restaurant-menu.json'
import { apiError } from '../../../lib/api-error-response'
import { createRecommendation } from '../../../lib/recommendations'
import type { ApiErrorCode } from '../../../lib/api-errors'
import type { RecommendRequest, RestaurantMenu } from '../../../types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const menu = menuData as RestaurantMenu
const itemById = new Map(menu.items.map((item) => [item.id, item]))
const locales = ['zh-Hans', 'zh-Hant', 'en'] as const
const appetites = ['light', 'normal', 'hungry'] as const
const vibes = ['safe', 'balanced', 'adventurous', 'surprise'] as const
const recommendRequestSchema = z.object({
  peopleCount: z.number().min(1).max(8),
  locale: z.enum(locales),
  appetite: z.enum(appetites),
  vibe: z.enum(vibes),
  selectedItemIds: z.array(z.string()),
  dismissedItemIds: z.preprocess((value) => (Array.isArray(value) ? value : []), z.array(z.string())),
})

type RequestValidation =
  | { ok: true; body: RecommendRequest }
  | { ok: false; error: ApiErrorCode; details?: Record<string, unknown> }

export async function POST(request: Request) {
  let parsedBody: unknown
  try {
    parsedBody = await request.json()
  } catch {
    return apiError('invalid_json', 400)
  }

  const validation = validateRequest(parsedBody)
  if (!validation.ok) return apiError(validation.error, 400, validation.details)

  try {
    const guide = await createRecommendation({ menu, request: validation.body })
    return NextResponse.json(guide)
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'AI could not finish the recommendation.'
    return apiError('invalid_ai_recommendation', 502, { reason: message })
  }
}

function validateRequest(body: unknown): RequestValidation {
  const parsed = recommendRequestSchema.safeParse(body)
  if (!parsed.success) return { ok: false, error: apiErrorCodeForSchemaIssue(parsed.error.issues[0]) }

  const selectedItemIds = [...new Set(parsed.data.selectedItemIds)]
  const dismissedItemIds = [...new Set(parsed.data.dismissedItemIds)].filter(
    (id) => !selectedItemIds.includes(id),
  )
  const missing = selectedItemIds.filter((id) => !itemById.has(id))
  if (missing.length) return { ok: false, error: 'unknown_item_ids', details: { ids: missing } }

  const missingDismissed = dismissedItemIds.filter((id) => !itemById.has(id))
  if (missingDismissed.length) {
    return { ok: false, error: 'unknown_dismissed_item_ids', details: { ids: missingDismissed } }
  }

  return {
    ok: true,
    body: {
      ...parsed.data,
      selectedItemIds,
      dismissedItemIds,
    },
  }
}

function apiErrorCodeForSchemaIssue(issue: z.core.$ZodIssue): ApiErrorCode {
  const [field, index] = issue.path

  if (field === 'peopleCount') return 'invalid_people_count'
  if (field === 'locale') return 'invalid_locale'
  if (field === 'appetite') return 'invalid_appetite'
  if (field === 'vibe') return 'invalid_vibe'
  if (field === 'selectedItemIds') return typeof index === 'number' ? 'invalid_selected_item_ids' : 'invalid_selected_items'
  if (field === 'dismissedItemIds') return 'invalid_dismissed_item_ids'
  return 'invalid_json'
}
