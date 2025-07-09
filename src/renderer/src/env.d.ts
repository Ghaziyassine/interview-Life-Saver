/// <reference types="vite/client" />

declare interface MainAPI {
  setOpacity: (opacity: number) => void;
  setSize: (size: { width: number; height: number }) => void;
  setClickThrough: (clickThrough: boolean) => void;
  onClickThroughToggled: (cb: (state: boolean) => void) => void;
  closeApp: () => void;
  minimize: () => void;
  // Screen capture protection methods
  hideFromCapture: () => Promise<boolean>;
  showInCapture: () => Promise<boolean>;
  getCaptureState: () => Promise<{ 
    supported: boolean; 
    hidden?: boolean; 
    affinity?: number; 
    error?: string 
  }>;
}

declare interface ChatbotAPI {
  askMcp: (prompt: string) => Promise<{ success: boolean; answer?: string; error?: string }>;

}

declare interface Window {
  api: {
    main: MainAPI;
    overlay: any;
    chatbot: ChatbotAPI;
  };
}
