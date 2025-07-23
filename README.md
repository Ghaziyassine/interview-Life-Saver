#  Interview-Life-Saver — Undetectable Transparent Chatbot 
> A powerful Electron-based overlay engine designed for live content display, AI assistance, and transparent overlays — all without interfering with the user's active window or appearing in screen shares or recordings.



<p align="center">
<img width="846" height="941" alt="image" src="https://github.com/user-attachments/assets/6b1bb4ff-005d-4f79-9428-bc7fae22d71e" />

</p>

## 🚀 Overview

**Interview-Life-Saver** is a desktop productivity tool and overlay manager built with Electron. It allows you to display real-time, interactive, or static content on top of your screen — without triggering detection from applications like coding test platforms (HackerRank, CodeSignal), video calls, or screen recording software.

Whether you're building an internal assistant, testing anti-cheat systems, or presenting complex workflows with non-invasive overlays, this tool has you covered.

---

## 🎯 Purpose

- ✅ Display real-time info (like AI suggestions, references, or instructions) without disrupting focus.
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
  - Entire screen capture (Google Meet, Zoom,Teams, Discord.... ).
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
- show/hide overlay
- Update overlay content
- Change position, opacity, and size
- Switch between stealth and interactive modes

---

## 🛡️ How Screen Share Protection Works

The application uses the Windows API function `SetWindowDisplayAffinity` to hide its window from screen sharing and recording tools. This functionality is currently available **only on Windows**.

For more technical details and API usage, refer to the [Window Utils Native Addon README](native-addon/window-utils/README.md).

#### Key Details:

1. **API Used**:
   - The `SetWindowDisplayAffinity` function is part of the Windows API.
   - The flag `WDA_EXCLUDEFROMCAPTURE` is used to make the window invisible to screen capture tools.

2. **Implementation**:
   - A native C++ addon was created to interact with the Windows API.
   - The addon exposes functions like `setWindowDisplayAffinity`, `resetWindowDisplayAffinity`, and `getWindowDisplayAffinity` to JavaScript via Node.js bindings.
   - These functions are called from the Electron main process to apply the display affinity settings to the app's window.

3. **Behavior**:
   - When `setWindowDisplayAffinity` is called with the `WDA_EXCLUDEFROMCAPTURE` flag, the window becomes invisible to screen sharing and recording tools like Zoom, Teams, and OBS.
   - The window remains visible to the user directly on their screen.

4. **Integration**:
   - The native addon is integrated into the Electron app and controlled via IPC commands from the renderer process.
   - Users can toggle the screen capture protection on or off using the app's UI.

This approach ensures that the app's window is hidden from all screen sharing and recording tools while remaining fully functional and visible to the user.

---

## 📝 Requirements

- **Windows 10/11** (for screen capture protection)
- **Node.js** (v16 or later recommended)
- **npm** (comes with Node.js)
- **Visual Studio** (with C++ desktop development workload, for native addon)
- **CMake** (for building the native addon)
- **Google Gemini API Key** (for AI assistant features)


---

## 📦 Getting Started

### Clone the repo

```bash
git clone https://github.com/Ghaziyassine/interview-Life-Saver.git
cd interview-Life-Saver
```

#### Create .env file
```bash
GEMINI_API_KEY=your_api_key_here
```
#### Build Native Add-on (for Screen Capture Protection)

On Windows (if you use another OS ignore this):

```bash
# Run the build script (Windows)
./build-native-addon.bat
```

 **Note:** Building the Native Add-on requires Visual Studio with C++ desktop development workload and CMake installed in your machine.
 
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
