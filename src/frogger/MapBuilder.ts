import { LineType, Sand, River } from "./Line";
import { ObjectType, GameObject, ObstacleVariant, MovableVariant, Timber, Turtle, Movable } from "./Object";
import { Obstacle } from "./Obstacle";
import { GameConfig } from "./GameConfig";

export interface IObjectConfig {
	pos: { x: number; y: number };
	type: ObjectType;
	variant: ObstacleVariant | MovableVariant;
	speed?: number;
}

export interface ILineConfig {
	type: LineType;
	lineCount: number;
	speed?: number;
	objects?: IObjectConfig[];
}

export interface IMapData {
	lines: ILineConfig[];
}

export interface IBuildResult {
	objects: PIXI.DisplayObject[];
    rivers: River[];
    movables: Movable[];
	playerStart: PIXI.IPoint;
}

const WALKABLEMAP = {
	[MovableVariant.TIMBER]: Timber,
	[MovableVariant.TURTLE]: Turtle
} as any;

export class MapBuilder {
	_res: PIXI.IResourceDictionary;
	bottomOffset: number = 0;
	topOffset: number = 0;

	constructor(res: PIXI.IResourceDictionary) {
		this._res = res;
	}

	build(map: IMapData): IBuildResult {
		let gen: PIXI.DisplayObject[] = [];
        let riv: River[] = [];
        let mv: Movable[] = [];

		let last;
		const count = map.lines.length;
		for (let i = 0; i < count; i++) {
			const conf = map.lines[i];
			const line = this.createLine(conf);

			let objOffset;
			if (i > 0 && i < count - 1) {
				line.y = last.y - last.lineCount * GameConfig.LineHeight;
				line.lineCount = conf.lineCount;
				objOffset = line.position;
			} else {
				if (i == 0) {
					line.lineCount = conf.lineCount + this.bottomOffset;
					objOffset = {
						x: 0,
						y: -this.bottomOffset * GameConfig.LineHeight
					} as PIXI.IPoint;
				} else {
                    line.y = last.y - last.lineCount * GameConfig.LineHeight;
                    line.lineCount = conf.lineCount + this.topOffset;
                    line.type = LineType.ENDING;
					objOffset = line.position;
				}
			}

			line.objects = this.createObjects(map.lines[i].objects, objOffset);
			if (line.type == LineType.RIVER) {
                riv.push(line as River);
                mv.push(...line.objects as any);
			}

			gen.push(line, ...(line.objects as any)); // так надо
			last = line;
		}
		const yStart = (this.bottomOffset + map.lines[0].lineCount - 0.5) * GameConfig.LineHeight;
		return {
			objects: gen,
            rivers: riv,
            movables: mv,
			playerStart: new PIXI.Point(0, yStart)
		};
	}

	createLine(conf: ILineConfig) {
		let line = undefined;
		switch (conf.type) {
            case LineType.ENDING:
			case LineType.SAND: {
				line = new Sand(this._res);
				break;
			}
			case LineType.RIVER: {
				line = new River(this._res);
				break;
			}
			default:
				return undefined;
		}
		return line;
	}

	createObjects(conf: IObjectConfig[], offset: PIXI.IPoint) {
		if (!conf) return [];

		let objs: GameObject[] = [];
		for (let i = 0; i < conf.length; i++) {
			const c = conf[i];

			let obj;

			if (c.type == ObjectType.OBSTACLE) {
				obj = new Obstacle(this._res);
				if (c.variant) {
					obj.variant = c.variant as any;
				}
			}

			if (c.type == ObjectType.MOVABLE) {
				obj = new WALKABLEMAP[c.variant || MovableVariant.TIMBER](this._res) as Movable;
				obj.speed = c.speed || 1;
			}

			obj.position.set(offset.x + c.pos.x, offset.y - c.pos.y);
			objs.push(obj);
		}
		return objs;
	}
}
