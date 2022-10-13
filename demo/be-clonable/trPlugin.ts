import {RenderContext, TransformPluginSettings} from 'trans-render/lib/types';
import {register} from 'trans-render/lib/pluginMgr.js';
import {VirtualProps} from './types';
import {proxyPropDefaults, Cloner} from './Cloner.js';
import {passTheBaton} from 'be-decorated/relay.js';

export const trPlugin: TransformPluginSettings = {
    selector: 'beClonableAttribs',
    ready: true,
    processor:  async ({target, val, attrib, host}: RenderContext) => {
        let defaults = {...proxyPropDefaults};
        if(val){
            const params = JSON.parse(val) as VirtualProps;
            Object.assign(defaults, params);
        }
        const cloner = new Cloner(target!, defaults);
        cloner.addCloneButtonTrigger(defaults);
        passTheBaton('clonable', target!, cloner);
    }
}

register(trPlugin);