import { register } from 'trans-render/lib/pluginMgr.js';
import { proxyPropDefaults, Cloner } from './Cloner.js';
import { passTheBaton } from 'be-decorated/relay.js';
export const trPlugin = {
    selector: 'beClonableAttribs',
    ready: true,
    processor: async ({ target, val, attrib, host }) => {
        let defaults = { ...proxyPropDefaults };
        if (val) {
            const params = JSON.parse(val);
            Object.assign(defaults, params);
        }
        const cloner = new Cloner(target, defaults);
        cloner.addCloneButtonTrigger(defaults);
        passTheBaton('clonable', target, cloner);
    }
};
register(trPlugin);
