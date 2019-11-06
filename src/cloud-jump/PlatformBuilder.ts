import { BrickablePlatform } from "./BrickablePlatform";
import { Assets } from "./Assets";
import {Platform, PlatfromTexturePair, BasePlatform } from "./Platform";
import { GameConfig, PlatformType } from "./GameConfig";
import { App } from "../index";

export class PlatformBuilder {
	_res: PIXI.IResourceDictionary;
	_app: App;

	level: number;

	constructor(res: PIXI.IResourceDictionary, app: App) {
		this._res = res;
		this._app = app;
	}

	Single(type: PlatformType): BasePlatform {
		const textures = this._res[Assets.Assets["game-atlass"].name].textures;

		const level = this.level;
		let cloud = null;

		let pairs: PlatfromTexturePair = {
			[PlatformType.NORMAL]: [textures["standart_trapes.png"]],
			[PlatformType.ENDINGS]: [textures["standart_colored.png"]],
			[PlatformType.ICE]: [textures["ice.png"]],
			[PlatformType.STICKY]: [textures["sticky_colored.png"]]
		};

		switch (level) {
			case 2: {
				pairs[PlatformType.NORMAL] = [textures["standart_colored.png"], ...pairs[PlatformType.NORMAL]];
				pairs[PlatformType.ENDINGS] = [textures["standart.png"]];
				break;
			}
			case 3: {
				pairs[PlatformType.NORMAL] = [textures["standart.png"]];
				pairs[PlatformType.STICKY] = [textures["sticky.png"]];
				pairs[PlatformType.ENDINGS] = [textures["standart.png"]];
				cloud = textures["cloud.png"];
				break;
			}
		}

		switch (type) {
			case PlatformType.BRICABLE:
				const brick = this._res[Assets.Assets.bricable.name].spineData;
				return new BrickablePlatform(brick, cloud);
			default:
				return new Platform(type, pairs);
		}
	}

	Line(yPos: number, type: PlatformType): BasePlatform[] {
		const safearea = this._app.width - GameConfig.borderOffsets * 2;
		const count = Math.floor(safearea / GameConfig.platformWidth);
		const delta = safearea / count;

		const res = [];
		for (let i = 0; i < count; i++) {
			const platform = this.Single(type);

			const x = GameConfig.borderOffsets + (i + 0.5) * delta;
			platform.position.set(x, yPos);
			res.push(platform);
		}

		return res;
	}
}
