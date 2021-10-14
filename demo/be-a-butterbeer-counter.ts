import {ButterbeerCounterProps} from './types';
import {define} from '../be-decorated.js';

export class ButterbeerController{
    init(a: any, b: any){
        debugger;
        this.count = 0;
    }
    onCountChange(){
        debugger;
    }
}

export interface ButterbeerController extends ButterbeerCounterProps{}

define({
    config:{
        tagName: 'be-a-butterbeer-counter',
        propDefaults:{
            virtualProps: ['count'],
            upgrade: 'button',
            ifWantsToBe: 'a-butterbeer-counter',
            intro: 'init'
        },
        actions:{
            'onCountChange': {
                ifKeyIn: ['count']
            }
        }
    },
    complexPropDefaults:{
        controllerCtor: ButterbeerController,
    }
});
document.head.appendChild(document.createElement('be-a-butterbeer-counter'));