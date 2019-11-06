import { ILevelData, GameConfig } from './GameConfig';
import { Button } from "../shared/ui/Button";
import { Tween } from "@tweenjs/tween.js";
import { LevelCell } from "./LevelCell";
import { IContractData } from './Contract';
import { LevelBuilder } from './LevelBuilder';
import { M2 } from '../shared/M2';
import { LevelGenerator } from './LevelGenerator';

export class LevelView extends PIXI.Container {
	
	builder: LevelBuilder;
	table: Array<LevelCell> = [];
	arrows: Array<Button> = [];
	contracts: Array<IContractData> = [];
	
	get totalContractsAmount() {
		return this.data.targetScore;
	}

	_totalScore: number = 0;

	get totalContractsScore() {
		return this._totalScore;
	}

	data: ILevelData;
	tweenDuration: number = 0.25;

	lineText: PIXI.Text = new PIXI.Text("0", new PIXI.TextStyle({
		fill: GameConfig.contractTextColor,
		fontFamily: 'Carter One MultiCyr, Carter One',
		fontSize: 42
	}));

	line: PIXI.Graphics = new PIXI.Graphics();
	selectedCells: Array<LevelCell> = [];

	_tweenning: number = 0;
	_tween: Tween;

	constructor() {
		super();
		this.init();
	}

	init() {
		this.interactive = true;
		this.interactiveChildren = true;

		this.on("mousedown", this.processInputDown, this);
		this.on("touchstart", this.processInputDown, this);

		this.on("mouseup", this.processInputUp, this);
		this.on("mouseupoutside", this.processInputUp, this);
		this.on("touchcancel", this.processInputUp, this);
		this.on("touchend", this.processInputUp, this);
		this.on("touchendoutside", this.processInputUp, this);

		this.on("mousemove", this.processInputMove, this);
		this.on("touchmove", this.processInputMove, this);
		
	}

	processInputDown(event: PIXI.interaction.InteractionEvent) {
		
		if(event.target instanceof LevelCell)
			this.selectedCells.push(event.target);
	}

	processInputUp(event: PIXI.interaction.InteractionEvent) {

		this.processTest();
		this.selectedCells = [];
		this.buildLine([]);
	}
	
	processInputMove(event: PIXI.interaction.InteractionEvent) {
		
		if(this.selectedCells.length  == 0)
			return;
			
		if(event.target instanceof LevelCell){

			const current = event.target;
			const last = this.selectedCells[this.selectedCells.length - 1];

			if(this.selectedCells.indexOf(current) > -1)
				return;

			if(last.neighbours.indexOf(current) > -1 && last.type == event.target.type){
				this.selectedCells.push(event.target);
			}

		}

		if(this.selectedCells.length > 1)
			this.buildLine(this.selectedCells);
	}


	buildLine(cells: Array<LevelCell>) {

		
		if(cells.length < 2) {
			this.line.visible = false;
			this.lineText.visible = false;
			return;
		}
		
		this.lineText.style.fontSize = 42 / this.scale.x;
		this.lineText.text = "" + cells.length;
		this.lineText.anchor.set(.5);
		this.lineText.x = cells[cells.length - 1].x;
		this.lineText.y = cells[cells.length - 1].y - GameConfig.cellSize * 0.5;
		
		this.line.visible = true;
		this.lineText.visible = true;

		this.line.clear();
		const w2 = GameConfig.lineWidth * 0.5;
		
		this.line.beginFill(GameConfig.lineColor);
		this.line.lineStyle(0, GameConfig.lineStroke);

		for(let i = cells.length - 1; i > 0; i--) {
			
			let starx = Math.min(cells[i - 1].x, cells[i].x);
			let endx = Math.max(cells[i - 1].x, cells[i].x);
			let stary = Math.min(cells[i - 1].y, cells[i].y);
			let endy = Math.max(cells[i - 1].y, cells[i].y);

			starx -= w2;
			stary -= w2;
			endx += w2;
			endy += w2;

			this.line.drawRoundedRect(starx, stary, endx - starx, endy - stary, GameConfig.lineWidth * 0.5);
		}
		
		this.line.lineStyle(8, GameConfig.lineStroke);

		this.line.drawCircle(this.lineText.x, this.lineText.y, GameConfig.cellSize * 0.25)

		this.addChild(this.line, this.lineText);
	}

	private flipSelection(group: Array<LevelCell>) {

		const delta = 150 / group.length;
		let last: Tween;
		group.forEach((e , i)=>{

			e.type = Math.random() * 4 | 0;
			last = new Tween(e.scale).
				to({
					x: 0.02,
					y: 0.02
				}, 150)
				.delay(i * delta)
				.start();
		});

		last.onComplete(()=> {

			group.forEach((e)=>{
				this.builder.createLevelCell(e.type, e);
			})
			
		});

		this.refresh();
	}

	private processTest() {
		
		const test = this.testSelection();
		if(test) {			
			let collected = this.updateContracts(this.selectedCells[0].type, this.selectedCells.length);
			if(collected) {
				this.flipSelection(this.selectedCells);
				this.generateContracts();
			}
		}
		
	}

	private generateContracts() {

		this.data.contracts = this.contracts;
		LevelGenerator.generateContracts(this.data, 2);
		this.contracts = this.data.contracts;
		
		this.emit('oncontractsupdated', this.contracts);
	}

	private updateContracts(type: number, amount: number) {

		let openedContracts = [];
		for(let i = 0; i < this.contracts.length; i++) {
			if(type == this.contracts[i].type && amount >= this.contracts[i].amount) {
				this._totalScore += amount;
				continue;
			}
			openedContracts.push(this.contracts[i]);
		}

		let collected = this.contracts.length != openedContracts.length;
		this.contracts = openedContracts;
		return collected;
	}

	private testSelection() {
		
		if(this.selectedCells.length < 2)
			return false;
		
		const sel = this.selectedCells;
		const type = sel[0].type;
		for(let e of sel) {
			for(let n of e.neighbours){
				if(n.type == type && sel.indexOf(n) == -1){
					return false;
				}
			}
		}

		return true;
	}

	refresh() {

		const data = [];

		for(let i = 0; i < this.data.col; i++) {
			for(let j = 0; j < this.data.col; j++) {
				const index = j * this.data.col + i;
				const cell = this.table[index];
				
				//recompilate data
				data [index] = cell.type;

				const negb: Array<LevelCell> = []
				
				if(i > 0)
					negb.push( this.table[j * this.data.col + i - 1]);
				
				if(i < this.data.col - 1)
					negb.push( this.table[j * this.data.col + i + 1]);
								
				if(j > 0)
					negb.push( this.table[(j - 1) * this.data.col + i]);
			
				if(j < this.data.row - 1)
					negb.push( this.table[(j + 1) * this.data.col + i]);

					
				cell.neighbours = negb;
			}
		}

		this.data.data = data;
	}

	addCollumnArrow(btn: Button, index: number, dir: number) {
		btn.on("b-click", () => {
			this.shiftCol(index, dir);
		});
		this.arrows.push(btn);
	}

	addRowArrow(btn: Button, index: number, dir: number) {
		btn.on("b-click", () => {
			this.shiftRow(index, dir);
		});
		this.arrows.push(btn);
	}

	shiftRow(index: number, dir: number) {
		//supress running
		if (this._tween && this._tween.isPlaying()) return;
		let table = this.table;
		let cols = this.data.col;
		let rows = this.data.row;
		if (dir > 0) {
			let buff = table[index + rows * (cols - 1)];
			let pos = buff.position.clone();
			for (let i = cols - 1; i >= 0; i--) {
				let tmp;
				if (i - 1 < 0) {
					table[index + i * rows] = buff;
					table[index + i * rows].teleportTo(pos);
				} else {
					tmp = table[index + (i - 1) * rows].position.clone();
					table[index + i * rows] = table[index + (i - 1) * rows];
					table[index + i * rows].moveTo(pos);
				}
				pos = tmp;
			}
		} else {
			let buff = table[index];
			let pos = buff.position.clone();
			for (let i = 0; i < cols; i++) {
				let tmp;
				if (i + 1 == cols) {
					table[index + rows * i] = buff;
					table[index + rows * i].teleportTo(pos);
				} else {
					tmp = table[index + rows * (i + 1)].position.clone();
					table[index + rows * i] = table[index + rows * (i + 1)];
					table[index + rows * i].moveTo(pos);
				}
				pos = tmp;
			}
		}
		this.runTween();
	}

	shiftCol(index: number, dir: number) {
		//supress running
		if (this._tween && this._tween.isPlaying()) return;
		let table = this.table;
		let rows = this.data.row;
		if (dir > 0) {
			let buff = table[(index + 1) * rows - 1];
			let pos = buff.position.clone();
			for (let i = rows - 1; i >= 0; i--) {
				let tmp;
				if (i - 1 < 0) {
					table[index * rows + i] = buff;
					table[index * rows + i].teleportTo(pos);
				} else {
					tmp = table[index * rows + i - 1].position.clone();
					table[index * rows + i] = table[index * rows + i - 1];
					table[index * rows + i].moveTo(pos);
				}
				pos = tmp;
			}
		} else {
			let buff = table[index * rows];
			let pos = buff.position.clone();
			for (let i = 0; i < rows; i++) {
				let tmp;
				if (i + 1 == rows) {
					table[index * rows + i] = buff;
					table[index * rows + i].teleportTo(pos);
				} else {
					tmp = table[index * rows + i + 1].position.clone();
					table[index * rows + i] = table[index * rows + i + 1];
					table[index * rows + i].moveTo(pos);
				}
				pos = tmp;
			}
		}
		this.runTween();
	}

	runTween() {
		this._tweenning = 0;
		this._tween = new Tween(this)
			.to(
				{
					twenning: 1
				},
				1000 * this.tweenDuration
			)
			.onComplete(() => {
				this.tweenComplite();
			})
			.start();
	}

	tweenComplite() {
		this.table.forEach(element => {
			element.tweenComplete();
		});

		this.refresh();
	}


	get twenning() {
		return this._tweenning;
	}

	set twenning(p: number) {
		p = Math.max(0, Math.min(1, p));
		this.table.forEach(element => {
			element.twenning = p;
		});
		this._tweenning = p;
	}
	
	reset() {
		this.selectedCells = [];
		this.buildLine([]);

		if(this._tween && this._tween.isPlaying())
			this._tween.stop();

		this.table.forEach(pl => {
			pl.destroy();
		});
		this.table = [];

		this.arrows.forEach(arr =>{
			arr.destroy();
		})
		this.arrows = [];

		this.contracts = [];

		this.data = undefined;
		this._totalScore = 0;
		this.scale.set(1);
	}

	pause() {
		this.processInputUp(undefined);
	}

	_loop(a: number, b: number) {
		if (a < 0) a += b;
		return a % b;
	}
}
