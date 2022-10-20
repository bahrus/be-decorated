import { define } from '../DE.js';
export class ButterbeerController {
    #ac;
    hydrate(pp) {
        this.#ac = new AbortController();
        const { self } = pp;
        self.addEventListener('click', e => {
            this.handleClick(pp, e);
        }, { signal: this.#ac.signal });
    }
    onCountChange({ count }) {
        console.log(count);
    }
    handleClick(pp, e) {
        pp.count++;
    }
}
define({
    config: {
        tagName: 'be-a-butterbeer-counter',
        propDefaults: {
            virtualProps: ['count'],
            upgrade: 'button',
            ifWantsToBe: 'a-butterbeer-counter',
            emitEvents: ['count'],
            proxyPropDefaults: {
                count: 0,
                on: 'click'
            }
        },
        actions: {
            'hydrate': 'on'
        }
    },
    complexPropDefaults: {
        controller: ButterbeerController,
    }
});
document.head.appendChild(document.createElement('be-a-butterbeer-counter'));
