import { Tween } from '@tweenjs/tween.js';
import { Assets } from './Assets';
import { Ball } from './Ball';
import { BeginContactEvent } from '../physics/p2Events';
import { BoostType } from './BoostType';

export const BOOST2TEX = {
	[BoostType.BOUND]: 'boost bound.png',
	[BoostType.SPEED]: 'boost speed.png',
	[BoostType.TRIPLE]: 'boost 1 in 3.png'
} as any;

export class Boost extends Ball {

	attractor: BoostView;
	duration: number;
	type: BoostType;

	constructor(tex: PIXI.Texture) {
		super(tex);

		//this.body.shapes
	}
	
	activate() {
		
		this.attractor.activate(this.type, this.duration);
		this.destroy();
	}

	OnTouch(event: BeginContactEvent) {
		this.activate();
	}
}

export class BoostView extends PIXI.Container {
	
	_icon: PIXI.Sprite;
	_bar: PIXI.Graphics;
	_active: BoostType;
	_duration: number;
	_progress: number;

	_tween: Tween;
	tex: PIXI.ITextureDictionary;

	constructor(res: PIXI.IResourceDictionary) {
		super();

		this.tex = res[Assets.Assets["game-atlas"].name].textures;
		
		this._icon = new PIXI.Sprite(PIXI.Texture.EMPTY);
		this._icon.anchor.set(0.5);
		this._bar = new PIXI.Graphics();
		this.addChild(this._icon, this._bar);

		this.activate(BoostType.NONE, 0);
	}

	activate(type: BoostType, duration: number) {
	   
		if(this._tween){
			this._tween.stop();
		}
		
		this._active = type;
		if(type == BoostType.NONE) {
			this.visible = false;
			return;
		}

		this.visible = true;
		this._duration = duration;
		this._icon.texture = this.tex[BOOST2TEX[type]]
		this._progress = 0;

		this._tween = new Tween(this)
			.to({
				_progress: 1,
			}, this._duration * 1000)
			.onUpdate(()=>{
				this._update();
			})
			.onComplete(()=>{
				this.visible = false;
			})
			.start();
	}

	get progress() {
		return this._progress;
	}

	_update() {

		const r = this._icon.width * 0.5;
		const angle = this._progress * 2 * Math.PI - Math.PI * 0.5;
		const sy = Math.sin(angle) * r;
		const sx = Math.cos(angle) * r;
		
		this._bar
			.clear()
			.beginFill(0x0, 0.4)
			.lineTo(sx, sy)
			.arc(0, 0, r, angle, - Math.PI * 0.5, true)
			.lineTo(0,0)
			.endFill()
			.closePath();
	}

	spawn(pos: {x: number, y: number}, type: BoostType, duration: number) {
 
		const tex = this.tex[BOOST2TEX[type]];
		const b = new Boost(tex);
		b.x = pos.x;
		b.y = pos.y;
		b.body.update();
		
		b.duration = duration;
		b.type = type;
		b.attractor = this;

		return b;
	}
}