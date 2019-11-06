import { BaseGame, GameState } from '../shared/BaseGame';
import { APIData } from '../shared/APIData';
import { App } from "..";
import { PhysicContainer } from '../physics/PhysicContainer';
import { Assets } from './Assets';
import { ObjectBuilder } from './ObjectBuider';
import { ObjectType, GameConfig, ILevelData } from './GameConfig';
import { M2 } from "../shared/M2";
import { PopupType } from '../shared/ui/Popup';
import { UiManager } from '../shared/ui/UiManager';
import { InputHandler } from '../shared/CrossplatformInputHandler';
import { PhysicSprite } from './Object';
import { PIXEL_TO_METR } from '../physics/constants';
import { BeginContactEvent } from '../physics/p2Events';
import { Tween } from '@tweenjs/tween.js';
import p2 from 'p2';
import { Body } from 'p2';
import { IPopup, IUIListener } from '../shared/ui/IUIListener';
import { ITextBase } from '../shared/Multilang';

export class Balance extends BaseGame implements IUIListener {

	lang: ITextBase;
	target: PIXI.Point = new PIXI.Point();
	ui: UiManager;
	tex: PIXI.ITextureDictionary;
	stage: PIXI.Container;
	physics: PhysicContainer;
	loader: PIXI.Loader;

	_res: PIXI.IResourceDictionary;
	_bg: PIXI.TilingSprite;
	_spawner: ObjectBuilder;

	_pool: PhysicSprite[] = [];

	_freeSize: number = 0;
	_stackSize: number = 0;
	_levelData: ILevelData;
	_drops: number = 0;

	currentObject: PhysicSprite;

	get totalStackSize() {
		return this._freeSize - this.totatlDrops;
	}

	get totatlDrops() {
		return this._drops;
	}

	constructor() {
		super();
		
		this.input = new InputHandler(false, false);
		this.apiData = new APIData("Balance", this);
		this.stage = new PIXI.Container();
		this.physics = new PhysicContainer({
			gravity:[0, -20]
		});

		this.physics.world.setGlobalRelaxation(20);
		this.physics.world.defaultContactMaterial.friction = 2.0;
		this.physics.world.sleepMode = p2.World.BODY_SLEEPING;
		
		this.loader = new PIXI.Loader(Assets.BaseDir);
	}

	init(app: App){
		this.app = app;
		this.gameState.on("enter", this.onStateEnter, this);
		this.ui = this.app.uiManager;
		this.lang = this.app.multilang.getTextBase('Balance');

		this.ui.setOptions({
            showArrows: false,
            showProgress: false,
            level: this.apiData.lastOpenedLevel,
			levelHint: this.lang.levels[0],
            progressHint: this.lang.progress[0],
		});
		
		this.ui.popup.show(PopupType.START, true);
		
		this.physics.y = app.height;
		this._res = this.loader.resources;
		this._spawner = new ObjectBuilder(this._res, this.physics);

		this._bg = new PIXI.TilingSprite(this._res["bg0"].texture);
		this._bg.width = app.width;
		this._bg.height = app.height;
		
		
		this.registerInput();

		this.physics.world.on("beginContact", this.onBeginContact, this);
		this.stage.addChild(this._bg, this.physics as any);

		
		this.app.uiManager.hint.open(this.lang.hello);
        super.init(app);
		super.start();
	}

	preload(): PIXI.Loader {
		
		//@ts-ignore
		this.loader.add(Object.values(Assets.Assets));
		return super.preload();
	}

	// --- UI Listener impementing
	setLevel(level: number): void {
		
		this.apiData.current = level;
		this._levelData = GameConfig.levels[level - 1];

		this.physics.world.gravity[1] = (this._levelData.gravity || -40) * PIXEL_TO_METR;
		this._bg.texture = this._res[`bg${level - 1}`].texture;
		
		this.reset()
		this.bookStand();
		this.spawnObject();

		this.gameState.current = GameState.GAME;
	}

	reload(): void {
		this.setLevel(this.apiData.current);
	}

	popupOpened(popup: IPopup): void {
		
		if(popup == IPopup.MENU){
			this.app.uiManager.setOptions({
				showArrows: false,
				level: this.apiData.lastOpenedLevel
			});
		}
	}

	softPause(): boolean {
		return super.softPause();
	}

	// --- Inputs

	_lastFingerId: number = -1;
	_lastTapTime: number = -1;
	_tapRegister: number = -1;
	_latesPosition: PIXI.Point = new PIXI.Point();
	_wasMoved: boolean = false;

	registerInput() {

		if(M2.mobile) {
			this.stage.interactive = true;
			this.stage.on("touchmove", this.onTouchMove, this);
			this.stage.on("touchstart", this.onTouchStart, this);
			this.stage.on("touchcancel", this.onTouchEnd, this);
			this.stage.on("touchend", this.onTouchEnd, this);
			//this.stage.on("tap", this.onTouchTap, this);
			return;
		}
	}

	onTouchMove(e: PIXI.interaction.InteractionEvent) {
		this.target.copyFrom(e.data.global);
		this.target.x = Math.max( 100 , Math.min( this.target.x, this.app.width - 100));
		this.target.x += this.physics.pivot.x;
		this._wasMoved = true;
	}

	_tapState : boolean[] = [];

	onTouchEnd(e: PIXI.interaction.InteractionEvent) {
		this._tapState[e.data.pointerId] = false;
	}

	onTouchStart(e: PIXI.interaction.InteractionEvent) {
		this._tapState[e.data.pointerId] = true;

		if(this._lastTapTime > -1) {
			const delta = e.data.originalEvent.timeStamp - this._lastTapTime;

			if(this._lastFingerId == e.data.pointerId 
					&& delta < GameConfig.doubleTapDelay) {

				console.log("double tap event");
				this.onSpeedDown();
				clearTimeout(this._tapRegister);
				return;
			}
		}
		
		const id = e.data.pointerId;
		this._tapRegister = setTimeout(()=>{
			
			// если отпустили. Чтобы не славить Move
			if(!this._tapState[id]) {
				this.onFlip();
				console.log("sigle tap event");
			}
			this._tapRegister = undefined;

		}, GameConfig.doubleTapDelay);

		this._lastFingerId = e.data.pointerId;
		this._lastTapTime = e.data.originalEvent.timeStamp;
	}

	// --- END Inputs
	
	reset() {
		
		this.physics.pivot.set(0,0);
		this._pool.forEach((e) => {
			e.destroy();
		});

		this._pool = [];
		this._stackSize = 0;
		this._freeSize = 0;
		this._drops = 0;
	}

	spawnObject() {
		let pos = {
			x: this.app.width * 0.5 + this.physics.pivot.x,
			y: this.physics.pivot.y - this.app.height - 200
		}

		const type = M2.randKey(this._levelData.probs);
		const obj = this._spawner.createObject(type, pos);
		obj.angle = M2.randint(4) * 90;
		obj.body.update();
		
		this.target.x = obj.x;
		this.currentObject = obj;
		this._pool.push(obj);

		this._freeSize ++;
	}

	// Нижняя панелька
	bookStand() {

		// 360 - высота BOOK_MIDDLE
		// а еще там скеил

		const width = 360 * 0.5;
		const count = this.app.width / width | 0;
		const pos = 
		{
			x: width * 0.5,
			y: 0
		}
		
		for(let i = 0; i < count; i++) {
			const book = this._spawner.createObject(ObjectType.BOOKS.BOOK_MIDDLE, pos);
			book.angle = 90;
			book.body.update();
			book.freeze = true;
			pos.x += width;
			
			this._pool.push(book);
		}
	}

	onStateEnter(state: GameState) {
		switch(state) {
			case GameState.PRE: {
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					level : this.apiData.lastOpenedLevel
				});
				this.ui.popup.open();
				break;
			}
			case GameState.GAME: {
				this.ui.setOptions({
					showProgress: true,
					progress : 0,
					level : this.apiData.current,
					progressMax: this._levelData.stackToWin
				});
				this.ui.popup.close();
				break;
			}
			case GameState.PREWIN: {

				this.apiData.levelSucsess();
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					level : this.apiData.lastOpenedLevel
				});
				this.ui.popup.show(PopupType.WIN);
				this.gameState.current = GameState.WIN;
				break;	
			}
			case GameState.LOSE: {

				this.apiData.levelFailed();
				this.ui.setOptions({
					showProgress: false,
					progress : 0,
					level : this.apiData.lastOpenedLevel
				});
				this.ui.popup.show(PopupType.LOSE);
				
				setTimeout(()=>{	
					if(this.gameState.current == GameState.LOSE){
						if(this.apiData.loosesAtRun % 3 == 0 && this.lang.falling_3times){
							this.app.uiManager.hint.open(this.lang.falling_3times);
						}else {
							this.app.uiManager.hint.open(this.lang.falling);
						}
					}
				}, 1000);

				break;
			}
			case GameState.WIN: {
				
				setTimeout(()=>{
					if(this.gameState.current == GameState.WIN){
						this.app.uiManager.hint.open(this.lang.endings);
					}
				}, 1000);
				break;
			}
		}
	}

	stop(): void {
		super.stop();	
	}

	
	// its real pause, when tab changed
	pause(): void {
		this.app.uiManager.onPause();
		super.pause();
	}

	// real resume
	resume(): void {
		
		this.app.uiManager.onResume();
		super.resume();
	}
	
	update(ticker: PIXI.Ticker): void {
		if(this._isPaused)
			return;

		if(!M2.mobile && this.input) {
			this.pcInputUpdate(ticker);
		}

		const tx = this._bg.texture;
		this._bg.tilePosition.x =  -this.physics.pivot.x % tx.width;
		this._bg.tilePosition.y =  -this.physics.pivot.y % tx.height;

		if(this.gameState.current == GameState.GAME)
		{
			this.updateObject(ticker);
			this.physics.update();
		
			// мы не должны учитывать первый, так как он летит 
			this.ui.progress = this.totalStackSize - 1;

			if(this.totalStackSize - 1 >= this._levelData.stackToWin) {
				
				this.gameState.current = GameState.PREWIN;
				return;
			}

			if(this.totatlDrops >= this._levelData.maxDrops) {
				
				this.gameState.current = GameState.LOSE;
				return;
			}
		}

	}

	get canUpdateObject() {
		return this.currentObject !== undefined
	}

	_poolUpdateTrotling: number = 0;
	updateObject(ticker: PIXI.Ticker) {

		// чекаем пул каждые 1 / 6 секунду. Нет смысла чаще это делать

		if(this._poolUpdateTrotling > 10) {
			
			this._drops += this.refreshPool();

			if(!this.currentObject) {
				this.spawnObject();
			}

			this._poolUpdateTrotling = 0;
		}
		
		this._poolUpdateTrotling ++;

		if(this.canUpdateObject) {

			const dampLen = 50;
			let offset = this.target.x - this.currentObject.x;
			if( Math.abs(offset) < dampLen) {
				offset /= dampLen;
			} else { 
				offset = Math.sign(offset);
			}
			
			const vel = - offset * GameConfig.objectMoveSpeed * PIXEL_TO_METR;
			this.currentObject.body.velocity[0] = vel;

		}
	}

	_flipTriggered: boolean;
	_speedDownTriggered: boolean;

	pcInputUpdate(ticker: PIXI.Ticker) {
		this.input.update();
			
		const scale = GameConfig.keyboardSpeed * 0.01 * ticker.elapsedMS;
		this.target.x += this.input.axis.x * scale;
		this.target.y += this.input.axis.y * scale;

		this.target.x = Math.max( 100 , Math.min( this.target.x, this.app.width - 100));

		const space = this.input.keys[32];
		const down = this.input.axis.y > 0;

		if(!this._speedDownTriggered && down) {
			this.onSpeedDown();
			this._speedDownTriggered = true;
		}
		
		if(!this._flipTriggered && space) {
			this.onFlip();
			this._flipTriggered = true;
		}

		this._flipTriggered = space && this._flipTriggered;
		this._speedDownTriggered = down && this._speedDownTriggered; 
	}

	refreshPool() : number {

		let index = 0;
		let drops = 0;

		while(this._pool.length > 0 && index < this._pool.length) 
		{
			const prev = this._pool[index];
			const bounds = prev.getBounds(true);
	
			if (bounds.top >= this.app.height) {
				
				// если текущий будет удален, то очищаем ссылку
				if( prev == this.currentObject) {
					this.currentObject = undefined;
				}

				// учитываем только свободные.
				if ( !prev.freeze )
					drops ++;

				prev.destroy();
				this._pool.splice(index, 1);
				continue;
			}
			index ++;
		}
		
		return drops;
	}

	onBeginContact(e: BeginContactEvent) {

		const current = this._pool[this._pool.length - 1].body;		
		if(e.bodyA != current && e.bodyB != current)
			return;
		
		//удаляем все лишнее
		this._drops += this.refreshPool();

		current.velocity[0] *= 0.2;;
		
		let freezable = undefined;
		const maxFreeObj = this._levelData.free || GameConfig.defaulFree;
		
		// фризим 1 не зафриженый снизу

		const limit = this._pool.length - maxFreeObj;
		for(let i = 0; i < limit ; i++) {

			const candidat = this._pool[i];
			if(!candidat.freeze && candidat.body.sleepState != Body.AWAKE) {
				freezable = candidat;
				break;
			}
		}
	
		if(freezable) {

			this._stackSize ++;
			freezable.freeze = true;
			
			new Tween(this.physics.pivot)
				.to({
					y : freezable.y,
					x : freezable.x - this.app.width * 0.5
				}, 500)
				.start();
				
		}

		this.spawnObject();

	}

	onFlip() {
		if(!this.canUpdateObject)
			return;
		
		const vel = Math.PI * 0.5 * GameConfig.objectRotateTime * 5;
		this.currentObject.body.angularVelocity = vel;
		console.log("Flip");
	}

	onSpeedDown() {
		if(!this.canUpdateObject)
			return;
		
		this.currentObject.body.velocity[1] = -400 * PIXEL_TO_METR;
		console.log("Speed");
	}
}
