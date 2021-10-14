import {ButterbeerCounterProps, ButterbeerCounterActions} from './types';
import {BeDecoratedProps} from '../types';
import {define} from '../be-decorated.js';

export class ButterbeerController{
    #self: ButterbeerCounterProps | undefined;
    init(self: ButterbeerCounterProps, btn: HTMLButtonElement){
        this.#self = self;
        btn.addEventListener('click', this.handleClick)
        self.count = 0;
        
    }
    onCountChange(){
        console.log(this.#self!.count);
    }
    handleClick = (e: MouseEvent) => {
        this.#self!.count++;
    }
}

//type ButterBeerCounterPropsExt = ButterbeerCounterProps & BeDecoratedProps

export interface ButterbeerController extends ButterbeerCounterProps{}

define<ButterbeerCounterProps & BeDecoratedProps, ButterbeerCounterActions>({
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
        controller: ButterbeerController,
    }
});
document.head.appendChild(document.createElement('be-a-butterbeer-counter'));