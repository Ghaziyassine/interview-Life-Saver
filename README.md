#  Interview-Life-Saver — Undetectable Tr### 🔥 Stealth Features
- ✅ Hidden from:
  - Taskbar / Dock
  - Alt+Tab window switcher
  - Google Meet & Zoom tab shares
  - Windows Xbox Game Bar recordings (`Win + Alt + R`)
  - **ALL screen sharing applications and recordings** (using Windows API SetWindowDisplayAffinity)
- ✅ Not focusable (doesn't steal tab focus).
- ✅ Enhanced screen capture protection using native Windows API.
- ✅ Visible only in true **full display capture** (e.g., OBS Display Capture).

### 🛡️ Screen Capture Protection (Windows Only)
- Uses Windows API `SetWindowDisplayAffinity` with `WDA_EXCLUDEFROMCAPTURE` flag
- Makes the application window completely invisible in:
  - All screen recording software
  - Meeting apps screen sharing (Zoom, Teams, Google Meet, etc.)
  - System screenshots (PrintScreen, Snipping Tool)
  - Any third-party screen capture tools
- The window remains fully visible to the user directly on their screen
- Toggle protection on/off with a button in the control bar

### 🧱 Overlay Core
- 🔲 `Transparent` and `Always on Top` overlay window.
- 🪟 Hidden from taskbar and `Alt+Tab`.
- 🖱️ Click-through mode (`setIgnoreMouseEvents`) for complete invisibility.
- 📐 Adjustable position and size.
- 🕶️ Optional "stealth mode" toggle via keyboard shortcut.
- 📸 Hidden Screenshot capture

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
On Windows, you'll need to build the native add-on for screen capture protection:

```bash
# Run the build script (Windows)
.\build-native-addon.bat

# Or manually
cd native-addon\window-utils
npm install
npm run rebuild
cd ..\..
```

> **Note:** The screen capture protection feature requires Visual Studio with C++ desktop development workload and CMake installed.

### Install Dependencies

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
