import { define } from '../be-decorated.js';
export class ButterbeerController {
    #self;
    init(self, btn) {
        this.#self = self;
        btn.addEventListener('click', this.handleClick);
        self.count = 0;
    }
    onCountChange() {
        console.log(this.#self.count);
    }
    handleClick = (e) => {
        this.#self.count++;
    };
}
define({
    config: {
        tagName: 'be-a-butterbeer-counter',
        propDefaults: {
            virtualProps: ['count'],
            upgrade: 'button',
            ifWantsToBe: 'a-butterbeer-counter',
            intro: 'init'
        },
        actions: {
            'onCountChange': {
                ifKeyIn: ['count']
            }
        }
    },
    complexPropDefaults: {
        controller: ButterbeerController,
    }
});
document.head.appendChild(document.createElement('be-a-butterbeer-counter'));
