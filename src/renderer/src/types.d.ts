import { ElectronAPI } from '@electron-toolkit/preload'

// Extend the existing window.api interface with the screen capture protection methods
declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      overlay: {
        show: (opts?: any) => void
        hide: () => void
        updateContent: (content: string) => void
        move: (args: { x?: number; y?: number; displayId?: number }) => void
        setOpacity: (opacity: number) => void
        setSize: (size: { width: number; height: number }) => void
        setClickThrough: (clickThrough: boolean) => void
        getState: () => Promise<any>
        onContentUpdate: (cb: (content: string) => void) => void
      }
      main: {
        setOpacity: (opacity: number) => void
        setSize: (size: { width: number; height: number }) => void
        setClickThrough: (clickThrough: boolean) => void
        onClickThroughToggled?: (cb: (state: boolean) => void) => void
        closeApp: () => void
        minimize: () => void
        // Screen capture protection methods
        hideFromCapture: () => Promise<boolean>
        showInCapture: () => Promise<boolean>
        getCaptureState: () => Promise<{ 
          supported: boolean; 
          hidden?: boolean; 
          affinity?: number; 
          error?: string 
        }>
      }
      chatbot: {
        askMcp: (prompt: any) => Promise<any>
      }
    }
  }
}

export {}
