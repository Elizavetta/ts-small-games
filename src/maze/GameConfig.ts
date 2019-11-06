
export interface ILevelData {
    size : number;
    gems: number;
    power?: number; 
}

export const GameConfig = {
    stepDuration: 0.45,
    stepLen: 444,
    gemtopower: 30,
    offsets : {
        top : 500, bottom: 500,
        left : 300, right: 300
    },
    levels:[
        {
            size: 10,
            power: 60,
            gems: 10
        },
        {
            size: 15,
            power: 45,
            gems: 20
        },
        {
            size: 17,
            power: 30,
            gems : 30
        }
    ]
}
