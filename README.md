
# electron-app

**electron-app** is a modern desktop application built with Electron, React, and TypeScript. It provides a sleek, always-on-top overlay window with a control bar and a built-in AI chatbot powered by Google Gemini (via the Generative Language API). The app is designed for productivity, multitasking, and quick access to AI assistance, with features tailored for seamless desktop integration.

## Features

- **Overlay Window**: Transparent, resizable, and always-on-top overlay for quick access.
- **Control Bar**: Easily adjust opacity, window size, click-through mode, and toggle stealth mode.
- **Stealth Mode**: Instantly hide the control bar and make the overlay less obtrusive.
- **Click-Through**: Allow mouse events to pass through the overlay for unobstructed desktop use.
- **Tray Integration**: Minimize to system tray, restore, or quit from the tray menu.
- **Global Shortcuts**: Use keyboard shortcuts to toggle click-through, stealth mode, and move the window.
- **AI Chatbot**: Chat with Gemini (Google Generative Language API) directly in the overlay, with support for text and image input.
- **Screenshot Support**: Take and send desktop screenshots to the chatbot for context-aware assistance.
- **Cross-Platform**: Works on Windows, macOS, and Linux.

## Screenshots

<!-- Add screenshots here if available -->
![WhatsApp Image 2025-07-02 at 13 53 32](https://github.com/user-attachments/assets/bb33a159-aca2-4d7e-bc7d-8759cdc7eba5)



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
