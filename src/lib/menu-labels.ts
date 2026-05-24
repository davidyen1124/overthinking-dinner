import type { MenuItem } from '../types'
import type { Locale } from './i18n'
import { toTraditionalChinese } from './i18n'

export function dishName(item: MenuItem, locale: Locale = 'zh-Hans') {
  const localized = item.names?.[locale]
  if (localized) return localized

  if (locale === 'en') return item.name

  const nativeName = nativeDishName(item)
  return locale === 'zh-Hant' ? toTraditionalChinese(nativeName) : nativeName
}

export function restaurantName(
  restaurant: { name: string; names?: Partial<Record<Locale, string>> },
  locale: Locale,
) {
  const localized = restaurant.names?.[locale]
  if (localized) return localized
  return locale === 'zh-Hant' ? toTraditionalChinese(restaurant.name) : restaurant.name
}

export function categoryLabel(category: string, locale: Locale = 'zh-Hans') {
  return categoryLabels[locale][category] || category
}

export function tagLabel(tag: string, locale: Locale = 'zh-Hans') {
  return tagLabels[locale][tag] || tag
}

function nativeDishName(item: MenuItem) {
  const value = item.originalName || item.name
  const nativePrefix = /^[^A-Za-z]+/.exec(value)?.[0].trim()
  return nativePrefix || item.name
}

const categoryLabels: Record<Locale, Record<string, string>> = {
  'zh-Hans': {
    main: '主菜',
    vegetable: '蔬菜',
    cold_appetizer: '凉菜',
    staple: '主食',
    drink: '饮料',
    dessert: '甜品',
  },
  'zh-Hant': {
    main: '主菜',
    vegetable: '蔬菜',
    cold_appetizer: '涼菜',
    staple: '主食',
    drink: '飲料',
    dessert: '甜品',
  },
  en: {
    main: 'Main',
    vegetable: 'Vegetable',
    cold_appetizer: 'Cold appetizer',
    staple: 'Staple',
    drink: 'Drink',
    dessert: 'Dessert',
  },
}

const tagLabels: Record<Locale, Record<string, string>> = {
  'zh-Hans': {
    beef: '牛肉',
    braised: '焖烧',
    cantonese: '粤式',
    centerpiece: '硬菜',
    chicken: '鸡肉',
    cold: '凉爽',
    comforting: '舒服',
    crisp: '酥脆',
    crunchy: '爽脆',
    drink: '饮料',
    fresh: '清爽',
    fried: '香煎',
    lamb: '羊肉',
    light: '清淡',
    noodle: '面食',
    pork: '猪肉',
    rich: '浓郁',
    roasted: '烧味',
    savory: '咸香',
    seafood: '海鲜',
    shareable: '适合分享',
    snack: '小吃',
    soup: '汤羹',
    spicy: '辣',
    starchy: '管饱',
    sweet: '甜口',
    vegetable: '蔬菜',
    wok_fried: '镬气',
    'wok-fried': '镬气',
  },
  'zh-Hant': {
    beef: '牛肉',
    braised: '燜燒',
    cantonese: '粵式',
    centerpiece: '硬菜',
    chicken: '雞肉',
    cold: '涼爽',
    comforting: '舒服',
    crisp: '酥脆',
    crunchy: '爽脆',
    drink: '飲料',
    fresh: '清爽',
    fried: '香煎',
    lamb: '羊肉',
    light: '清淡',
    noodle: '麵食',
    pork: '豬肉',
    rich: '濃郁',
    roasted: '燒味',
    savory: '鹹香',
    seafood: '海鮮',
    shareable: '適合分享',
    snack: '小吃',
    soup: '湯羹',
    spicy: '辣',
    starchy: '管飽',
    sweet: '甜口',
    vegetable: '蔬菜',
    wok_fried: '鑊氣',
    'wok-fried': '鑊氣',
  },
  en: {
    beef: 'Beef',
    braised: 'Braised',
    cantonese: 'Cantonese',
    centerpiece: 'Centerpiece',
    chicken: 'Chicken',
    cold: 'Cold',
    comforting: 'Comforting',
    crisp: 'Crisp',
    crunchy: 'Crunchy',
    drink: 'Drink',
    fresh: 'Fresh',
    fried: 'Fried',
    lamb: 'Lamb',
    light: 'Light',
    noodle: 'Noodles',
    pork: 'Pork',
    rich: 'Rich',
    roasted: 'Roasted',
    savory: 'Savory',
    seafood: 'Seafood',
    shareable: 'Shareable',
    snack: 'Snack',
    soup: 'Soup',
    spicy: 'Spicy',
    starchy: 'Filling',
    sweet: 'Sweet',
    vegetable: 'Vegetable',
    wok_fried: 'Wok-fried',
    'wok-fried': 'Wok-fried',
  },
}
