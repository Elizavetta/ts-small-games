import { BaseGame, GameState } from '../shared/BaseGame';
import { APIData } from '../shared/APIData';
import { App } from '../index';
import { Assets } from './Assets';
import { Water } from './Water';
import { PopupType } from '../shared/ui/Popup';
import { InputHandler } from '../shared/CrossplatformInputHandler';
import { ControlsLayout } from '../shared/ui/UiManager';
import { Player } from './Player';
import { GameConfig } from './GameConfig';
import { M2 } from '../shared/M2';
import { IMapData, MapBuilder, IBuildResult } from './MapBuilder';
import { genMap } from './DemoMap';
import { Sand, River, LineType } from './Line';
import { ObjectType, Movable } from './Object';
import { IUIListener, IPopup } from '../shared/ui/IUIListener';

export class Frogger extends BaseGame implements IUIListener {

    stage: PIXI.Container = new PIXI.Container();
    builder: MapBuilder;
    water: Water;
    player: Player;
    physics: PIXI.Container = new PIXI.Container();
    mapData: IMapData;
    mapObjects: IBuildResult;

    constructor() {
        super();

        this.apiData = new APIData("Frogger", this);
        this.loader = new PIXI.Loader(Assets.BaseDir);
    }

    preload() {

        //@ts-ignore
		this.loader.add(Object.values(Assets.Assets));
        return super.preload();
    }

    init(app: App){
        this.app = app;
        this.lang = this.app.multilang.getTextBase('Frogger');
        
        this.physics.position.y = app.height;
        this.physics.sortableChildren = true;

        this.gameState.on("enter", this.OnStateEnter, this);

        this.water = new Water(this.loader.resources);
        this.water.updateSize(app.size);

        this.player = new Player(this.loader.resources);
        this.player.on("drown",()=>{
            this.gameState.current = GameState.LOSE;
        });

        this.player.zIndex = 100;
        this.builder = new MapBuilder(this.loader.resources);

        app.uiManager.setOptions({
            showArrows: false,
            showProgress: false,
            level: this.apiData.lastOpenedLevel,
			levelHint: this.lang.levels[0],
            progressHint: this.lang.progress[0],
			controlLayout: M2.mobile ? ControlsLayout.FULL : ControlsLayout.NONE
        });

        app.uiManager.popup.show(PopupType.START, true);
        this.input = new InputHandler(false, M2.mobile);
        this.input.mobileControlls = app.uiManager.controls;

        this.physics.addChild(this.player);
        
        this.builder.bottomOffset = M2.mobile ? GameConfig.MobileBottomOffset : GameConfig.BottomOffset;
        this.builder.topOffset = GameConfig.TopOffset;
        
        this.stage.addChild(
            this.water,
            this.physics);
        
        this.app.uiManager.hint.open(this.lang.hello);

        super.init(app);
        super.start();
    }

    // --- UI Listener impementing
	setLevel(level: number): void {
	
        this.apiData.current = level;
        this.gameState.current = GameState.PRE;
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
	// --- End

    
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
    
    
	OnStateEnter(state: GameState) {
        console.log("State:", state);
        
        if(state == GameState.PRE) {
            
            if(this.gameState.before) {
                this.reset();
            }

            this.app.uiManager.popup.close();
            
            this.mapData = genMap(this.apiData.current);

            const res = this.builder.build(this.mapData);
            this.mapObjects = res;
            
            this.player.localPos.y = -res.playerStart.y;
            this.player.localPos.x = GameConfig.PlayerStart.x;
            this.player._updatePos();

            this.physics.addChild(...res.objects);
            this.gameState.current = GameState.GAME;
        }

        if(state == GameState.GAME) {
            
            this.app.uiManager.setOptions({
                showProgress: true,
                level: this.apiData.current,
                showArrows: M2.mobile,
				progressMax: this.mapObjects.movables.length,
                progress: 0
            });

        }

        if(state == GameState.LOSE) {

            this.apiData.levelFailed();
            this.app.uiManager.setOptions({
                level: this.apiData.lastOpenedLevel,
                showArrows: false,
                showProgress: false,
            });
            this.app.uiManager.popup.show(PopupType.LOSE);

            setTimeout(()=>{
                if(this.gameState.current != GameState.LOSE)
                    return;
                
                const is3loos = this.apiData.loosesAtRun % 3 == 0 && this.apiData.loosesAtRun > 0;
                this.app.uiManager.hint.open(is3loos ? this.lang.falling_3times : this.lang.falling);
            }, 1000);
        }

        if(state == GameState.PREWIN) {
            this.apiData.levelSucsess();
            this.app.uiManager.setOptions({
                showArrows: false,
                showProgress: false,
                level: this.apiData.lastOpenedLevel
            });

            this.app.uiManager.popup.show(PopupType.WIN);
            this.gameState.current = GameState.WIN;
            this.player.move(new PIXI.Point(0,0));
        }

        if(state == GameState.WIN) {
            
            setTimeout(()=>{
                if(this.gameState.current != GameState.WIN)
                    return;
                this.app.uiManager.hint.open(this.lang.endings);
            }, 1000);
        }
    }
    
    update(ticker: PIXI.Ticker) {
        if(this._isPaused) return;

        super.update(ticker);

        if(this.gameState.current == GameState.GAME){
            this._updateGame(ticker);
        }

        //нужно чтобы сплеш обновлять
        this.player.update(ticker);
        this.water.update(ticker);
    }

    reset() {
        this.player.reset();
        this.physics.pivot.y = 0;

        if(this.mapObjects) {
            for (const obj of this.mapObjects.objects) {
                obj.destroy();
            }
        }
    }

    _updateGame(ticker: PIXI.Ticker) {
        this.player.move(this.input.axis);


        const offset = this.player.position.y;
        const pivy = this.physics.pivot.y;
        const offtop = this.builder.topOffset * GameConfig.LineHeight * 2;
        const offbtm = this.builder.bottomOffset * GameConfig.LineHeight;
        
        if(pivy > offset + this.app.height - offtop) {
            this.physics.pivot.y = offset + this.app.height - offtop;
        }

        this.water.scroll(this.physics.pivot);
        
        /*
        if(pivy < offset + this.app.height - offtop) {
            this.physics.pivot.y = offset + this.app.height - offtop;
        }*/

        for(let r of this.mapObjects.rivers) {
            this._updateRiver(r, ticker);
        }

        this.app.uiManager.progress = this._collectRivers();

        if(this.player.currentSandLine && this.player.currentSandLine.type == LineType.ENDING) {
            this.gameState.current = GameState.PREWIN;
        }
    }

    _updateRiver(river: River, ticker: PIXI.Ticker) {
        if(!river.objects) return;

        for(let i = 0; i < river.objects.length; i++) {
            const obj = river.objects[i];
            if(obj instanceof Movable) {

                // азаза=)
                const coef = this.apiData._levels[2].playing || 1;
                obj.x += coef * ticker.deltaMS * obj.speed * GameConfig.RiverSpeed * 0.001;
                
                let b = obj.getBounds(false);
            
                if(b.x > this.app.width && obj.speed > 0) {
                    obj.x = -b.width * 0.5;
                }
                
                if(b.x + b.width < 0 && obj.speed < 0) {
                    obj.x = this.app.width + b.width * 0.5;
                }
                
            }
        }
    }

    _collectRivers(){
        const y = this.player.y;
        let count = 0;
        for(let i = 0; i < this.mapObjects.movables.length; i++) {
            if(this.mapObjects.movables[i].y > y) {
                count ++;
            }
        }
        return count;
    }
}