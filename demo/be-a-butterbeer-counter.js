import { define } from '../be-decorated.js';
export class ButterbeerController {
    init(self, btn) {
        btn.addEventListener('click', this.handleClick);
        this.count = 0;
    }
    onCountChange() {
        debugger;
    }
    handleClick = (e) => {
        console.log(e);
        this.count++;
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
