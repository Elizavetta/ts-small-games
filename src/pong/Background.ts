import { Assets } from './Assets';
export class Background extends PIXI.Sprite {

    _overlay: PIXI.Sprite;
    constructor(res: PIXI.IResourceDictionary){
        const tex = res[Assets.Assets.bg_front.name].texture;
        super(tex);
        
        const ovtext = res[Assets.Assets.bg.name].texture;
        this._overlay = new PIXI.Sprite(ovtext);
        this._overlay.visible = false;
        this._overlay.anchor.set(0.5);
        this._overlay.position.set(tex.width * 0.5, tex.height * 0.5);
        this.addChild(this._overlay);
    }

    set level(v: number) {
        this._overlay.visible  = v > 1;
        this._overlay.alpha = 0.5 * (1 - (v - 1) / 3);
        this._overlay.scale.set(1 + (v - 1) * 0.1);
    }
}