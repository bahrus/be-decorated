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
            virtualProps: ['count', 'on'],
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
const beCounted = document.createElement('be-counted');
beCounted.setAttribute('if-wants-to-be', 'counted');
beCounted.setAttribute('upgrade', '*');

document.head.appendChild(beCounted);