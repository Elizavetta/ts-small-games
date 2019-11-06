import { GameConfig, PlatformType } from './GameConfig';
import {BonusObjectType} from './BonusObject';
import {IPopulatedData, PlatformData, PlatformPopulator} from "./PlatformPopulator";

export class PlatformPopelyshev extends PlatformPopulator {
	constructor() {
		super();
	}

	genRnd(levelData: any): PlatformType {
		const probs = levelData.probs;
		let p = Math.random();
		for (let key in probs) {
			if (p < probs[key]) {
				return key as PlatformType;
			}
			p -= probs[key];
		}
		return PlatformType.NORMAL;
	}

	genNotMatchingRnd(levelData: any, bad: PlatformType) {
		let res = this.genRnd(levelData);
		if (res === bad) {
			res = this.genRnd(levelData);
		}
		return res;
	}

	genREALLYNotMatchingRnd(levelData: any, bad: PlatformType, WORST: PlatformType) {
		let res = null;
		do {
			res = this.genRnd(levelData);
			if (res === bad) {
				res = this.genRnd(levelData);
			}
		} while (res === WORST);
		return res;
	}

	unfoldVariant(variant: PlatformType) {
		return {
			variant,
			things: BonusObjectType.NONE
		}
	}

	populate(levelData: any): IPopulatedData {
		let data: PlatformData[] = [];

		const maxPerRow = GameConfig.maxHorizontlalCount;
		const safeArea = this.screenSize.width - GameConfig.borderOffsets * 2;

		const right = this.screenSize.width - GameConfig.borderOffsets - this.psize.width / 2;
		const left = GameConfig.borderOffsets + this.psize.width / 2;

		let prev = {
			pos: {x: (left + right) / 2, y: 0},
			variant: PlatformType.NORMAL,
			restrictHorizontal: false
		};

		// 1. GENERATE MAIN SEQUENCE OF PLATFORMS

		let countMain = levelData.platformsMain;
		let count = levelData.platforms;

		for (let i = 0; i < countMain; i++) {
			let randSign = ((Math.random() * 2 | 0) * 2 - 1);

			//JUMP X
			if (prev.variant !== PlatformType.ICE && !prev.restrictHorizontal) {
				let x1 = prev.pos.x + randSign * this.psize.width * (Math.random() * 0.8 + 1.6);

				if (x1 >= left && x1 <= right) {
					let {variant, things} = this.unfoldVariant(this.genNotMatchingRnd(levelData, prev.variant));
					let newPlatform = {
						pos: {
							x: x1,
							y: prev.pos.y + (Math.random() * 3 | 0) * this.psize.height
						},
						variant, things,
						restrictHorizontal: true,
					};

					data.push(newPlatform);
					prev = newPlatform;
					continue;
				}
			}
			// JUMP Y

			if (prev.pos.x < left + this.psize.width * 0.5) {
				randSign = 1;
			}
			if (prev.pos.x > right - this.psize.width * 0.5) {
				randSign = -1;
			}
			let scaleX = this.psize.width;
			let x1 = prev.pos.x + randSign * (Math.random() * scaleX);
			if (prev.variant === PlatformType.ICE) {
				x1 += 3 * randSign * this.psize.width;
			}
			if (x1 < left) {
				x1 = left
			}
			if (x1 > right) {
				x1 = right
			}

			let jumpHeight = GameConfig.jumpHeight * 0.7;
			if (prev.variant === PlatformType.STICKY) jumpHeight /= 2;
			if (prev.variant === PlatformType.ICE) jumpHeight /= 1.5;
			let y1 = prev.pos.y + Math.max(0, jumpHeight - (Math.random() * 2 | 0)) * this.psize.height;

			let {variant, things} = this.unfoldVariant(this.genNotMatchingRnd(levelData, prev.variant));
			// if (things === BonusObjectType.NONE && Math.random() < levelData.things.spikes) {
			// 	things = BonusObjectType.SPIKES;
			// }

			let newPlatform = {
				pos: {
					x: x1,
					y: y1
				},
				variant, things,
				restrictHorizontal: false,
			};
			data.push(newPlatform);
			prev = newPlatform;
		}

		let height = (prev.pos.y + this.psize.height);
		let heightDiv = (height / this.psize.height) | 0;

		const tries = 100;

		let extra = [];

		// === 2. Spawn extra platforms ===
		for (let i = countMain; i < count; i++) {

			let xbest = -1, ybest = -1, bestdist = 0.0;

			for (let j = 0; j < tries; j++) {
				let xrand = Math.random() * (right - left) + left;
				let yrand = ((Math.random() * (heightDiv - 5) | 0) + 5) * this.psize.height;

				let dist = 1000000000.0;
				//`i` is the same as `data.length`
				for (let j = 0; j < i; j++) {
					let px = data[j].pos.x;
					let py = data[j].pos.y;
					let R2 = (px - xrand) * (px - xrand) * 4 + (py - yrand) * (py - yrand);
					dist = Math.min(dist, R2);
				}

				if (bestdist < dist) {
					bestdist = dist;
					xbest = xrand;
					ybest = yrand;
				}
			}

			let {variant, things} = this.unfoldVariant(this.genNotMatchingRnd(levelData, prev.variant));
			// if (things === BonusObjectType.NONE && Math.random() < levelData.things.spikes) {
			// 	things = BonusObjectType.SPIKES;
			// }
			let newPlatform = {
				pos: {
					x: xbest,
					y: ybest
				},
				variant, things,
				restrictHorizontal: false,
			};
			data.push(newPlatform);
			extra.push(newPlatform);
		}

		// === 3. Sort extra platforms, reassign to main array ===
		extra.sort((a, b) => {
			const y1 = a.pos.y, y2 = b.pos.y;
			if (y1 > y2) return 1;
			if (y1 < y2) return -1;
			return 0;
		});
		
		for (let i = countMain; i < count; i++) {
			data[i] = extra[i - countMain];
		}

		// === 4. Sort result array. Important for instantiation

		data.sort((a, b) => {
			const y1 = a.pos.y, y2 = b.pos.y;
			if (y1 > y2) return 1;
			if (y1 < y2) return -1;
			return 0;
		});

		const coinsCount = Math.round(count * levelData.things.coins);
		const coinsMax = Math.round(extra.length / 2);
		this.populateExtra(extra, BonusObjectType.COIN, extra.length / 4 | 0, coinsMax, coinsCount);

		//compute which extra platforms wont disappear
		let limitY = coinsCount > 0 ? data[ data.length - coinsCount * GameConfig.coinCost ].pos.y : height + 100;
		let limitIndex = extra.length - 1;
		while (limitIndex >=0 && extra[limitIndex].pos.y >= limitY) {
			limitIndex--;
		}

		const monstersCount = Math.round(extra.length / 4);
		const monstersMax = Math.round(count * levelData.things.monster);
		this.populateExtra(extra, BonusObjectType.MONSTER, limitIndex + 1 - monstersCount, monstersMax, monstersCount);

		const ballsCount = Math.round(count * levelData.things.balls);
		this.spawnMoreShit(extra, BonusObjectType.BALL, ballsCount, 10);

		const spikesCount = Math.round(count * levelData.things.spikes);
		this.spawnMoreShit(data, BonusObjectType.SPIKES, spikesCount, 5);

		return {
			data: data,
			width: safeArea,
			height: height
		}
	}

	populateExtra(extra: Array<PlatformData>, type: BonusObjectType, offset: number, size: number, count: number) {
		if (offset + size > extra.length) {
			size = extra.length - offset;
		}
		if (size < 0) {
			return;
		}
		let arr = [];
		for (let i = 0; i < size; i++) {
			arr[i] = i >= count ? 0 : 1;
		}
		this.shuffle(arr);
		for (let i = 0; i < size; i++) {
			if (arr[i] === 1) {
				extra[offset + i].things = type;
			}
		}
	}

	spawnMoreShit(extra: Array<PlatformData>, type: BonusObjectType, count: number, offset?: number) {
		for (let i=0; i<count; i++) {
			for (let k=0;k<10;k++) {
				let j = offset +  Math.random() * ( extra.length - offset ) | 0;
				if (extra[j].things === BonusObjectType.NONE) {
					if ((j===0 || extra[j-1].things !== type) &&
						(j===extra.length-1 || extra[j+1].things !== type)) {
						extra[j].things = type;
						break;
					}
				}
			}
		}
	}

	shuffle(array: any) {
		let input = array;

		for (var i = input.length - 1; i >= 0; i--) {

			var randomIndex = Math.floor(Math.random() * (i + 1));
			var itemAtIndex = input[randomIndex];

			input[randomIndex] = input[i];
			input[i] = itemAtIndex;
		}
		return input;
	}
}
