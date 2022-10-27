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
const beCounted = document.createElement('be-counted');
beCounted.setAttribute('if-wants-to-be', 'counted');
beCounted.setAttribute('upgrade', '*');
document.head.appendChild(beCounted);
