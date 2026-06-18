'use client'

import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { OrderGuideScreen } from '../components/OrderGuideScreen'
import { StartScreen } from '../components/StartScreen'
import { copy, defaultLocale, normalizeLocale } from '../lib/i18n'
import { apiErrorCodes } from '../lib/api-errors'
import type { Locale } from '../lib/i18n'
import type {
  Appetite,
  GuideResponse,
  RecommendRequest,
  RestaurantMenu,
  Vibe,
} from '../types'
import type { ApiErrorCode, ApiErrorResponse } from '../lib/api-errors'

type Screen = 'start' | 'menu'

const LOCALE_STORAGE_KEY = 'menu-buddy-locale-v2'

type OrderState = {
  selectedItemIds: string[]
  dismissedItemIds: string[]
  orderOpen: boolean
}

export function OverthinkingDinner() {
  const [menu, setMenu] = useState<RestaurantMenu | null>(null)
  const [screen, setScreen] = useState<Screen>('start')
  const [peopleCount, setPeopleCount] = useState(3)
  const [appetite, setAppetite] = useState<Appetite>('normal')
  const [vibe, setVibe] = useState<Vibe>('balanced')
  const [locale, setLocaleState] = useState<Locale>(defaultLocale)
  const [localeReady, setLocaleReady] = useState(false)
  const [orderState, setOrderState] = useState<OrderState>({
    selectedItemIds: [],
    dismissedItemIds: [],
    orderOpen: false,
  })
  const [guide, setGuide] = useState<GuideResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>()
  const { selectedItemIds, dismissedItemIds, orderOpen } = orderState
  const text = copy[locale]

  useEffect(() => {
    let active = true
    async function loadMenu() {
      try {
        const response = await fetch('/api/menu')
        if (!response.ok) throw new Error(text.menuLoadFailed)
        const data = (await response.json()) as RestaurantMenu
        if (active) setMenu(data)
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : text.menuLoadFailed)
      }
    }

    void loadMenu()

    return () => {
      active = false
    }
  }, [text.menuLoadFailed])

  useEffect(() => {
    let active = true
    queueMicrotask(() => {
      if (!active) return
      setLocaleState(normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY)))
      setLocaleReady(true)
    })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!localeReady) return
    document.documentElement.lang = locale
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  }, [locale, localeReady])

  function setLocale(value: Locale) {
    setLocaleState(value)
    setError(undefined)
  }

  function addItem(itemId: string) {
    setOrderState((current) =>
      current.selectedItemIds.includes(itemId)
        ? current
        : {
            ...current,
            selectedItemIds: [...current.selectedItemIds, itemId],
            dismissedItemIds: current.dismissedItemIds.filter((id) => id !== itemId),
          },
    )
    if (guide?.status === 'complete') setGuide(null)
    setError(undefined)
  }

  function removeItem(itemId: string) {
    setOrderState((current) => {
      const selectedItemIds = current.selectedItemIds.filter((id) => id !== itemId)
      return {
        ...current,
        selectedItemIds,
        orderOpen: selectedItemIds.length > 0 && current.orderOpen,
      }
    })
    setGuide((current) => (current?.status === 'complete' ? null : current))
    setError(undefined)
  }

  async function requestGuide(
    ids = selectedItemIds,
    baseDismissedItemIds = dismissedItemIds,
    currentGuide = guide,
  ) {
    const skippedFromCurrentRound =
      currentGuide?.status === 'pairing'
        ? currentGuide.recommendedItemIds.filter((id) => !ids.includes(id))
        : []
    const nextDismissedItemIds = uniqueIds([...baseDismissedItemIds, ...skippedFromCurrentRound]).filter(
      (id) => !ids.includes(id),
    )

    setOrderState((current) => ({
      ...current,
      dismissedItemIds: nextDismissedItemIds,
    }))
    setLoading(true)
    setError(undefined)
    const body: RecommendRequest = {
      locale,
      peopleCount,
      appetite,
      vibe,
      selectedItemIds: ids,
      dismissedItemIds: nextDismissedItemIds,
    }

    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await readJson(response)
      if (!response.ok) {
        const code = apiErrorCodeFromResponse(data)
        throw new Error(code ? text.apiErrors[code] : text.aiFailed)
      }
      const guide = data as GuideResponse
      setGuide(guide)
      if (guide.status === 'complete') {
        setOrderState((current) => ({ ...current, orderOpen: true }))
      }
      setScreen('menu')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : text.aiFailed)
    } finally {
      setLoading(false)
    }
  }

  if (!menu) {
    return (
      <main className="app-screen app-screen-loading grid min-h-svh w-full place-items-center px-4">
        <div className="text-center">
          <LoaderCircle className="mx-auto animate-spin text-[#9e1f2d]" size={34} />
          <div className="mt-3 text-sm font-black uppercase tracking-wide text-[#705142]">
            {text.loadingMenu}
          </div>
          {error ? <p className="mt-3 text-sm font-bold text-[#8c2c22]">{error}</p> : null}
        </div>
      </main>
    )
  }

  if (screen === 'start') {
    return (
      <StartScreen
        menu={menu}
        peopleCount={peopleCount}
        appetite={appetite}
        vibe={vibe}
        locale={locale}
        onPeopleChange={setPeopleCount}
        onAppetiteChange={setAppetite}
        onVibeChange={setVibe}
        onLocaleChange={setLocale}
        onStart={() => {
          setScreen('menu')
          setOrderState((current) => ({
            ...current,
            selectedItemIds: [],
            dismissedItemIds: [],
            orderOpen: false,
          }))
          setGuide(null)
          void requestGuide([], [], null)
        }}
      />
    )
  }

  return (
    <OrderGuideScreen
      menu={menu}
      peopleCount={peopleCount}
      selectedIds={selectedItemIds}
      guide={guide}
      orderOpen={orderOpen}
      loading={loading}
      locale={locale}
      error={error}
      onBack={() => setScreen('start')}
      onAddItem={addItem}
      onRemoveItem={removeItem}
      onContinue={() => requestGuide()}
      onToggleOrder={() => setOrderState((current) => ({ ...current, orderOpen: !current.orderOpen }))}
    />
  )
}

function uniqueIds(ids: string[]) {
  return [...new Set(ids)]
}

async function readJson(response: Response) {
  try {
    return (await response.json()) as unknown
  } catch {
    return null
  }
}

function apiErrorCodeFromResponse(data: unknown): ApiErrorCode | null {
  const error =
    data && typeof data === 'object' ? (data as Partial<ApiErrorResponse>).error : undefined
  const code = error && typeof error === 'object' ? error.code : undefined

  return typeof code === 'string' && (apiErrorCodes as readonly string[]).includes(code)
    ? (code as ApiErrorCode)
    : null
}
