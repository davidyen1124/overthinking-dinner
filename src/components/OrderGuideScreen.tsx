import { ArrowLeft, Check, LoaderCircle, Plus, ShoppingBag, Sparkles, Trash2, X } from 'lucide-react'
import { Dialog, IconButton } from '@radix-ui/themes'
import { copy } from '../lib/i18n'
import { categoryLabel, dishName, tagLabel } from '../lib/menu-labels'
import type { Locale } from '../lib/i18n'
import type { GuideResponse, MenuItem, RestaurantMenu } from '../types'

const PLACEHOLDER_DISH_IMAGE = '/placeholder-dish.png'

type OrderGuideScreenProps = {
  menu: RestaurantMenu
  peopleCount: number
  selectedIds: string[]
  guide: GuideResponse | null
  orderOpen: boolean
  loading: boolean
  locale: Locale
  error?: string
  onBack: () => void
  onAddItem: (itemId: string) => void
  onRemoveItem: (itemId: string) => void
  onContinue: () => void
  onToggleOrder: () => void
}

export function OrderGuideScreen({
  menu,
  peopleCount,
  selectedIds,
  guide,
  orderOpen,
  loading,
  locale,
  error,
  onBack,
  onAddItem,
  onRemoveItem,
  onContinue,
  onToggleOrder,
}: OrderGuideScreenProps) {
  const selectedItems = selectedIds
    .map((id) => menu.items.find((item) => item.id === id))
    .filter(Boolean) as MenuItem[]
  const recommendedItems = guide
    ? guide.recommendedItemIds
        .map((id) => menu.items.find((item) => item.id === id))
        .filter(Boolean) as MenuItem[]
    : []
  const showFooter = selectedItems.length > 0
  const complete = guide?.status === 'complete'
  const text = copy[locale]

  return (
    <main className={showFooter ? 'min-h-svh w-full pb-20' : 'min-h-svh w-full pb-8'}>
      <header className="sticky top-0 z-20 border-b border-[#ead8b7] bg-[#fff8ea]/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            className="grid h-10 w-10 place-items-center rounded-[8px] bg-[#f2e3c8] text-[#3b2921]"
            type="button"
            aria-label={text.back}
            onClick={onBack}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="text-lg font-black leading-tight text-[#251814]">
              {guide
                ? guide.title
                : loading
                  ? text.preparingFirstRound
                  : text.readyForAi}
            </div>
            <div className="mt-0.5 text-xs font-bold text-[#846455]">
              {text.suitableForPeople(peopleCount)}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-4 px-4 pt-4">
        {guide ? (
          <>
            <section className="rounded-[8px] border border-[#ead8b7] bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2 text-[#9e1f2d]">
                <Sparkles size={18} fill="currentColor" />
                <div className="text-sm font-black uppercase tracking-wide">{guide.title}</div>
              </div>
              <p className="mt-2 text-base font-semibold leading-6 text-[#3b2921]">{guide.description}</p>
            </section>

            {recommendedItems.length ? (
              <section>
                <div className="grid grid-cols-1 gap-3">
                  {recommendedItems.map((item) => {
                    const added = selectedIds.includes(item.id)
                    return (
                      <SuggestionCard
                        key={item.id}
                        item={item}
                        added={added}
                        disabled={loading}
                        locale={locale}
                        onToggle={() => (added ? onRemoveItem(item.id) : onAddItem(item.id))}
                      />
                    )
                  })}
                </div>
              </section>
            ) : null}
          </>
        ) : (
          <section className="space-y-4">
            <div className="rounded-[8px] border border-[#ead8b7] bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2 text-[#9e1f2d]">
                <Sparkles size={19} fill="currentColor" />
                <div className="text-sm font-black uppercase tracking-wide">
                  {loading ? text.aiChoosing : text.aiRecommendation}
                </div>
              </div>
              <h2 className="mt-4 text-3xl font-black leading-none text-[#251814]">
                {loading ? text.findingFirstSet : text.recommendationsWillAppear}
              </h2>
              <p className="mt-3 text-base font-semibold leading-6 text-[#705142]">
                {loading
                  ? text.recommendationBasis
                  : text.restartHint}
              </p>
            </div>
          </section>
        )}

        {error ? (
          <div className="rounded-[8px] border border-[#efc0b8] bg-[#fff3f1] px-3 py-2 text-sm font-bold leading-5 text-[#8c2c22]">
            {error}
          </div>
        ) : null}
      </section>

      <Dialog.Root
        open={orderOpen}
        onOpenChange={(open) => {
          if (open !== orderOpen) onToggleOrder()
        }}
      >
        <Dialog.Content
          className="app-order-dialog shadow-2xl shadow-[#251814]/20"
          size="1"
        >
          <div className="flex items-center justify-between gap-3 border-b border-[#ead8b7] px-4 py-3">
            <div>
              <Dialog.Title className="app-order-dialog-title uppercase tracking-wide">
                {text.selected}
              </Dialog.Title>
              <Dialog.Description className="app-order-dialog-description">
                {text.selectedDishes(selectedItems.length)}
              </Dialog.Description>
            </div>
            <Dialog.Close>
              <IconButton
                className="app-order-icon-button app-order-close-button"
                type="button"
                aria-label={text.closeOrder}
              >
                <X size={18} />
              </IconButton>
            </Dialog.Close>
          </div>

          {guide?.status === 'complete' ? (
            <div className="border-b border-[#ead8b7] bg-[#f7ead4] px-4 py-3">
              <div className="text-sm font-black leading-5 text-[#251814]">{guide.title}</div>
              <p className="mt-1 text-sm font-semibold leading-5 text-[#6c4b3d]">{guide.description}</p>
            </div>
          ) : null}

          <div className="max-h-[50svh] overflow-y-auto px-3 py-2">
            {selectedItems.length ? (
              <div className="space-y-2">
                {selectedItems.map((item) => {
                  const name = dishName(item, locale)
                  return (
                    <div
                      key={item.id}
                      className="grid grid-cols-[56px_1fr_40px] items-center gap-3 rounded-[8px] bg-white p-2 shadow-sm"
                    >
                      <img className="h-14 w-14 rounded-[6px] object-cover" src={dishImageUrl(item)} alt="" />
                      <div className="min-w-0">
                        <div className="truncate text-sm font-black text-[#251814]">{name}</div>
                        <div className="mt-1 truncate text-xs font-bold text-[#846455]">
                          {dishMeta(item, locale)}
                        </div>
                      </div>
                      <IconButton
                        className="app-order-icon-button app-order-remove-button"
                        type="button"
                        aria-label={text.removeDish(name)}
                        onClick={() => onRemoveItem(item.id)}
                      >
                        <Trash2 size={17} />
                      </IconButton>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="px-2 py-8 text-center text-sm font-bold leading-5 text-[#705142]">
                {text.emptyOrder}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Root>

      {showFooter ? (
        <footer className="fixed inset-x-0 bottom-0 z-30 w-full border-t border-[#ead8b7] bg-[#fff8ea]/95 px-4 pb-3 pt-3 backdrop-blur">
          <div className="grid grid-cols-2 gap-2">
            <button
              className={[
                'flex h-12 items-center justify-center gap-2 rounded-[8px] px-2 text-sm font-black active:scale-[0.99] disabled:opacity-60',
                orderOpen ? 'bg-[#f2e3c8] text-[#3b2921]' : 'bg-[#9e1f2d] text-white',
              ].join(' ')}
              type="button"
              disabled={loading || selectedItems.length === 0}
              onClick={onToggleOrder}
            >
              <ShoppingBag size={17} />
              {text.selected} {selectedItems.length}
            </button>
            <button
              className="flex h-12 items-center justify-center gap-2 rounded-[8px] bg-[#251814] px-2 text-sm font-black text-white active:scale-[0.99] disabled:opacity-60"
              type="button"
              disabled={loading || complete}
              onClick={onContinue}
            >
              {loading ? (
                <LoaderCircle className="animate-spin" size={17} />
              ) : complete ? (
                <Check size={17} />
              ) : (
                <Sparkles size={17} fill="currentColor" />
              )}
              {complete ? text.complete : text.next}
            </button>
          </div>
        </footer>
      ) : null}
    </main>
  )
}

function SuggestionCard({
  item,
  added,
  disabled,
  locale,
  onToggle,
}: {
  item: MenuItem
  added: boolean
  disabled: boolean
  locale: Locale
  onToggle: () => void
}) {
  const text = copy[locale]
  const name = dishName(item, locale)
  const meta = dishMeta(item, locale)

  return (
    <article className="grid grid-cols-[112px_1fr] overflow-hidden rounded-[8px] border border-[#ead8b7] bg-white shadow-sm">
      <img className="h-full min-h-32 w-full object-cover" src={dishImageUrl(item)} alt={name} />
      <div className="flex min-w-0 flex-col justify-between p-3">
        <div>
          <h3 className="text-base font-black leading-tight text-[#251814]">{name}</h3>
          <div className="mt-1 truncate text-xs font-bold text-[#846455]">{meta}</div>
          <div className="mt-2 flex gap-1 overflow-hidden">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="shrink-0 rounded-[6px] bg-[#f4e6ce] px-2 py-1 text-[11px] font-extrabold text-[#765343]"
              >
                {tagLabel(tag, locale)}
              </span>
            ))}
          </div>
        </div>
        <button
          className={[
            'mt-3 flex h-10 items-center justify-center gap-2 rounded-[8px] text-sm font-black active:scale-[0.99] disabled:opacity-60',
            added ? 'bg-[#e5f4db] text-[#2e6423]' : 'bg-[#9e1f2d] text-white',
          ].join(' ')}
          type="button"
          aria-label={added ? text.removeDish(name) : text.addDish(name)}
          aria-pressed={added}
          disabled={disabled}
          onClick={onToggle}
        >
          {added ? <Check size={16} /> : <Plus size={16} />}
          {added ? text.added : text.add}
        </button>
      </div>
    </article>
  )
}

function dishImageUrl(item: MenuItem) {
  return item.photoUrl || PLACEHOLDER_DISH_IMAGE
}

function dishMeta(item: MenuItem, locale: Locale) {
  return [categoryLabel(item.category, locale), item.price].filter(Boolean).join(' · ')
}
