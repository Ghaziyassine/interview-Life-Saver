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
      }
    }
  }
}
