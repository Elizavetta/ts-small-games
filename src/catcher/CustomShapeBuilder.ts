import { Shape, Convex, vec2 } from 'p2';
import { PIXEL_TO_METR } from '../physics/constants';

export interface IShapeData {
    shape: number[];
}

export interface IShapeGroup {
    shapes: Shape[];
}

export interface IRect {
    x: number;
    y: number;
    w: number;
    h: number,
    sx: number;
    sy: number;
}
export  class CustomShapeBuilder{
    
    static build(data: IShapeData[], spr: PIXI.Sprite) {
        
        const offset = {
            x: spr.width * spr.anchor.x * PIXEL_TO_METR,
            y: spr.height * spr.anchor.y * PIXEL_TO_METR,
            w: spr.width * PIXEL_TO_METR,
            h: spr.height * PIXEL_TO_METR,
            sx: spr.scale.x,
            sy: spr.scale.y
        }

        const g: IShapeGroup = {
            shapes: []
        }
        for(let i = 0; i < data.length; i++) {
            g.shapes.push(this.buildSingle(data[i], offset));
        }
        return g;
    }

    static buildSingle(data: IShapeData, offset: IRect) {
        const vert = this._prepareVertx(data.shape, offset);
        const shape = new Convex({vertices: vert});
        
        // Move all vertices so its center of mass is in the local center of the convex   
        const cm = vec2.clone(shape.centerOfMass);

        for(var j=0; j!==shape.vertices.length; j++){
            var v = shape.vertices[j];
            vec2.sub(v,v,cm);
        }
        
        shape.updateTriangles();
        shape.updateCenterOfMass();
        shape.updateBoundingRadius();
        
        vec2.sub(shape.position, cm, [offset.x, offset.y]);
     
        return shape;
    }

    private static _prepareVertx(vert: number[], offset: IRect) {
        let result: Array<[number, number]> = [];
        for(let i = 0; i < vert.length; i+=2) {
            result.push([
                offset.w - vert[i] * PIXEL_TO_METR * offset.sx,
                offset.h - vert[i + 1] * PIXEL_TO_METR * offset.sy
            ]);
        }
        return result;
    }
}