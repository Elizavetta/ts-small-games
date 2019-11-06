import { BaseGame, GameState } from '../shared/BaseGame';
import { PhysicContainer } from "../physics/PhysicContainer";
import { Platform, BasePlatform } from './Platform';
import { App } from "..";
import { PlatformPopulator, IPopulatedData } from "./PlatformPopulator";
import { Assets } from './Assets';
import { StaticBack } from "./StaticBack";
import { GameConfig, PlatformType } from './GameConfig';
import { Player, PlayerAnimPhase } from './Player';
import p2, { Box, Shape } from "p2";
import { PIXEL_TO_METR } from "../physics/constants";
import { PixiBody } from '../physics/PixiBody';
import { PopupType } from '../shared/ui/Popup';

import { Tween } from '@tweenjs/tween.js';
import { BonusObject, BonusObjectType, Coins, Ball, Monster, Spikes } from './BonusObject';
import { PlatformBuilder } from './PlatformBuilder';
import { InputHandler } from '../shared/CrossplatformInputHandler';
import { APIData } from "../shared/APIData";
import { ControlsLayout } from '../shared/ui/UiManager';
import { LongPool } from './LongPool';
import { BeginContactEvent } from '../physics/p2Events';
import {PlatformPopelyshev} from "./PlatformPopelyshev";
import { M2 } from '../shared/M2';
import { IUIListener, IPopup } from '../shared/ui/IUIListener';
import { ITextBase } from '../shared/Multilang';
 
const PlayerStartY = 200;

export class Tower extends BaseGame implements IUIListener {
	
	lang: ITextBase;
	pooler: LongPool = new LongPool();
	generator: PlatformPopulator = new PlatformPopelyshev();
	levelData: IPopulatedData;
	platforms: BasePlatform[] = [];
	things: BonusObject[] = []
	bounds: PIXI.DisplayObject[] = [];
	player: Player;
	app: App;
	jumpVel: number;

	stage: PIXI.Container;
	physics: PhysicContainer;
	back: StaticBack;
	progress: number;
	groundLevel: number;
	offsetByCoins: number;

	_levelStartData: {
		cameraPos:PIXI.IPoint,
		groundLevel: number,
		playerPos: PIXI.IPoint
	}

	//builders
	platfomBuilder: PlatformBuilder;

	constructor() {
		super();
		
		this.apiData = new APIData("Tower", this);
		this.stage = new PIXI.Container();
		this.physics = new PhysicContainer({
			gravity: [0, -100]
		});
		this.physics.sortableChildren = true;

		this.loader = new PIXI.Loader(Assets.BaseDir);

		//this.gameState.send(GameState.PRE);
	}

	preload(): PIXI.Loader {

		//@ts-ignore
		this.loader.add(Object.values(Assets.Assets));
		return super.preload();
	}

	init(app: App): void {
		this.app = app;
		this.lang = this.app.multilang.getTextBase('Tower');
		
		this.platfomBuilder = new PlatformBuilder(this.loader.resources, app);
		this.input = new InputHandler(false, M2.mobile);

		this.gameState.on("enter", this.OnStateEnter, this);

		app.uiManager.setOptions({
			level: this.apiData.lastOpenedLevel,
			showProgress: false,
			showArrows: false,
			levelHint: this.lang.levels[0],
			progressHint: this.lang.progress[0],
			progress: 0,
			controlLayout: M2.mobile ? ControlsLayout.HOR : ControlsLayout.NONE
		});

		this.input.mobileControlls = app.uiManager.controls;
		
		app.uiManager.popup.show(PopupType.START, true);
		
		this.stage.position.y = app.height;

		//background
		this.back = new StaticBack(this.loader.resources);
		this.back.updateSize(app.size);
		this.stage.addChild(this.back);

		this.generator.screenSize = app.size;
		this.generator.psize = new PIXI.Rectangle(0, 0, 250, GameConfig.platformHeight);
		this.generator.variants = [
			PlatformType.NORMAL
		];

		this.player = new Player(this.loader.resources);
		this.player.zIndex = 100;

		this.player.jumpVel = Math.sqrt(
			PIXEL_TO_METR *
				2 *
				GameConfig.jumpHeight *
				this.generator.psize.height *
				Math.abs(this.physics.world.gravity[1])
		);
		
		
		this.player.position.set(this.app.width * 0.5, -PlayerStartY);
		this.player.body.update();
		this.player.freeze(true);

		this.createBounds(app.size);

		this.stage.addChild(this.physics as any);
		this.physics.addChild(this.player);
		
		this.app.uiManager.hint.open(M2.mobile ? this.lang.hello : this.lang.hello_pc);

		super.init(app);
		super.start();
	}

	// --- UI Listener Interface

	setLevel(level: number): void {
		this.apiData.current = level;
		this.gameState.current = GameState.GAME;
	}

	reload(): void {
		this.gameState.current = GameState.GAME;
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

	softResume(): void {
		super.softResume();
	}

	startLevel(level: number) {
		//так как мы можем нажать на кнопки из проигрыша
		//ресетим и ребилдим уровень
		this.player.reset();

		this.reset(true);
		this.pooler.reset(true);

		this.platfomBuilder.level = level;
		this.levelData = this.generator.populate(GameConfig.levels[level - 1]);
		let needStartPlatform = level == 1;

		const size = {
			width: this.app.width,
			height: this.levelData.height + this.app.height
		};
		
		this.back._goal.visible = needStartPlatform;
		this.back.updateSize(size);
		this.createPlatforms(size);
		
		this._levelStartData = {
			cameraPos: this.physics.pivot.clone(),
			playerPos: this.player.position.clone(),
			groundLevel : this.groundLevel
		};

		this.physics.world.on("beginContact", this.OnBeginContact, this);

		this.player.freeze(false);
		this.player.jump();
	}

	createThing(parent: Platform, type: BonusObjectType) {

		const res =  this.loader.resources[Assets.Assets["game-atlass"].name];
		const monster = this.loader.resources[Assets.Assets.monster.name].spineData;

		let thing: BonusObject = undefined;
		switch(type){
			case BonusObjectType.COIN:{
				thing = new Coins(res.textures["coin.png"]);
				break;
			}
			case BonusObjectType.BALL: {
				
				thing = new Ball(res.textures["ball.png"]);
				break;
			}
			case BonusObjectType.SPIKES:{
				thing = new Spikes(res.textures["spikes.png"]);
				break;
			}
			case BonusObjectType.MONSTER:{
				thing = new Monster(monster);
				break;
			}
		}

		thing.position.x = parent.position.x;
		
		if(!(thing instanceof Monster)){
	
			thing.position.y = parent.top - thing.height * 0.5;
		} else {
			thing.position.y = parent.top - 200;
			thing._anim.scale.x = Math.sign(this.app.width * 0.5 - thing.position.x);
		}

		if(thing.body)
			thing.body.update();

		return thing;
	}

	createPlatforms(size: { width: number; height: number }) {
		
		const allPoolledObjects = []

		// нижние платформы, так как при старте их может не быть
		// причем тип платформ берем у предыдущего, чтобы не видно было что стиль сменился
		const prevLevel = this.platfomBuilder.level;
		this.platfomBuilder.level = Math.min(1,  prevLevel - 1);

		const start = this.platfomBuilder.Line(this.groundLevel, prevLevel > 1 ? PlatformType.ENDINGS : PlatformType.NORMAL);
		this.platfomBuilder.level = prevLevel;
		
		start.forEach((e) => {
			e.type = PlatformType.NORMAL; // ибо если стартовые = конечным, то это будет тригером конца игры
			e.visible = this.platfomBuilder.level != 1
		}); // скрываем когда там ворота
		
		this.platforms.push(...start);
		allPoolledObjects.push (...start);
	
		let last = 0;
		for (const iterator of this.levelData.data) {
			
			const platform = this.platfomBuilder.Single(iterator.variant);
			const ypos = -iterator.pos.y + this.groundLevel;
			last = Math.min(ypos, last);
			platform.position.set(iterator.pos.x, ypos);

			
			if(iterator.things != BonusObjectType.NONE) {
				const thing = this.createThing(platform as Platform, iterator.things);
				platform.pairBonus(thing);
				
				allPoolledObjects.push (thing);
			}

			this.platforms.push(platform);
			allPoolledObjects.push (platform);
		}
		
		const pos = this.levelData.data[this.levelData.data.length - 1].pos;

		let y = -GameConfig.yDistance.min * GameConfig.platformHeight + last;
		const ends = this.platfomBuilder.Line(y, PlatformType.ENDINGS);
		this.platforms.push(...ends);
		
		allPoolledObjects.push (...ends);


		this.pooler.init(allPoolledObjects, this.physics);
		this._updatePooler();

	}

	createBounds(size: { width: number; height: number }) {

		for (let i = 0; i < 2; i++) {
			const b = new PIXI.Sprite(PIXI.Texture.WHITE);
			b.width = GameConfig.borderOffsets;
			b.height = size.height;
			b.anchor.set(0.5);
			b.position.set(
				GameConfig.borderOffsets * 0.5 + i * (this.app.width - GameConfig.borderOffsets),
				-size.height * 0.5
			);
			const box = new Box({
				width: PIXEL_TO_METR * GameConfig.borderOffsets,
				height: PIXEL_TO_METR * size.height,
			});
			box.collisionGroup = GameConfig.groups.BORDER;

			b.setBody({
				type: p2.Body.STATIC,
				shape: box,
				boundsToShape: false
			});
			b.visible = false;

			this.bounds.push(b);
			this.physics.addChild(b);
		}
	}

	reset(full: boolean = false) {
		try{
			//FIXME 
			// replace off method
			this.physics.world.off("beginContact", this.OnBeginContact);
		} catch{};

		this.groundLevel = 0;
		this.offsetByCoins  = 0;
		this.platforms = []
		this.physics.pivot.set(0,0);
		this.player.position.set(this.app.width * 0.5, -PlayerStartY);
		this.back.scroll({x: 0, y: 0});
		this.back._goal.visible = true;
		this.levelData = undefined;
	}

	cointCollection() {
		
		this.offsetByCoins += GameConfig.coinCost;

		// сверху еще 3 ENDINGS, их нужно сместить
		
		const to = this.platforms.length - 3;
		const from = to - GameConfig.coinCost;

		const targetY = this.platforms[from].y;

		for(let i = to - 1; i >= from; i--) {

			const p = this.platforms[i];

			if(p){
				this.pooler.removeItem(p);
				this.pooler.removeItem(p.child);
		
				if(p.child)
					p.child.destroy();
				p.destroy();
			}
			this.platforms.splice(i, 1);
		}

		// смещаем верхушку
		for(let i = 0; i < 3; i++) {
			const p = this.platforms[this.platforms.length - i - 1];
			p.y = targetY;
			p.body.update();
		}
	}
	//EVENTS ====================================================

	OnBeginContact(e: BeginContactEvent) {

		if(e.bodyA != this.player.body && e.bodyB != this.player.body)
			return;
		
		const other = e.bodyA == this.player.body ? e.bodyB : e.bodyA;

		if (this.player.body.velocity[1] <= 0) {
			
			const display = (other as PixiBody).display;

			if(display instanceof BonusObject) {
				
				let break_event = false;
				switch(display.type) {
					case BonusObjectType.SPIKES:
					case BonusObjectType.MONSTER:
					case BonusObjectType.BALL:
					{
						this.player.damaged();
						break_event = true;
						break; 
					}
					case BonusObjectType.COIN: {
						this.cointCollection();
					}
				}

				display.interract();
				
				if(break_event) {
					return;
				}
			}

			if(display instanceof BasePlatform) {
				this.processPlatformTouch(display);
			}
			
		}
	}

	OnStateEnter(state: GameState) {

		if(state == GameState.GAME) {

			this.player.lockMovement = false;
			
			this.app.uiManager.setOptions({
				level: this.apiData.current,
				showProgress: true,
				showArrows: true,
				progressMax: GameConfig.levels[this.apiData.current - 1].platforms,		
				progress: 0
			});
			this.app.uiManager.popup.close();
			
			this.startLevel(this.apiData.current);
		}

		if(state == GameState.LOSE ) {
			
			this.apiData.levelFailed();
			//APIData.level = Math.max(1, a - 1);

			this.app.uiManager.setOptions({
				showProgress: false,
				showArrows: false,
				level: this.apiData.lastOpenedLevel
			});
			this.app.uiManager
				.popup
				.show(PopupType.LOSE);

			setTimeout(()=>{	
				if(this.gameState.current == GameState.LOSE){
					if(this.apiData.loosesAtRun % 3 == 0 && this.lang.falling_3times){
						this.app.uiManager.hint.open(this.lang.falling_3times);
					}else {
						this.app.uiManager.hint.open(this.lang.falling);
					}
				}
			}, 1000);
				
		}

		if(state == GameState.PREWIN) {
			
			this.apiData.levelSucsess();
			this.app.uiManager.setOptions({
				showProgress: false,
				showArrows: false,
				level: this.apiData.lastOpenedLevel
			});


			let next = this.platforms[this.platforms.length - 1].y;
			new Tween(this.physics.pivot).to({
				y: next
			}, 500)
			.onComplete(()=>{
				this.app.uiManager.popup
				.show(PopupType.WIN)
				.then(()=>{
					this.gameState.current = GameState.WIN;
				});	
			})
			.start();

			this.player.body.velocity = [0,0];
			this.player.lockMovement = true;
		}

		if(state == GameState.WIN) {
			
			this.player.animPhase(PlayerAnimPhase.WIN, true);

			setTimeout(()=>{
				if(this.gameState.current == GameState.WIN){
					this.app.uiManager.hint.open(this.lang.endings);
				}
			}, 1000);
		}
	}

	//==========================================================

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

	stop() {
		this.reset();
		super.stop();
	}

	update(ticker: PIXI.Ticker): void {

		if(this._isPaused) return;

		switch(this.gameState.current){
			case GameState.GAME:
				this.updateGame(ticker);
				break;
		}

		const py = this.player.position.y;
		
		//пофиг, пусть молотит всегда
		this.physics.update();
		this.back.scroll({ y: -this.physics.pivot.y, x: 0 });
	}

	processPlatformTouch(platform: BasePlatform) {
		
		if(this.gameState.current !== GameState.GAME) return;

		//ignore disabled platform
		if(platform.type == PlatformType.DISABLED) return;

		if(platform.type == PlatformType.ENDINGS) {
				
			this.gameState.current = GameState.PREWIN;
		}

		if(platform.type == PlatformType.ICE) {

			this.player.lockMovement = true;

			const vel = Math.sign(this.player.body.velocity[0]);
			const strave = GameConfig.icePlatformEffect.strave * (vel == 0 ?  (1 - 2 * Math.random()) : vel) ;
			
			this.player.applyStrave(strave)
			
			new Tween(this.player)
				.delay(GameConfig.icePlatformEffect.duration * 1000)
				.onComplete(()=>{
					this.player.lockMovement = false;
				})
				.start();
		}
		if(platform.type == PlatformType.STICKY) {
			this.player.applyJumpMutiplier(GameConfig.slickPlatformEffect.mult);
		}

		if(this.gameState.current == GameState.GAME){		
				platform.interract();
				this.player.jump();
		}

	}

	_tmpArea: PIXI.Rectangle = new PIXI.Rectangle();
	updateGame(ticker: PIXI.Ticker){

		this.input.update();
		const dir = this.input.axis.x;
		
		//p2 инвертирует
		this.player.move(-dir);

		if (this.physics.pivot.y > this.player.position.y + this.app.height * 0.5) {
			this.physics.pivot.y = this.player.position.y + this.app.height * 0.5;
		}

		this._updatePooler();

		const objects = this.pooler.placed;
		const pbot = this.player.startHeight * 0.5 + this.player.y;
		
		for (let p of objects) {
			if(p instanceof BasePlatform) {
				p.solid = !(p.y + p.height * 0.5 <= pbot 
					|| this.player.body.velocity[1] >= 0);
			}
		}

		this.bounds[0].y = this.bounds[1].y = this.physics.pivot.y - this.app.height * 0.5;
		
		this.progress = this._collectPlatforms(-this.player.y + this.groundLevel) + this.offsetByCoins;

		// supress decreasing progress bar
		this.app.uiManager.progress = Math.max(this.progress, this.app.uiManager.progress);

		if(this.player.position.y >  this.physics.pivot.y) {
			this.gameState.current = GameState.LOSE;
		}
	}

	_updatePooler() {

		this._tmpArea.width = this.app.width;
		this._tmpArea.height = this.app.height + 400; //чтобы гне пропали раньше и не появлялись позже
		this._tmpArea.y = - this.app.height + this.physics.pivot.y - 200;
		
		this.pooler.safeArea = this._tmpArea;
	}
	
	_collectPlatforms(y: number): number {
		let count = 0;
		for (let i = 0; i < this.levelData.data.length; i++) {
			if (this.levelData.data[i].pos.y < y) 
				count++;
		}
		return count;
	}
}
