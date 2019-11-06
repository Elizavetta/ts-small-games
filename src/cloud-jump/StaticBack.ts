import { Assets } from "./Assets";
import { GameConfig } from './GameConfig';
import { M2 } from "../shared/M2";
import { App } from "..";
export class StaticBack extends PIXI.Container {
	
	_bg: PIXI.TilingSprite;
	_goal: PIXI.Sprite;
	_windows: PIXI.Container;
	windowTexture:PIXI.Texture;
	app:App;
	
	constructor(resources: PIXI.IResourceDictionary) {
		super();
		
		const atlas = resources[Assets.Assets["game-atlass"].name].textures;
		const tile = resources[Assets.Assets["back-tile"].name].texture;
		
		this._bg = new PIXI.TilingSprite(tile);
		this._bg.anchor.set(0, 1);
		
		const goal = atlas["door_all.png"];

		this._goal = new PIXI.Sprite(goal);
		this._goal.anchor.set(0, 1);

		this.windowTexture = atlas["window.png"];

		this.addChild(this._bg);
		this.addChild(this._goal);
		
	}

	updateSize(size: { width: number; height: number }) {
		this._bg.width = size.width;
		this._bg.height = App.instance.height;

		if(this._windows){
			this._windows.destroy({children: true});
		}

		this._windows = new PIXI.Container();
		const wcount = Math.floor(size.height / GameConfig.windowsStep);

		const safeArea = this._bg.width - (GameConfig.borderOffsets * 2 + this.windowTexture.height);

		for(let i = 1; i < wcount + 1; i++) {
			const w = new PIXI.Sprite(this.windowTexture);
			w.anchor.set(0.5, 1);
			w.position.x = GameConfig.borderOffsets + this.windowTexture.width * 0.5  + Math.random() * safeArea;
			w.position.y = -i * GameConfig.windowsStep;
			this._windows.addChild(w);
		}

		this.addChild(this._windows)
	}

	scroll(pos: {x:number, y: number}){
		this._bg.tilePosition.y = pos.y % this._bg.texture.height;
		this._windows.pivot.y = -pos.y;

		if(pos.y <= this._goal.height){
			this._goal.position.y = pos.y;
		}
	}

	reset(){
		this._bg.tilePosition.y = 0;
		this._goal.position.y = 0;
	}
}
