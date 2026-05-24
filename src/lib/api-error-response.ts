import { NextResponse } from 'next/server'
import type { ApiErrorCode, ApiErrorResponse } from './api-errors'

export function apiError(code: ApiErrorCode, status: number, details?: Record<string, unknown>) {
  const body: ApiErrorResponse = {
    error: {
      code,
      message: apiErrorMessages[code],
      ...(details ? { details } : {}),
    },
  }

  return NextResponse.json(body, { status })
}

const apiErrorMessages: Record<ApiErrorCode, string> = {
  invalid_json: 'Request JSON is invalid.',
  invalid_locale: 'Locale is invalid.',
  invalid_people_count: 'Party size must be between 1 and 8.',
  invalid_appetite: 'Appetite is invalid.',
  invalid_vibe: 'Flavor direction is invalid.',
  invalid_selected_items: 'Selected dish IDs must be an array.',
  invalid_selected_item_ids: 'Selected dish IDs must be strings.',
  invalid_dismissed_item_ids: 'Dismissed dish IDs must be strings.',
  unknown_item_ids: 'Selected dish IDs include unknown IDs.',
  unknown_dismissed_item_ids: 'Dismissed dish IDs include unknown IDs.',
  invalid_ai_recommendation: 'AI did not return a valid real-menu recommendation.',
}
