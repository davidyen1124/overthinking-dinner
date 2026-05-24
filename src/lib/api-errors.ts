export const apiErrorCodes = [
  'invalid_json',
  'invalid_locale',
  'invalid_people_count',
  'invalid_appetite',
  'invalid_vibe',
  'invalid_selected_items',
  'invalid_selected_item_ids',
  'invalid_dismissed_item_ids',
  'unknown_item_ids',
  'unknown_dismissed_item_ids',
  'invalid_ai_recommendation',
] as const

export type ApiErrorCode = (typeof apiErrorCodes)[number]

export type ApiErrorResponse = {
  error: {
    code: ApiErrorCode
    message: string
    details?: Record<string, unknown>
  }
}
