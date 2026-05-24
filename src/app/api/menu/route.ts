import { NextResponse } from 'next/server'
import menuData from '../../../data/restaurant-menu.json'
import type { RestaurantMenu } from '../../../types'

export const dynamic = 'force-dynamic'

const menu = menuData as RestaurantMenu

export function GET() {
  return NextResponse.json(menu)
}
