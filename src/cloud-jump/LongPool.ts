export class LongPool {
    

    childs: PIXI.Container[] = [];
    parent: PIXI.Container;
    
    private _saveArea: PIXI.Rectangle = new PIXI.Rectangle();
    private _placed: PIXI.Container[] = [];
    private _free: PIXI.Container[] = [];

    constructor(){

    }

    init(childs:PIXI.Container[], parent: PIXI.Container){
        this.childs = childs;
        this.parent = parent;
        this._free = [...this.childs];
        this._placed = [];

    }

    set safeArea(r: PIXI.Rectangle) {
        if(r.y == this._saveArea.y && r.height == this._saveArea.height) return;

        this._saveArea.copyFrom(r);
        this.rePulling();
    }

    get safeArea() {
        return this._saveArea.clone();
    }

    reset(destroyChilds: boolean = false) {
        if(destroyChilds) {
            this.childs.forEach((e)=>{
                if(e)
                    e.destroy({children: true});
            })

            this.childs = [];
            this._placed = [];
        }
        
        if(this.parent)
            this.parent.removeChild(...this._placed);
        
        this._free = [...this.childs];
        this._placed = [];
        this._saveArea.x = this._saveArea.y = this._saveArea.width = this.safeArea.height = 0;
    }

    //FIXME Use sorted placement
    rePulling() {
        
        //add new
        let added = [];
        for(let i = this._free.length - 1; i >= 0; i--) {
            
            const el = this._free[i];
            const point = el.position;
            const tested = this.safeArea.contains(point.x, point.y);
            if(tested) {

                this.parent.addChild(el);

                added.push(el);
                this._free.splice(i, 1);
            }
        }

        for(let i = this._placed.length - 1; i >= 0; i--) {
            
            const el = this._placed[i];
            const point = el.position;
            const tested = this.safeArea.contains(point.x, point.y);
            if(!tested) {
                
                this.parent.removeChild(el);

                this._free.push(el);
                this._placed.splice(i, 1);
            }
        }
        
        this._placed.push(...added);
    }

    removeItem( child: PIXI.Container) {
        if(!child) return;

        let index = this.childs.indexOf(child);
        if(index > -1)
            this.childs.splice(index, 1);
        
        index = this._free.indexOf(child);
        if(index > -1)
            this._free.splice(index, 1);
        
        index = this._placed.indexOf(child);
        if(index > -1)
            this._placed.splice(index, 1);
            
    }

    get placed() {
        return this._placed;
    }
}