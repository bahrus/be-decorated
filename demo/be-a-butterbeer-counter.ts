import {PP, Proxy, Actions} from './types';
import {define} from '../DE.js';
import {BeDecoratedProps} from '../types';

export class ButterbeerController implements Actions{
    #ac: AbortController | undefined;
    hydrate(pp: PP){
        this.#ac = new AbortController();
        const {self} = pp;
        self.addEventListener('click', e => {
            this.handleClick(pp, e);
        }, {signal: this.#ac.signal});
    }

    onCountChange({count}: PP){
        console.log(count);
    }
    handleClick(pp: PP, e: Event){
        pp.count++;
    }
}

define<Proxy & BeDecoratedProps<Proxy, Actions>, Actions>({
    config:{
        tagName: 'be-a-butterbeer-counter',
        propDefaults:{
            virtualProps: ['count'],
            upgrade: 'button',
            ifWantsToBe: 'a-butterbeer-counter',
            emitEvents: ['count'],
            proxyPropDefaults:{
                count: 0,
                on: 'click'
            }
        },
        actions:{
            'hydrate': 'on'
        }
    },
    complexPropDefaults:{
        controller: ButterbeerController,
    }
});
document.head.appendChild(document.createElement('be-a-butterbeer-counter'));