import { Assets } from './Assets';
export class Water extends PIXI.Container {
    
    _front: PIXI.TilingSprite;
    _deep: number = 0;

    _animator: PIXI.AnimatedSprite;

    constructor(res: PIXI.IResourceDictionary){
        super();

        const anim = res[Assets.Assets.water.name].spritesheet;

        this._front = new PIXI.TilingSprite(anim.textures["water_1.png"]);
        this._animator = new PIXI.AnimatedSprite(anim.animations["water"], false);
        this._animator.onFrameChange = ()=> this._changeTexture();
        this._animator.play();
        this._animator.animationSpeed = 15 / 60;
        this.addChild(this._front);
    }

    updateSize(size: {width: number, height:number}){
        this._front.width = size.width;
        this._front.height = size.height;
    }

    private _changeTexture(){
        this._front.texture = this._animator.texture;
    }

    scroll(pos: PIXI.Point) {
        this._front.tilePosition.x = pos.x % this._front.width;
        this._front.tilePosition.y = pos.x % this._front.height;
    }

    update(ticker: PIXI.Ticker) {
        
        this._animator.update(ticker.deltaTime);
    }

    set deep(v: number) {
        this._deep = v;
        this._front.tint = (1-this._deep) * 0xffffff;
    }
    
    get deep() {
        return this._deep;
    }
}