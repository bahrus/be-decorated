import { define } from '../DE.js';
export class BeCounted extends EventTarget {
    hydrate({ on, self }) {
        return [{ resolved: true }, { handleClick: { on: on, of: self } }];
    }
    handleClick(pp, e) {
        pp.count++;
    }
}
define({
    config: {
        tagName: 'be-counted',
        propDefaults: {
            virtualProps: ['count'],
            upgrade: 'button',
            ifWantsToBe: 'counted',
            emitEvents: ['count'],
            proxyPropDefaults: {
                on: 'click'
            }
        },
        actions: {
            'hydrate': 'on'
        }
    },
    complexPropDefaults: {
        controller: BeCounted,
    }
});
document.head.appendChild(document.createElement('be-counted'));
