import { Assets } from './Assets';
import { GameConfig } from './GameConfig';

export class Splash extends PIXI.AnimatedSprite {
    constructor(res: PIXI.IResourceDictionary) {

        const shit = res[Assets.Assets.splash.name].spritesheet;
        super(shit.animations["splash"], false);
        this.animationSpeed = GameConfig.AnimationFPS / 60;
        this.loop = false;
        this.visible = false;
        this.anchor.set(0.5);
    }

    spawn(pos: PIXI.Point){
        this.position.copyFrom(pos);
        this.visible = true;

        this.gotoAndPlay(0);
        this.onComplete = ()=>{
            this.visible = false;
            this.onComplete = undefined;
        }
    }

    //@ts-ignore
    update(ticker: PIXI.Ticker) {
        if(this.visible)
            super.update(ticker.deltaTime);
    }
}