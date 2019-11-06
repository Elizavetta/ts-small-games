import { LineType, Sand } from './Line';
import { ObjectType, ObstacleVariant, MovableVariant } from './Object';
import { M2 } from '../shared/M2';
import { GameConfig } from './GameConfig';
export let _DemoMap = {
    lines:[
        {
            type: LineType.SAND,
            lineCount: 2,
            objects:[
                {
                    type: ObjectType.OBSTACLE,
                    variant: ObstacleVariant.STONE,
                    pos: {
                        x: M2.rand(100, 1000),
                        y: GameConfig.LineHeight
                    }
                }
            ]
        },
        {
            type: LineType.RIVER,
            lineCount: 2,
            objects: [
                {
                    type: ObjectType.MOVABLE,
                    variant: MovableVariant.TURTLE,
                    speed: 1.5,
                    pos: {
                        x: M2.rand(100, 1000),
                        y: GameConfig.LineHeight
                    }
                }
            ]
        },
        {
            type: LineType.SAND,
            lineCount: 2,
            objects:[
                {
                    type: ObjectType.OBSTACLE,
                    variant: ObstacleVariant.STONE,
                    pos: {
                        x: M2.rand(100, 1000),
                        y: GameConfig.LineHeight
                    }
                }
            ]
        },
        {
            type: LineType.RIVER,
            lineCount: 4,
            objects: [
                {
                    type: ObjectType.MOVABLE,
                    variant: MovableVariant.TIMBER,
                    speed: -2,
                    pos: {
                        x: M2.rand(100, 1000),
                        y: GameConfig.LineHeight * 1.5
                    }
                },
                {
                    type: ObjectType.MOVABLE,
                    variant: MovableVariant.TIMBER,
                    speed: 3,
                    pos: {
                        x: M2.rand(100, 1000),
                        y: GameConfig.LineHeight * 3
                    }
                }
            ]
        }
    ]
}

const ends = {
        type: LineType.ENDING, // alisa to SAND, но можно и не маркировать. Последний всегда им будет
        lineCount: 1,
        objects:[
            {
                type: ObjectType.OBSTACLE,
                variant: ObstacleVariant.STONE,
                pos: {
                    x: M2.rand(100, 1000),
                    y: 72
                }
            }
        ]
    }
;

const lines = 8;
const speeds = [2, 3, 4];

export function genMap(level: number) {
    let result = [];
    const ls = _DemoMap.lines;
    const s = speeds[level - 1];
    
    const obv = [ObstacleVariant.BUSH, ObstacleVariant.RAAD, ObstacleVariant.STONE];

    for(let i = 0; i < lines; i++){
        
        for(let j = 0; j < ls.length; j++) {
            
            let l =  JSON.parse(JSON.stringify(ls[j]));
            
            if(l.type == LineType.RIVER) {

                for(let o of l.objects) {
                    
                    //@ts-ignore
                    const sp = (s * 0.5 + Math.random() * s * 1.5);
                    
                    //@ts-ignore
                    o.speed = sp * ( (Math.random() * 32 > 16) ? -1 : 1 );
                    if(o.variant == MovableVariant.TURTLE) {
                        o.speed = M2.clamp(o.speed , -2, 2);
                    }
                    
                }
            }

            if(l.type == LineType.SAND) {
                for(let o of l.objects) {
                    
                    o.variant = obv[ Math.random() * obv.length | 0];
                    o.pos.x = M2.rand(100, 1000);
                }
            }

            result.push(l);
        }
        
    }

    result.push(ends);

    return {
        lines: result
    }
}