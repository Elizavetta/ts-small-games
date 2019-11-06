import Shapes from './shapes.json'

export const ObjectType = {
    BOOKS:{
        BOOK_BIG : "books/big three",
        BOOK_MIDDLE : "books/one back big",
        BOOK_MINI : "books/one small"
    },
    SCROLLS: {
        LONG: "scrolls/long",
        ZAG: "scrolls/zagogulinka",
        ZAG_FLIP: "zagogulinka flip"
    },
    ADDITS:{
        OPENED_BOOK: "addits/opened book",
        GLASSES: "addits/glasses"
    }
}

export const VARIANTS = {
    [ObjectType.BOOKS.BOOK_BIG] : 9,
    [ObjectType.BOOKS.BOOK_MIDDLE] : 9,
    [ObjectType.BOOKS.BOOK_MINI]: 3,
    [ObjectType.SCROLLS.ZAG] : 5,
    [ObjectType.ADDITS.OPENED_BOOK]: 3
}

export interface ILevelData {
    free?: number;
    stackToWin: number;
    maxDrops: number;
    gravity: number;
    probs: {[key: string]: number}
}
export const GameConfig = {
    defaulFree: 7,
    keyboardSpeed: 100,
    objectMoveSpeed: 200,
    objectRotateTime: 0.08,
    doubleTapDelay: 250, // ms
    shapes: Shapes,
    mass: {
        [ObjectType.BOOKS.BOOK_BIG]: 3,
        [ObjectType.BOOKS.BOOK_MIDDLE]: 2,
        [ObjectType.BOOKS.BOOK_MINI]: 1,
        [ObjectType.SCROLLS.LONG] : 2,
        [ObjectType.SCROLLS.ZAG] : 2, 
        [ObjectType.ADDITS.GLASSES] : 0.75,
        [ObjectType.ADDITS.OPENED_BOOK] : 1
    },

    levels:
    [
        {
            free : 4,
            stackToWin: 30,
            maxDrops: 50,
            gravity: -10,
            probs: {
                [ObjectType.BOOKS.BOOK_BIG] : 0.3,
                [ObjectType.BOOKS.BOOK_MIDDLE] : 0.2,
                [ObjectType.BOOKS.BOOK_MINI] : 0.15,
                [ObjectType.ADDITS.OPENED_BOOK] : 0.05,
                [ObjectType.ADDITS.GLASSES] : 0.05,
                [ObjectType.SCROLLS.LONG] : 0.1,
                [ObjectType.SCROLLS.ZAG] : 0.1,
                [ObjectType.SCROLLS.ZAG_FLIP] : 0.1
            }
        },
        {
            
            free : 5,
            stackToWin: 40,
            maxDrops: 50,
            gravity: -15,
            probs: {
                [ObjectType.BOOKS.BOOK_BIG] : 0.3,
                [ObjectType.BOOKS.BOOK_MIDDLE] : 0.2,
                [ObjectType.BOOKS.BOOK_MINI] : 0.1,
                [ObjectType.ADDITS.OPENED_BOOK] : 0.05,
                [ObjectType.ADDITS.GLASSES] : 0.05, 
                [ObjectType.SCROLLS.LONG] : 0.1,
                [ObjectType.SCROLLS.ZAG] : 0.1,
                [ObjectType.SCROLLS.ZAG_FLIP] : 0.1
            }
        },
        {
            
            free : 6,
            stackToWin: 50,
            maxDrops: 50,
            gravity: -20,
            probs: {
                [ObjectType.BOOKS.BOOK_BIG] : 0.2,
                [ObjectType.BOOKS.BOOK_MIDDLE] : 0.2,
                [ObjectType.BOOKS.BOOK_MINI] : 0.1,
                [ObjectType.ADDITS.OPENED_BOOK] : 0.075,
                [ObjectType.ADDITS.GLASSES] : 0.075, 
                [ObjectType.SCROLLS.LONG] : 0.1,
                [ObjectType.SCROLLS.ZAG] : 0.1,
                [ObjectType.SCROLLS.ZAG_FLIP] : 0.1
            }
        }
    ]
}
