import { Body, vec2 } from 'p2';
export class PhysicSprite extends PIXI.Sprite {

    type: string;

    setBody(options?: PixiBodyOptions) {
        const display = super.setBody(options);
        
        this.body.allowSleep = true;
        this.body.sleepSpeedLimit = 0.05;
        this.body.sleepTimeLimit = 1;
        this.body.shapes[0].sensor = true;

        return display;
    }

    set freeze(v: boolean) {

        if( v ) {
       
            this.body.type = Body.STATIC;
            this.body.setZeroForce();
            vec2.set(this.body.velocity,0,0);
            this.body.angularVelocity = 0;
            this.body.updateMassProperties();
            this.tint = 0x808080;
       
        } else {
       
            this.body.type = Body.DYNAMIC;
            this.body.updateMassProperties();
       
        }
    }

    get freeze() {
        return this.body.type == Body.STATIC;
    }

    removeBody() {
        if(this.body && this.body.world) {
            this.body.world.removeBody(this.body);
        }
    }

    destroy(options?: any) {
        
        this.removeBody();
        super.destroy(options);
    }
}