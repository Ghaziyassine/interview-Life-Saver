
#  Interview-Life-Saver — Undetectable Transparent Chatbot for cheating

> A powerful Electron-based overlay engine designed for live content display, AI assistance, and transparent overlays — all without interfering with the user's active window or appearing in screen shares or recordings.

---

<p align="center">
  <img src="https://github.com/user-attachments/assets/e49c81cd-719d-4347-8f60-0f88b542e54d" width="500" />
</p>

## 🚀 Overview

**StealthOverlay** is a desktop productivity tool and overlay manager built with Electron. It allows you to display real-time, interactive, or static content on top of your screen — without triggering detection from applications like coding test platforms (HackerRank, CodeSignal), video calls (Google Meet), or screen recording software (Xbox Game Bar, Zoom, OBS).

Whether you're building an internal assistant, testing anti-cheat systems, or presenting complex workflows with non-invasive overlays, this tool has you covered.

---

## 🎯 Purpose

- ✅ Display real-time info (like AI suggestions, references, or instructions) without disrupting focus.
- ✅ Bypass focus detection by cheating-prevention systems.
- ✅ Ensure overlays are not captured in common screen shares or recordings.
- ✅ Provide a hidden UI layer for internal tools or automation.
- ✅ Useful for:
  - Interview platforms testing
  - Screen-share-based demos
  - Competitive programming
  - Productivity overlays
  - Developer assistant UIs

---

## 🛠️ Features

### 🧱 Overlay Core
- 🔲 `Transparent` and `Always on Top` overlay window.
- 🪟 Hidden from taskbar and `Alt+Tab`.
- 🖱️ Click-through mode (`setIgnoreMouseEvents`) for complete invisibility.
- 📐 Adjustable position and size.
- 🕶️ Optional "stealth mode" toggle via keyboard shortcut.
- 📸 Hidden Screenshot capture
### 🔥 Stealth Features
- ✅ Hidden from:
  - Taskbar / Dock
  - Alt+Tab window switcher
  - Google Meet & Zoom tab shares
  - Windows Xbox Game Bar recordings (`Win + Alt + R`)
- ✅ Not focusable (doesn’t steal tab focus).
- ✅ Visible only in true **full display capture** (e.g., OBS Display Capture).

### 🧠 AI Assistant
- 🤖 Gemini 2.5 Flash integration for real-time question answering or contextual help.
- 🧾 Markdown-capable responses (ideal for code snippets, tables, explanations).
- 🔌 Easily switch to any other LLM endpoint.

### 🎮 Keyboard Shortcuts
| Hotkey             | Action                        |
|--------------------|-------------------------------|
| `Alt + Shift + O`  | Toggle click-through overlay  |
| `Alt + Shift + I`  | Toggle stealth mode           |

### 📡 IPC Commands
- Dynamically show/hide overlay
- Update overlay content
- Change position, opacity, and size
- Switch between stealth and interactive modes

---

## 🖥️ Technologies Used

- 🧪 **Electron**
- ⚡ **Node.js**
- 🧩 **Google Gemini 2.5 Flash API**
- 🎯 **IPC for renderer ⇆ main communication**
- 💡 Optional: OBS, Zoom, Meet for validation

---

## 📦 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/stealth-overlay.git
cd stealth-overlay
```

### Install

```bash
$ npm install
```

### Development

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
# Usage

1. **Start the app**: Run in development mode with `npm run dev` or use the appropriate build command for your OS.
2. **Control the overlay**: Use the control bar to adjust opacity, size, and modes. Access settings for minimize, reset, or close.
3. **Chat with AI**: Type messages or attach images/screenshots to interact with the Gemini-powered chatbot.
4. **Keyboard Shortcuts**:
   - `Alt+Shift+O`: Toggle click-through mode
   - `Alt+Shift+I`: Toggle stealth mode
   - `Ctrl+Arrow Keys`: Move the window

## Environment Variables

- `GEMINI_API_KEY`: Required for Gemini chatbot functionality. Set this in your environment before running the app.

## License

MIT
