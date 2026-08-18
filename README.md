# Phoneme Builder — CSE3CWA-(OL-2) - Cloud Web Application Assignment 1

A classroom activity builder for Speech Pathology teachers. Teachers build activities out of phonemes (sounds) and the app turns them into a Wordle
game or a Word Search puzzle, downloadable as one HTML file.

This is Assignment 1, being frontend design only. The Wordle activity uses a single phoneme word (thin), and the Word Search uses a fixed list of five words. Later assessments will add a database-backed word list amongst other features

## To Get Started & ensure pre-requiqusites

```bash
nvm install node
nvm use node
npm install
```
Compile and Start

```bash
npm run build   # production build (also type-checks)
npm run start   # start the build
```
Additonal option if required

```bash
npm run lint    # code checks
```

## Project layout

```
app/            Pages: home, wordle, wordsearch, about, settings
components/     Small reusable pieces (buttons, nav bar, cards)
lib/            Data and logic with no React in it (phonemes, scoring,
                the word search grid, and the two HTML file builders)
```