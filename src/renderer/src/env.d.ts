/// <reference types="vite/client" />

declare interface MainAPI {
  setOpacity: (opacity: number) => void;
  setSize: (size: { width: number; height: number }) => void;
  setClickThrough: (clickThrough: boolean) => void;
  onClickThroughToggled: (cb: (state: boolean) => void) => void;
  closeApp: () => void;
}

declare interface Window {
  api: {
    main: MainAPI;
    overlay: any;
  };
}
