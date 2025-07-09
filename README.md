#  Interview-Life-Saver — Undetectable Transparent Chatbot 

> A powerful Electron-based overlay engine designed for live content display, AI assistance, and transparent overlays — all without interfering with the user's active window or appearing in screen shares or recordings.

---

<p align="center">
  <img src="https://github.com/user-attachments/assets/e49c81cd-719d-4347-8f60-0f88b542e54d" width="500" />
</p>

## 🚀 Overview

**Interview-Life-Saver** is a desktop productivity tool and overlay manager built with Electron. It allows you to display real-time, interactive, or static content on top of your screen — without triggering detection from applications like coding test platforms (HackerRank, CodeSignal), video calls, or screen recording software (Xbox Game Bar).

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
| `Ctrl+Arrow Keys`  | Move the window               |

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

### Clone the repo

```bash
git clone https://github.com/Ghaziyassine/interview-Life-Saver.git
cd interview-Life-Saver
```

### Install

#### Build Native Add-on (for Screen Capture Protection)

On Windows:

```bash
# Run the build script (Windows)
./build-native-addon.bat

# Or manually
cd native-addon/window-utils
npm install
npm run rebuild
cd ../../
```

On macOS/Linux:

```bash
# Navigate to the native-addon directory
cd native-addon/window-utils

# Install dependencies
npm install

# Build using cmake-js
npx cmake-js compile

# Return to the project root
cd ../../
```

> **Note:** Ensure you have CMake installed along with the necessary development tools for your platform (e.g., Xcode command-line tools for macOS, GCC/Clang for Linux).

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
