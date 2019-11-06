import { ILevelData, GameConfig } from './GameConfig';
import { Button } from "../shared/ui/Button";
import { LevelCell } from "./LevelCell";
import { LevelView } from './LevelView';
import { Contract, IContractData } from './Contract';

export const INDEX_MAP = ["green.png", "purple.png", "red.png", "yellow.png"];

export class LevelBuilder {
	constructor(private textures: PIXI.ITextureDictionary) {}

	build(data: ILevelData, view?: LevelView): LevelView {
		const level = view || new LevelView();
		level.reset();
		
		const arrow_t = this.textures["arrow_btn.png"];

		const arr_ts = [
			arrow_t, // <-
			new PIXI.Texture(
				arrow_t.baseTexture,
				arrow_t.frame,
				arrow_t.orig,
				arrow_t.trim,
				(arrow_t.rotate + 12) % 0xf
			), // ^
			new PIXI.Texture(
				arrow_t.baseTexture,
				arrow_t.frame,
				arrow_t.orig,
				arrow_t.trim,
				(arrow_t.rotate + 10) % 0xf
			), // ->
			new PIXI.Texture(arrow_t.baseTexture, arrow_t.frame, arrow_t.orig, arrow_t.trim, (arrow_t.rotate + 6) % 0xf) // v
		];

		for (let i = 0; i < data.col; i++) {
			let spr;

			for (let j = 0; j < data.row; j++) {
				const index = j * data.col + i;
				const id = data.data[index];

				const cell = this.createLevelCell(id);

				cell.x = i * GameConfig.cellSize;
				cell.y = j * GameConfig.cellSize;
				cell.interactive = true;
				level.table.push(cell);

				// left

				if (i == 0) {
					spr = new Button(new PIXI.Sprite(arr_ts[0]));
					spr.x = -GameConfig.cellSize * 0.5 - GameConfig.arrowOffset;
					spr.y = GameConfig.cellSize * j;

					level.addRowArrow(spr, j, -1);
				}

				// right

				if (i == data.col - 1) {
					spr = new Button(new PIXI.Sprite(arr_ts[1]));
					spr.x += (data.col - 0.5) * GameConfig.cellSize + GameConfig.arrowOffset;
					spr.y = GameConfig.cellSize * j;

					level.addRowArrow(spr, j, 1);
				}

				// top
				if (j == 0) {
					spr = new Button(new PIXI.Sprite(arr_ts[2]));
					spr.y = -GameConfig.cellSize * 0.5 - GameConfig.arrowOffset;
					spr.x = GameConfig.cellSize * i;

					level.addCollumnArrow(spr, i, -1);
				}

				// btm
				if (j == data.row - 1) {
					spr = new Button(new PIXI.Sprite(arr_ts[3]));
					spr.y = (data.row - 0.5) * GameConfig.cellSize + GameConfig.arrowOffset;
					spr.x = GameConfig.cellSize * i;

					level.addCollumnArrow(spr, i, 1);
				}
			}
		}

		level.contracts = data.contracts;

		level.builder = this;
		level.data = data;

		const s = GameConfig.cellSize;
		level.arrows.forEach(e => {
			e.scale.set(0.5);
			e._mainSprite.anchor.set(0.5);

			const hit = new PIXI.Sprite(PIXI.Texture.EMPTY);
			hit.width = hit.height = s * 1.5;
			hit.anchor.set(0.5);
			hit.position.copyFrom(e._mainSprite.position);
			e.addChild(hit);
		});

		level.addChild(...level.table);
		level.addChild(...level.arrows);

		level.pivot.x = GameConfig.cellSize * (data.col - 1) * 0.5;
		level.pivot.y = GameConfig.cellSize * (data.row - 1) * 0.5;

		level.refresh();
		return level;
	}

	createLevelCell(type: number, cell? : LevelCell) {
		
		const name = INDEX_MAP[type % 4];
		const t = this.textures[name];
		
		if(!cell) {
			cell = new LevelCell(t);
		} else {
			cell.reset();
			cell.texture = t;
		}

		cell.type = type;
		cell.anchor.set(0.5);
		return cell;
	}

	createContract(contract: IContractData) {

		const contr =  new Contract();
		contr.create(this.createLevelCell( contract.type), contract);

		return contr;
	}
}
