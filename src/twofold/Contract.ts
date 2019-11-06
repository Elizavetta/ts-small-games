import { LevelCell } from './LevelCell';
import { GameConfig } from './GameConfig';

export interface IContractData {
    amount: number;
    type: number;
}

export class Contract extends PIXI.Container {
    
    sprite: LevelCell;
    line: PIXI.Graphics;
    amountText: PIXI.Text;
    contract: IContractData;
    private _amount: number = 0;

    constructor() {
        super()

        this.line = new PIXI.Graphics();
        this.line
            .lineStyle(4, GameConfig.contractColor)
            .drawRect(-40, -40, 80, 80)
            .moveTo(0, 40)
            .lineTo(0, 60)
            .drawCircle(0, 100, 40);
        
        this.amountText = new PIXI.Text("0", new PIXI.TextStyle({
            fontFamily: "Carter One MultiCyr, Carter One",
            fontSize: 46,
            fill : GameConfig.contractTextColor
        }));
        this.amountText.anchor.set(0.5);
        this.addChild(this.line, this.amountText);
        this.pivot.y = 42;

    }

    create(sprite: LevelCell, contract: IContractData) {

        if(this.sprite) {
            this.sprite.destroy();
        }
        this.contract = contract;
        this._amount = contract.amount;
        this.amountText.text = "" + this._amount;

        this.sprite = sprite;
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set( 80 / this.sprite.width);
        this.addChild(this.sprite);
        this.sprite.position.set(0, 100);
        
    }
}