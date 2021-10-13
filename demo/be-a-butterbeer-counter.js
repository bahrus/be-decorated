import { define } from '../be-decorated.js';
export class ButterbeerController {
    init(a, b) {
        this.count = 0;
    }
    onCountChange() {
        debugger;
    }
}
define({
    config: {
        tagName: 'be-a-butterbeer-counter',
        propDefaults: {
            virtualProps: ['count']
        },
        actions: {
            'onCountChange': {
                ifKeyIn: ['count']
            }
        }
    }
});
