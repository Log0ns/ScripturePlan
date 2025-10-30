# Minimal Scripture Reader

A minimalistic and aesthetic iPhone app for reading through scripture. Designed for simplicity and focus, this app helps users track their Bible reading progress using customizable chapter icons.

## Features

- **Tap to Advance**: Each icon represents a reading track. Tapping an icon moves to the next chapter.
- **Hold to Customize**: Long-press an icon to:
  - Choose a starting book and chapter.
  - Set an optional end limit to cycle within a specific range.
- **Multiple Tracks**: Add up to 10 icons, each with its own reading path.
- **Local Storage**: All progress and settings are saved locally on the device.
- **Dynamic Aesthetic**: Background and icon colors adapt to the time of day for a calming visual experience.

## Usage

- Start with two default icons: Genesis and Matthew.
- Tap to read sequentially through chapters and books.
- Long-press to open settings and customize your reading track.
- Add new icons to track multiple reading plans.

## Tech Stack

- **React (TypeScript)**
- **Tailwind CSS**
- **Lucide Icons**
- **Local Storage API**

## Getting Started

1. Clone the repo:
   ```bash
   git clone https://github.com/your-username/scripture-reader.git
   cd scripture-reader
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the app:
   ```bash
   npm start
   ```

## File Overview

- `scripture_reader_app.tsx`: Main component handling UI, state, and logic for chapter navigation and customization.

## Notes

- This app is designed for offline use and does not require a backend.
- Ideal for users who want a distraction-free way to read scripture daily.
