
export enum PlatformType {
    DISABLED = "disabled", // что бы отрубить прыжок. С такой платформой не взаимодействует перс вообще
    NORMAL = "standart",
    ICE = "ice",
    STICKY = "sticky",
    BRICABLE = "bricable",
    ENDINGS = "endings",
}

export const GameConfig = {
    coinCost: 2,
    groups: {
        ANY: -1,
        PLAYER: 0x1,
        PLATFORM: 0x2,
        BORDER: 0x4,
        BONUSES: 0x8,
        NONE: 0
    },
    levels: [
        {
            platforms: 100,
			platformsMain: 80,
            probs:{
                [PlatformType.ICE]: 0.1,
                [PlatformType.STICKY]: 0.1,
                //[PlatformType.BRICABLE]: 0.1
            },
            things:{
                spikes: 0.1,
                monster: 0.02,
                coins: 0.15,
                balls: 0.05
            }
        },
        {
            platforms: 200,
			platformsMain: 160,
            probs:{
                [PlatformType.ICE]: 0.2,
                [PlatformType.STICKY]: 0.2,
                [PlatformType.BRICABLE]: 0.1
            },
            things:{
                spikes: 0.05,
                monster: 0.015,
                coins: 0.15,
                balls: 0.05
            }
        },
        {
            platforms: 300,
			platformsMain: 240,
            probs:{
                [PlatformType.ICE]: 0.2,
                [PlatformType.STICKY]: 0.2,
                [PlatformType.BRICABLE]: 0.2
            },
            things:{
                spikes: 0.1,
                monster: 0.01,
                coins: 0.15,
                balls: 0.05
            }
        }
    ],
    
    yDistance:{
        min: 4,
        max: 9
    },
    xDistance: {
        min: 1,
        max: 2
    },
    maxHorizontlalCount: 3,
    borderOffsets: 50,
    jumpHeight: 11,
    windowsStep: 1400, // в пикселях платформы
    playerMove: 200,
    icePlatformEffect: {
        duration: 0.05, //длитьельность эффекта секунды,
        strave: 1.5 // мультиплиер к обычной скорости  
    },
    slickPlatformEffect: {
        mult: 0.75 // jump speed multiplicator
    },
    platformHeight: 70,
    platformWidth: 260
}