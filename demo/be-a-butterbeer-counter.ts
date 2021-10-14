import {ButterbeerCounterProps} from './types';
import {define} from '../be-decorated.js';

export class ButterbeerController{
    init(self: ProxyHandler<HTMLButtonElement>, btn: HTMLButtonElement){
        btn.addEventListener('click', this.handleClick)
        this.count = 0;
    }
    onCountChange(){
        debugger;
    }
    handleClick = (e: MouseEvent) => {
        console.log(e);
        this.count++;
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