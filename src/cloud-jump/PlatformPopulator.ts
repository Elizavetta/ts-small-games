import { GameConfig, PlatformType } from "./GameConfig";
import { M2 } from "../shared/M2";
import { BonusObjectType } from './BonusObject';

export interface PlatformData {
	pos: { x: number; y: number };
	variant: PlatformType;
	things: BonusObjectType
}


export interface IPopulatedData {
	data: PlatformData[];
	width: number;
	height: number;
}

export class PlatformPopulator {
	psize: PIXI.Rectangle;
	screenSize: PIXI.Rectangle;
	variants: PlatformType[] = [];

	constructor() {}

	populate(levelData: any): IPopulatedData {
		let data: PlatformData[] = [];

		//	let levelData = GameConfig.levels[level];
		let rowPosSumm = 0;

		const maxPerRow = GameConfig.maxHorizontlalCount;
		const _my = GameConfig.yDistance.min * this.psize.height;
		const _dy = (GameConfig.yDistance.max - GameConfig.yDistance.min) * this.psize.height;
		const safeArea = this.screenSize.width - GameConfig.borderOffsets * 2;

		let collumns = 1;

		let prefarm = [];
		const count = levelData.platforms;

		for (var key in levelData.probs) {
			for (let i = 0; i < Math.floor(levelData.probs[key] * count); i++) {
				prefarm.push(key);
			}
		}

		for (let j = prefarm.length; j < count; j++) {
			prefarm.push(PlatformType.NORMAL);
		}

		/*
		prefarm = this.shuffle(prefarm);
		prefarm = this.shuffle(prefarm);		
		console.log(prefarm);
		*/
		const things_name = Object.keys(levelData.things);
			
		for (let i = 0; i < count; ) {
			const wPerClmn = safeArea / collumns;
			const wPerClnmH = wPerClmn / 2;

			let max = 0;
			let xOffset = safeArea - collumns * this.psize.width - (collumns - 1) * (wPerClmn - this.psize.width);

			const name = things_name[M2.randint(things_name.length)];
			let spawned = false;
			//console.log(name);		
			for (let j = 0; j < collumns; j++) {
				const pdata = {
					 pos: { 
						x: 0,
						y: 0 
					},
					//@ts-ignore
					variant: (prefarm[M2.randint(count)] as PlatformType),
					things : BonusObjectType.NONE
				}

				const dy = i == 0 ? _my + _dy : _my + M2.rand(_dy);
				pdata.pos.y = rowPosSumm + dy;
				pdata.pos.x = GameConfig.borderOffsets + wPerClnmH + wPerClmn * j;
				pdata.pos.x += (0.5 - Math.random()) * xOffset;
				
				if( (i + j) % Math.round(levelData.things[name] * count) && !spawned && collumns > 1) {
					pdata.things = (name as BonusObjectType);
					spawned = true;
					//console.log("Populate", pdata.things);
				}
				
				data.push(pdata);

				max = Math.max(max, dy);
			}
			rowPosSumm += max;
			i += collumns;

			collumns = Math.min(1 + M2.randint(maxPerRow), levelData.platforms - collumns);
		}

		return {
			data: data,
			width: safeArea,
			height: rowPosSumm + this.psize.height
		}
	}

	shuffle (array: any) {
		var input = array;
		 
		for (var i = input.length-1; i >=0; i--) {
		 
			var randomIndex = Math.floor(Math.random()*(i+1)); 
			var itemAtIndex = input[randomIndex]; 
			 
			input[randomIndex] = input[i]; 
			input[i] = itemAtIndex;
		}
		return input;
	}
}
