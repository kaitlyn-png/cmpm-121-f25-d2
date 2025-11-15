# Sticker Sketchpad

Project for CMPM 121 D2: Sticker Sketchpad
Author: Kaitlyn Eng

Create your own artwork with this sketchpad! You can draw and place stickers down in the pad. Save your beautiful artwork by exporting!

---

## 🎯 Objective

1. Use the tools to create a beautiful drawing

## 🛠️ Technologies

- **TypeScript** – Core game logic
- **Deno + Vite** – Development server and bundling
- **GitHub Pages** – Deployment via GitHub Actions

## 🗺️ Game Mechanics

### Drawing

- Click on the thin or thick marker pen to start drawing
- Keep clicking on the pen button to randomly change the color of your pen

### Stickers

- Use the premade stickers to add to your drawing
- Click the "+" button to add your own custom stickers to the drawing, you can either copy and paste an emoji or use text

### Undo/Redo/Clear

- Click the undo button to undo the previous stroke you made
- Click the redo button to bring back the previous stroke that got rid of
- Click the clear button to clear the entire board and start over

### Export

- Click the export button to save the current sketchpad state to your computer

## 🧩 How to Play

1. Open the deployed site (GitHub Pages)
2. Hold down left mouse button to draw
3. Use the tools to create a drawing
4. When finished, click the export button to upload your drawing!

## 📂 Project Structure

```bash
src/
-- main.ts
-- style.css

public/
-- index.html
```

## 🔧 Development Setup

```bash
# Clone repo
git clone https://github.com/kaitlyn-png/sticker-sketchpad
cd sticker-sketchpad

# Install & run (Deno + Vite)
npm install
npm run dev
```
