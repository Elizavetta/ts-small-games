import { Assets } from "./Assets";
import { GameObject, ObstacleVariant, ObjectType, VARIAN2TEXTURE } from "./Object";

export class Obstacle extends PIXI.Sprite implements GameObject {
	varaint: ObstacleVariant;
	_variant: ObstacleVariant;
	_textures: PIXI.ITextureDictionary;

	type: ObjectType = ObjectType.OBSTACLE;

	constructor(res: PIXI.IResourceDictionary) {
		super(PIXI.Texture.EMPTY);
		this.anchor.set(0.5);
		this._textures = res[Assets.Assets["game-atlass"].name].textures;
		this.varaint = ObstacleVariant.STONE;
	}

	set variant(v: ObstacleVariant) {
		if (v == this._variant) return;
		this._variant = v;
		this.texture = this._textures[VARIAN2TEXTURE[v]];
	}

	get variant() {
		return this._variant;
	}
}
