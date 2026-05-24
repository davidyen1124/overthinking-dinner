import type { Locale } from './lib/i18n'

export type Appetite = 'light' | 'normal' | 'hungry'
export type Vibe = 'safe' | 'balanced' | 'adventurous' | 'surprise'

export type MenuItem = {
  id: string
  name: string
  names?: Partial<Record<Locale, string>>
  originalName: string
  category: string
  photoUrl?: string
  portion: 'small' | 'medium' | 'large'
  shareable: boolean
  spicyLevel: number
  tags: string[]
  textureTags: string[]
}

export type RestaurantMenu = {
  restaurant: {
    id: string
    name: string
    names?: Partial<Record<Locale, string>>
    description: string
    descriptions?: Partial<Record<Locale, string>>
  }
  items: MenuItem[]
}

export type RecommendRequest = {
  locale: Locale
  peopleCount: number
  appetite: Appetite
  vibe: Vibe
  selectedItemIds: string[]
  dismissedItemIds: string[]
}

export type GuideResponse = {
  status: 'pairing' | 'complete'
  title: string
  description: string
  recommendedItemIds: string[]
}
