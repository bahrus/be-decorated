import { define } from '../be-decorated.js';
export class ButterbeerController {
    #self;
    init(self, btn) {
        btn.addEventListener('click', this.handleClick);
        self.count = 0;
        this.#self = self;
    }
    onCountChange() {
        debugger;
    }
    handleClick = (e) => {
        console.log(e);
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
        controllerCtor: ButterbeerController,
    }
});
document.head.appendChild(document.createElement('be-a-butterbeer-counter'));
