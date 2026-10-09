# Accessibility

How I checked the app for accessibility, what I found, and what I changed.

## How it was checked

1. **Lighthouse** (accessibility category) on every page. Run it again with
   `node scripts/lighthouse-audit.mjs` while the app is running. It prints a
   table and saves full HTML reports in `lighthouse-reports/`.
2. **axe-core** inside the Playwright tests (`e2e/accessibility.spec.ts`).
   Lighthouse only looks at a page once, in light mode. axe runs on all 7
   pages in light, dark, and dark + large text, plus the open ⋮ menu and the
   open add-word form. It also checks the generated student files in
   `e2e/generate-view.spec.ts`.
3. **Keyboard tests** for the things automatic tools can't judge: the skip
   link, the ⋮ menu (Enter opens, Escape closes and returns focus), and a
   different title on every page.

Run all of them with `npm run test:e2e`.

## Results

Lighthouse accessibility score, before and after the fixes:

| Page | Before | After |
| --- | --- | --- |
| Home | 100 | 100 |
| Wordle | 89 | 100 |
| Word Search | 94 | 100 |
| Manage | 94 | 100 |
| Dashboard | 100 | 100 |
| About | 100 | 100 |
| Settings | 100 | 100 |
| Generated Wordle file | 97 | 100 |
| Generated Word Search file | 96 | 100 |

The stricter axe checks failed 14 of 26 times before the fixes (mostly dark
mode and the form labels) and pass 26 of 26 after. I'm noting that Lighthouse
said 100 for Home and Settings while axe still found dark-mode contrast
problems on them. A score of 100 only means "nothing automatic was found" in
the one mode it tested.

## What was wrong and what I changed

| Problem | Where | Fix | WCAG |
| --- | --- | --- | --- |
| Form controls had a visible label, but it wasn't linked to the control | Wordle, Word Search, Manage (dropdowns, number input, word input) | `htmlFor` / `id` on the labels, `aria-label` where there is no visible label | 1.3.1, 3.3.2, 4.1.2 |
| Phoneme buttons were named only by their hint ("th, as in thin"), so the visible symbol θ wasn't part of the name. Voice-control users could not say what they could see | Every phoneme button, and the downloaded Wordle file | Name is now "θ (th, as in thin)" | 2.5.3 |
| Button text was too faint in dark mode (white text on the light blue primary colour, and on the orange accent colour) | Settings, Home, builder pages | New `--on-primary` and `--on-accent` colours that change with the theme | 1.4.3 |
| Red "Delete" text and the red error box ignored the dark theme | Manage page | Use the theme's `--danger` colours, and the error is announced (`role="alert"`) | 1.4.3, 4.1.3 |
| No way to skip the navigation | Every page | "Skip to main content" link, and `<main>` can receive focus | 2.4.1 |
| Every page had the same tab title | Every page | A title per page, like "Wordle \| Phoneme Builder" | 2.4.2 |
| ⋮ menu could not be closed with the keyboard | Nav bar | Escape closes it and puts focus back on the button, clicking outside closes it, `aria-controls` added | 2.1.1, 4.1.2 |
| Focus ring was only the browser default | Whole site | One clear 3px ring in the theme colour | 2.4.7 |
| Downloaded files had no `<main>`, and "Correct!" / "All words found!" were not announced | Generated Wordle and Word Search files | Wrapped in `<main>`, result message is a polite live region | 1.3.1, 4.1.3 |

## Things I designed in from the start

- Wordle tile states use a different border style as well as a colour, so
  they don't depend on colour alone (Task 1).
- Dashboard alerts say "Error" or "Warning" in words with an icon, and
  results say "✓ Success" or "✕ Failed", so colour isn't the only signal.
- The dashboard chart can be focused column by column with the keyboard, and
  has a "Show as table" button with the same numbers.
- Text size and dark mode are settings (Settings page), and the layout still
  passes the checks with large text on.

## What I have not checked

- I have not tried a real screen reader (NVDA, VoiceOver or Orca). The
  automatic tools can say a name exists, but not whether it is *helpful*
  when spoken. Reading IPA symbols aloud will depend on the screen reader.
- The hover hints for phonemes (the title text) can't be seen on touch
  screens, but the accessible name still includes them.
- Automatic tools find roughly a third of accessibility problems, so a
  passing score is a good start, not proof.
