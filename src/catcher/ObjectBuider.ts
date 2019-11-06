import { Assets } from './Assets';
import { M2 } from '../shared/M2';
import { GameConfig, ObjectType, VARIANTS } from './GameConfig';
import { CustomShapeBuilder } from './CustomShapeBuilder';
import { PhysicContainer } from '../physics/PhysicContainer';
import { PhysicSprite } from './Object';

export class ObjectBuilder {
    
    _tex: PIXI.ITextureDictionary;
    _parent: PhysicContainer;

    constructor(res: PIXI.IResourceDictionary, objectsParent: PhysicContainer){
        this._tex = res[Assets.Assets["game-atlas"].name].textures;
        this._parent = objectsParent;
    }

    createObject(type: string, pos?: {x: number, y: number}, scale: number = 1) {

        let tex = this.getRandomTexture(type);
        
        const obj = new PhysicSprite(tex);
        obj.name = type;
        obj.anchor.set(0.5);
        obj.scale.set(scale);
        obj.type = type;

        obj.setBody({
            mass: 1,
        });

        if(pos) {
            obj.x = pos.x;
            obj.y = pos.y;

            obj.body.update();
        }

        if(this._parent) {
            this._parent.addChild(obj);
        }

        return obj;
    } 

    getRandomTexture(type: string) {
        const varvr = VARIANTS[type];
        let select = type;
        if(varvr){
            const prefex = 1 + M2.randint(varvr);
            select += ' ' + prefex;
        }
        select += '.png';
        return this._tex[select];
    }
}