import { register } from 'be-hive/register.js';
import { define } from 'be-decorated/DE.js';
import { Cloner, proxyPropDefaults } from './Cloner.js';
export class BeClonable extends EventTarget {
    #cloner;
    finale(proxy, target, beDecorProps) {
        if (this.#cloner !== undefined) {
            this.#cloner.dispose();
            this.#cloner = undefined;
        }
    }
    batonPass(pp, target, beDecorProps, baton) {
        this.#cloner = baton;
    }
    async onTriggerInsertPosition(pp) {
        const { proxy } = pp;
        if (this.#cloner === undefined) {
            this.#cloner = new Cloner(proxy, pp);
        }
        await this.#cloner.addCloneButtonTrigger(pp);
        proxy.resolved = true;
    }
    onText(pp) {
        if (this.#cloner === undefined) {
            const { proxy } = pp;
            this.#cloner = new Cloner(proxy, pp);
        }
        this.#cloner.setText(pp);
    }
}
const tagName = 'be-clonable';
const ifWantsToBe = 'clonable';
const upgrade = '*';
define({
    config: {
        tagName,
        propDefaults: {
            ifWantsToBe,
            upgrade,
            finale: 'finale',
            batonPass: 'batonPass',
            virtualProps: ['cloneInsertPosition', 'triggerInsertPosition', 'text'],
            proxyPropDefaults
        },
        actions: {
            onTriggerInsertPosition: 'triggerInsertPosition',
            onText: 'text',
        }
    },
    complexPropDefaults: {
        controller: BeClonable
    }
});
register(ifWantsToBe, upgrade, tagName);
