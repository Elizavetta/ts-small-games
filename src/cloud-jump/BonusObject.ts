import { Circle, Box } from 'p2';
import { PIXEL_TO_METR } from '../physics/constants';
import { Tween } from '@tweenjs/tween.js';
import { GameConfig } from './GameConfig';

export enum BonusObjectType {
    MONSTER = "monster",
    COIN = "coins",
    SPIKES = "spikes",
    BALL = "ball",
    NONE = "none"
}

export class BonusObject extends PIXI.Container {
    type: BonusObjectType;
     
    interract(){

    }

    reset() {

    }

    update(ticker: PIXI.Ticker){

    }
} 

export class Coins extends BonusObject {

    _sprite: PIXI.Sprite;

    constructor(texture: PIXI.Texture){
        super();
        
        this._sprite = new PIXI.Sprite(texture);

        this._sprite.anchor.set(0.5, 0.5);
        this.addChild(this._sprite);
        this.setBody({});
        
        this.body.shapes[0].collisionGroup = GameConfig.groups.BONUSES;
        this.body.shapes[0].collisionMask = GameConfig.groups.PLAYER;
        this.body.shapes[0].sensor = true;
 
        this.type = BonusObjectType.COIN;
    }

    interract() : void{
        this.visible = false;
        this.type = BonusObjectType.NONE;
    }

    reset() {
        this.visible = true;
        this.type = BonusObjectType.COIN;
    }
}

export class Ball extends BonusObject {

    _sprite: PIXI.Sprite;

    constructor(texture: PIXI.Texture){
        super();
        
        this._sprite = new PIXI.Sprite(texture);

        this._sprite.anchor.set(0.5, 0.5);
        this.addChild(this._sprite);
        this.setBody({
            boundsToShape: false,
            shape: new Circle({
                radius: this._sprite.width * 0.4 * PIXEL_TO_METR
            })
        });
        
        this.body.shapes[0].collisionGroup = GameConfig.groups.BONUSES;
        this.body.shapes[0].collisionMask = GameConfig.groups.PLAYER;
        this.body.shapes[0].sensor = true;
        this.type = BonusObjectType.BALL;
        
    }

    interract() : void{
    }

    reset() {
    }
}

export class Spikes extends BonusObject {

    _sprite: PIXI.Sprite;

    constructor(texture: PIXI.Texture){
        super();
        
        const spike = new PIXI.Sprite(texture);
        spike.anchor.set(0.5, 1);
        spike.y = 30;
        this._sprite = spike;
        this.addChild(spike);
        this.type = BonusObjectType.SPIKES;
        this.setBody({});

        this.body.shapes[0].collisionGroup = GameConfig.groups.BONUSES;
        this.body.shapes[0].collisionMask = GameConfig.groups.PLAYER;
        this.body.shapes[0].sensor = true;
    }

    interract() : void{
        const scale = this._sprite.scale.y;

        new Tween(this._sprite.scale)
        .to({y: 2}, 250)
        .onComplete(()=>{
            this._sprite.scale.y = scale;
        }).start();
    }

    reset() {
    }
}

export class Monster extends BonusObject {

    _anim: PIXI.spine.Spine;

    constructor(spine: PIXI.spine.core.SkeletonData){
        super();

        this.type = BonusObjectType.MONSTER;
        this._anim = new PIXI.spine.Spine(spine);
        this._anim.position.y +=this._anim.height;
        
        this._anim.state.setAnimation(0,"Walk", true);

        this.addChild(this._anim);
        
        const box = new Box({
            width: PIXEL_TO_METR * 150,
            height: PIXEL_TO_METR * 150,
        });
        this.setBody({
            boundsToShape: false
        });

        box.sensor = true;

        box.collisionGroup = GameConfig.groups.BONUSES;
        box.collisionMask = GameConfig.groups.PLAYER;
        
        this.body.addShape(box, [0, -PIXEL_TO_METR * this._anim.height * 0.5]);
    }

    interract() : void{
    }

    reset() {
    }

    update(ticker: PIXI.Ticker){

    }
}

