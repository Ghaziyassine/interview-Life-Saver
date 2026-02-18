import { ElectronAPI } from '@electron-toolkit/preload'

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
        closeApp: () => void // Added closeApp method
        minimize: () => void // Added minimize method
        // Screen capture control
        hideFromCapture: () => Promise<boolean>
        showInCapture: () => Promise<boolean>
        getCaptureState: () => Promise<{ supported: boolean; hidden?: boolean; affinity?: number; error?: string }>
      }
      chatbot: {
        askMcp: (prompt: any) => Promise<any>
        setModel: (model: string) => Promise<any>
        getModel: () => Promise<{ model: string }>
        setApiKey: (apiKey: string) => Promise<{ success: boolean }>
        getApiKey: () => Promise<{ hasKey: boolean; maskedKey: string }>
      }
      room: {
        connect: () => Promise<{ success: boolean }>
        disconnect: () => Promise<{ success: boolean }>
        send: (msg: any) => Promise<{ success: boolean }>
        getStatus: () => Promise<string>
        onMessage: (cb: (data: any) => void) => void
        onStatus: (cb: (status: string) => void) => void
        removeAllListeners: () => void
      }
    }
  }
}
