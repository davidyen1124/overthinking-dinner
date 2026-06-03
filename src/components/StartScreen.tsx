import { Minus, Plus, Sparkles, Users } from 'lucide-react'
import { Button, IconButton, SegmentedControl } from '@radix-ui/themes'
import { copy, isLocale, localeNames, locales } from '../lib/i18n'
import { restaurantName } from '../lib/menu-labels'
import type { Locale } from '../lib/i18n'
import type { Appetite, RestaurantMenu, Vibe } from '../types'

type StartScreenProps = {
  menu: RestaurantMenu
  peopleCount: number
  appetite: Appetite
  vibe: Vibe
  locale: Locale
  onPeopleChange: (value: number) => void
  onAppetiteChange: (value: Appetite) => void
  onVibeChange: (value: Vibe) => void
  onLocaleChange: (value: Locale) => void
  onStart: () => void
}

export function StartScreen({
  menu,
  peopleCount,
  appetite,
  vibe,
  locale,
  onPeopleChange,
  onAppetiteChange,
  onVibeChange,
  onLocaleChange,
  onStart,
}: StartScreenProps) {
  const text = copy[locale]

  return (
    <main className="app-screen app-screen-start flex min-h-svh w-full flex-col justify-between px-4 pb-6 pt-6">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2 text-[#9e1f2d]">
            <Sparkles size={20} fill="currentColor" />
            <span className="text-sm font-black uppercase tracking-wide">{text.appTitle}</span>
          </div>
          <div className="w-36">
            <div className="sr-only">{text.language}</div>
            <SegmentedControl.Root
              className="app-segmented app-segmented-3 app-segmented-compact"
              radius="medium"
              size="1"
              value={locale}
              onValueChange={(value) => {
                if (isLocale(value)) onLocaleChange(value)
              }}
            >
              {locales.map((value) => (
                <SegmentedControl.Item
                  key={value}
                  className="text-xs font-black leading-tight"
                  value={value}
                >
                  {localeNames[value]}
                </SegmentedControl.Item>
              ))}
            </SegmentedControl.Root>
          </div>
        </div>
        <h1 className="mt-5 text-4xl font-black leading-[0.95] text-[#251814]">
          {restaurantName(menu.restaurant, locale)}
        </h1>
        <div className="mt-8 space-y-6">
          <section>
            <div className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#3b2921]">
              <Users size={17} />
              {text.partySizeQuestion}
            </div>
            <div className="app-control-panel flex items-center justify-between rounded-[8px] border border-[#e7d5b7] px-3 py-3 shadow-sm">
              <IconButton
                className="app-stepper-button app-stepper-button-muted active:scale-95"
                disabled={peopleCount <= 1}
                type="button"
                aria-label={text.decreasePeople}
                onClick={() => onPeopleChange(Math.max(1, peopleCount - 1))}
              >
                <Minus size={22} strokeWidth={2.4} />
              </IconButton>
              <div className="text-center">
                <div className="text-5xl font-black leading-none text-[#251814]">{peopleCount}</div>
                <div className="mt-1 text-xs font-bold uppercase tracking-wide text-[#846455]">
                  {text.peopleUnit}
                </div>
              </div>
              <IconButton
                className="app-stepper-button app-stepper-button-primary active:scale-95"
                disabled={peopleCount >= 8}
                type="button"
                aria-label={text.increasePeople}
                onClick={() => onPeopleChange(Math.min(8, peopleCount + 1))}
              >
                <Plus size={22} strokeWidth={2.4} />
              </IconButton>
            </div>
          </section>

          <section>
            <div className="mb-2 text-sm font-extrabold text-[#3b2921]">{text.appetite}</div>
            <SegmentedControl.Root
              className="app-segmented app-segmented-3"
              radius="medium"
              size="3"
              value={appetite}
              onValueChange={(value) => onAppetiteChange(value as Appetite)}
            >
              <SegmentedControl.Item className="text-sm font-extrabold leading-tight" value="light">
                {text.appetiteLight}
              </SegmentedControl.Item>
              <SegmentedControl.Item className="text-sm font-extrabold leading-tight" value="normal">
                {text.appetiteNormal}
              </SegmentedControl.Item>
              <SegmentedControl.Item className="text-sm font-extrabold leading-tight" value="hungry">
                {text.appetiteHungry}
              </SegmentedControl.Item>
            </SegmentedControl.Root>
          </section>

          <section>
            <div className="mb-2 text-sm font-extrabold text-[#3b2921]">{text.vibe}</div>
            <SegmentedControl.Root
              className="app-segmented app-segmented-4"
              radius="medium"
              size="3"
              value={vibe}
              onValueChange={(value) => onVibeChange(value as Vibe)}
            >
              <SegmentedControl.Item className="text-sm font-extrabold leading-tight" value="safe">
                {text.vibeSafe}
              </SegmentedControl.Item>
              <SegmentedControl.Item className="text-sm font-extrabold leading-tight" value="balanced">
                {text.vibeBalanced}
              </SegmentedControl.Item>
              <SegmentedControl.Item className="text-sm font-extrabold leading-tight" value="adventurous">
                {text.vibeAdventurous}
              </SegmentedControl.Item>
              <SegmentedControl.Item className="text-sm font-extrabold leading-tight" value="surprise">
                {text.vibeSurprise}
              </SegmentedControl.Item>
            </SegmentedControl.Root>
          </section>
        </div>
      </div>

      <div className="pt-6">
        <Button
          className="app-start-button text-base font-black shadow-lg shadow-[#9e1f2d]/20 active:scale-[0.99]"
          type="button"
          onClick={onStart}
        >
          <Sparkles size={19} fill="currentColor" />
          {text.start}
        </Button>
      </div>
    </main>
  )
}
