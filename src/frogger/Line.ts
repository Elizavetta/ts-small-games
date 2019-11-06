import { GameObject, ObjectType } from './Object';
import { Assets } from './Assets';
import { M2 } from '../shared/M2';
import { GameConfig } from './GameConfig';
export enum LineType {
    RIVER = "river",
    SAND = "sand",
    ENDING = "end",
    NONE = "none"
}

export enum SandVariant {
    VAR1 = 0, VAR2 = 1, VAR3 = 2, EDGE_TOP = 3, EDGE_BTM = 4    
}

const SANDVARIANT2NAME = [
    "sand 1.png", "sand 2.png", "sand 3.png", "sand edge 1.png", "sand edge 2.png"
];

export class GameLine extends PIXI.Container {
    type: LineType = LineType.NONE;
    objects: GameObject[] = [];
    lineCount: number;

    private _res: PIXI.IResourceDictionary;
    constructor(res: PIXI.IResourceDictionary) {
        super();
        this._res = res;
    }
}

export class River extends GameLine {
    
    type: LineType = LineType.RIVER;
    constructor(res: PIXI.IResourceDictionary) {
        super(res);
    }
}


export class Sand extends GameLine {

    type: LineType = LineType.SAND;
    _sprites: PIXI.Sprite[] = [];
    _lines: number = 1;
    private _textures: PIXI.ITextureDictionary;

    constructor(res: PIXI.IResourceDictionary) {
        super(res);

        this._textures = res[Assets.Assets["game-atlass"].name].textures;
        this.lineCount = 2;
    }

    set lineCount(v: number) {
        if(this._lines == v) return;
        
        this._lines = v;
      
        //привет GC
        this._sprites.forEach((s) => {
            s.destroy();
        });
        
        this._sprites = [];
        for(let i = 0; i < v; i++) {
            let tv = M2.randint(3);
            if(i == 0) tv = SandVariant.EDGE_BTM;
            if(i == v-1) tv = SandVariant.EDGE_TOP;

            const s = new PIXI.Sprite(this._textures[SANDVARIANT2NAME[tv]]);
            s.y = -i * s.height;
            s.pivot.y = s.height;
            this._sprites.push(s);
        }

        this.addChild(...this._sprites);
    }

    get lineCount(){
        return this._lines;
    }

    getAnchor(target: PIXI.Point) {
        
        const h = this.height;
        const dy = this.y - target.y;
        const dyt = this.y - h - target.y;

        if(Math.abs(dy) < Math.abs(dyt)){
            target.y = this.y - GameConfig.LineHeight * 0.5;
            return target;
        }

        target.y = this.y - h + GameConfig.LineHeight * 0.5;
        return target;
    }
}
