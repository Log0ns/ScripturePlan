# Scripture Plan

A minimal Bible reading and memorization app with four tabs.

## Tabs

### Reading
- Tiles each track an independent reading position in the Bible.
- **Tap** a tile to advance to the next chapter.
- **Hold** a tile to configure its start/end range, chapters per day, or delete it.
- Up to 10 tiles per group, up to 3 groups.
- Optionally opens the chapter in the NET Bible on tap.

### Themes
- Record a short theme (up to 300 chars) for any Bible chapter.
- Browse by book → chapter, with voice dictation support.
- Tiles show SRS progress as a fill gradient and a due date label.
- Overdue tiles are highlighted in red.
- Study due chapters with spaced repetition (SM-2): Again / Hard / Good / Easy.
- Export all recorded themes to a Markdown file.

### Memorization
- Tiles track a 30-day memorization cycle for Scripture passages.
- **Tap** to advance the day counter.
- **Hold** to change the passage or delete the tile.
- Up to 4 tiles.

### Prayer
- Tiles cycle through a list of custom prayer items.
- **Tap** to advance to the next item.
- **Hold** to edit the list or delete the tile.
- Up to 10 tiles.

## Design

- Background and tile colors shift with time of day: morning, afternoon, evening, night.
- Minimal UI with soft gradients.

## Built With

- **React + TypeScript**
- **Tailwind CSS**
- **Lucide Icons**
- **Firebase** (auth + Firestore sync)
- Local storage for offline persistence

## Getting Started

```bash
git clone https://github.com/your-username/scripture-plan.git
cd scripture-plan
npm install
npm run dev
```
