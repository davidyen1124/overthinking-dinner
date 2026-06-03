# Overthinking Dinner

![Overthinking Dinner cover](.github/assets/overthinking-dinner.png)

## TL;DR

We had a menu. We had hunger. Tragically, we also had AI.

`overthinking-dinner` is a local ordering assistant for the ancient civic crisis of deciding what three people should eat. Pick the party size, appetite, and general level of chaos; it recommends real dishes from the menu and keeps going until everyone can stop pretending they had a strong opinion.

The current menu is Yaichi in Milpitas. Another restaurant can be swapped in through `src/data/restaurant-menu.json`, assuming you too enjoy turning dinner into structured data.

## Screenshots

<p align="center">
  <img src=".github/assets/screenshot-start-en.png" alt="English mobile start screen" width="230">
  <img src=".github/assets/screenshot-recommendations-en.png" alt="English mobile recommendations with three dishes" width="230">
  <img src=".github/assets/screenshot-final-order-en.png" alt="English mobile final order panel" width="230">
</p>

## What It Does, Unfortunately

- Recommends actual menu item IDs instead of hallucinating a $38 seasonal metaphor.
- Balances party size, appetite, staples, vegetables, texture, spice, and shareability.
- Speaks Simplified Chinese, Traditional Chinese, and English, because indecision is international.
- Uses source dish photos when the restaurant has them, and a suspicious little placeholder when it does not.
- Calls a server-side AI API through the app's recommendation route, so deployed builds do not need local Codex auth.

## Run It

```bash
npm install
npm run dev
```

Create `.env.local` from `.env.example` and set `MENU_BUDDY_AI_API_URL` before using recommendations locally.

Open `http://localhost:3000`.

Useful rituals:

```bash
npm run lint
npm run typecheck
npm run build
```

## The Big Idea

Some apps solve problems.

This one preserves the problem, wraps it in a context window, and ships it.
