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
    appetizer: '前菜',
    main: '主菜',
    pizza: '披萨',
    salad: '沙拉',
    vegetable: '蔬菜',
    cold_appetizer: '凉菜',
    staple: '主食',
    add_on: '加料',
    side_sauce: '蘸酱',
    drink: '饮料',
    dessert: '甜品',
  },
  'zh-Hant': {
    appetizer: '前菜',
    main: '主餐',
    pizza: '披薩',
    salad: '沙拉',
    vegetable: '蔬菜',
    cold_appetizer: '冷盤',
    staple: '主食',
    add_on: '加點',
    side_sauce: '沾醬',
    drink: '飲品',
    dessert: '甜點',
  },
  en: {
    appetizer: 'Appetizer',
    main: 'Main',
    pizza: 'Pizza',
    salad: 'Salad',
    vegetable: 'Vegetable',
    cold_appetizer: 'Cold appetizer',
    staple: 'Staple',
    add_on: 'Add-on',
    side_sauce: 'Side sauce',
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
    cheesy: '芝士',
    cold: '凉爽',
    comforting: '舒服',
    creamy: '奶香',
    crisp: '酥脆',
    crunchy: '爽脆',
    add_on: '加料',
    dessert: '甜品',
    drink: '饮料',
    fresh: '清爽',
    fried: '香煎',
    herby: '香草',
    lamb: '羊肉',
    light: '清淡',
    mushroom: '蘑菇',
    noodle: '面食',
    olive: '橄榄',
    pizza: '披萨',
    pork: '猪肉',
    rich: '浓郁',
    roasted: '烧味',
    salad: '沙拉',
    savory: '咸香',
    sauce: '蘸酱',
    seafood: '海鲜',
    shareable: '适合分享',
    snack: '小吃',
    smoky: '烟熏',
    soup: '汤羹',
    spicy: '辣',
    starchy: '管饱',
    sweet: '甜口',
    tangy: '酸香',
    vegan: '纯素',
    vegetarian: '素食',
    vegetable: '蔬菜',
    wok_fried: '镬气',
    'wok-fried': '镬气',
  },
  'zh-Hant': {
    beef: '牛肉',
    braised: '燉煮',
    cantonese: '粵式',
    centerpiece: '主打',
    chicken: '雞肉',
    cheesy: '起司',
    cold: '清爽',
    comforting: '暖胃',
    creamy: '奶香',
    crisp: '酥脆',
    crunchy: '脆口',
    add_on: '加點',
    dessert: '甜點',
    drink: '飲品',
    fresh: '清爽',
    fried: '炸物',
    herby: '香草',
    lamb: '羊肉',
    light: '清淡',
    mushroom: '菇類',
    noodle: '麵食',
    olive: '橄欖',
    pizza: '披薩',
    pork: '豬肉',
    rich: '濃郁',
    roasted: '燒味',
    salad: '沙拉',
    savory: '鹹香',
    sauce: '沾醬',
    seafood: '海鮮',
    shareable: '適合分食',
    snack: '小點',
    smoky: '煙燻',
    soup: '湯品',
    spicy: '辣',
    starchy: '有飽足感',
    sweet: '甜味',
    tangy: '酸香',
    vegan: '純素',
    vegetarian: '素食',
    vegetable: '蔬菜',
    wok_fried: '熱炒',
    'wok-fried': '熱炒',
  },
  en: {
    beef: 'Beef',
    braised: 'Braised',
    cantonese: 'Cantonese',
    centerpiece: 'Centerpiece',
    chicken: 'Chicken',
    cheesy: 'Cheesy',
    cold: 'Cold',
    comforting: 'Comforting',
    creamy: 'Creamy',
    crisp: 'Crisp',
    crunchy: 'Crunchy',
    add_on: 'Add-on',
    dessert: 'Dessert',
    drink: 'Drink',
    fresh: 'Fresh',
    fried: 'Fried',
    herby: 'Herby',
    lamb: 'Lamb',
    light: 'Light',
    mushroom: 'Mushroom',
    noodle: 'Noodles',
    olive: 'Olive',
    pizza: 'Pizza',
    pork: 'Pork',
    rich: 'Rich',
    roasted: 'Roasted',
    salad: 'Salad',
    savory: 'Savory',
    sauce: 'Sauce',
    seafood: 'Seafood',
    shareable: 'Shareable',
    snack: 'Snack',
    smoky: 'Smoky',
    soup: 'Soup',
    spicy: 'Spicy',
    starchy: 'Filling',
    sweet: 'Sweet',
    tangy: 'Tangy',
    vegan: 'Vegan',
    vegetarian: 'Vegetarian',
    vegetable: 'Vegetable',
    wok_fried: 'Wok-fried',
    'wok-fried': 'Wok-fried',
  },
}
