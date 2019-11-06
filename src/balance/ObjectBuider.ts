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

    createObject(type: string, pos?: {x: number, y: number}, scale: number = 0.5) {

        const needFlip = type == ObjectType.SCROLLS.ZAG_FLIP;
        if(needFlip) {
            type = ObjectType.SCROLLS.ZAG;
        }

        let tex = this.getRandomTexture(type);

        if(needFlip) {
        	tex = new PIXI.Texture(tex.baseTexture, tex.frame, tex.orig, tex.trim, tex.rotate | 12);
        }

        let shapeName = type.slice(type.indexOf("/") + 1);
        if( needFlip )
            shapeName +=" flip";
        
        let shapeData = (GameConfig.shapes as any) [shapeName];
        
        const obj = new PhysicSprite(tex);
        obj.name = type;
        obj.anchor.set(0.5);
        obj.scale.set(scale);

        obj.setBody({
            mass: GameConfig.mass[type] || 1,
            boundsToShape : shapeData == undefined
        });

        if(shapeData) {
            const shapes = CustomShapeBuilder.build(shapeData, obj);
            
            for(let s of shapes.shapes)
                obj.body.addShape(s, s.position);
        }

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

        console.log(select);
        return this._tex[select];
    }
}