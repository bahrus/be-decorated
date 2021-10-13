import {ButterbeerCounterProps} from './types';
import {define} from '../be-decorated.js';

export class ButterbeerController{
    init(a: any, b: any){
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
            virtualProps: ['count']
        },
        actions:{
            'onCountChange': {
                ifKeyIn: ['count']
            }
        }
    }
});