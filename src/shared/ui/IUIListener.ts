import { ITextBase } from '../Multilang';

export enum IPopup {
    MENU,
    PAUSE,
    CLOSING
}

export interface IUIListener {

    //for translations
    lang: ITextBase;
    setLevel(level: number): void;
    reload(): void;

    // return true - when popup is allowed
    softPause(): boolean;
    softResume(): void;
    popupOpened(popup: IPopup): void;
}