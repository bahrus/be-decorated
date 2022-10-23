import {PP, Proxy, Actions} from './types';
import {define} from '../DE.js';
import {BeDecoratedProps} from '../types';

export class BeCounted extends EventTarget implements Actions{
    hydrate({on, self}: PP){
        return [{resolved: true}, {handleClick: {on:on, of:self }}]
    }

    handleClick(pp: PP, e: Event){
        pp.count++;
    }
}

define<Proxy & BeDecoratedProps<Proxy, Actions>, Actions>({
    config:{
        tagName: 'be-counted',
        propDefaults:{
            virtualProps: ['count'],
            upgrade: 'button',
            ifWantsToBe: 'counted',
            emitEvents: ['count'],
            proxyPropDefaults:{
                on: 'click'
            }
        },
        actions:{
            'hydrate': 'on'
        }
    },
    complexPropDefaults:{
        controller: BeCounted,
    }
});
document.head.appendChild(document.createElement('be-counted'));