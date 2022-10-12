import { BeDecoratedProps } from './types';
import { Action, IActionProcessor } from 'trans-render/lib/types';

export async function parse<TControllerProps = any>(self: IActionProcessor, props: BeDecoratedProps, newTarget: Element, controller: any) {
    const { actions, proxyPropDefaults, primaryProp, ifWantsToBe } = props;
    controller.propChangeQueue = new Set<string>();
    if (proxyPropDefaults !== undefined) {
        Object.assign(controller.proxy, proxyPropDefaults);
    }
    const { getAttrInfo } = await import('./upgrade.js');
    const attr = getAttrInfo(newTarget!, ifWantsToBe!, true);
    if(attr === null || attr.length === 0 || attr[0]!.length === 0) return;

        if (proxyPropDefaults !== undefined) {
            Object.assign(controller.proxy, proxyPropDefaults);
        }
        let parsedObj: any;
        let err: any;
        const json = attr[0]!.trim();
        const firstChar = json[0];
        if (firstChar === '{' || firstChar === '[') {
            try {
                parsedObj = JSON.parse(json);
            } catch (e) {
                err = e;
            }
        }
        const proxy = controller.proxy;
        if (primaryProp !== undefined) {
            if (parsedObj === undefined) {
                proxy[primaryProp] = json;
            } else {
                const { primaryPropReq } = props;
                if (Array.isArray(parsedObj) || (primaryPropReq && parsedObj[primaryProp] === undefined)) {
                    proxy[primaryProp] = parsedObj;
                } else {
                    Object.assign(proxy, parsedObj);
                }
            }
        } else {
            if (parsedObj !== undefined) {
                Object.assign(proxy, parsedObj);
            } else {
                console.error({
                    json,
                    err,
                    newTarget
                })
            };
        }
    const filteredActions: any = {};
    const queue = controller.propChangeQueue;
    controller.propChangeQueue = undefined;
    if (actions !== undefined) {
        const { intersection } = await import('trans-render/lib/intersection.js');
        const { doActions } = await import('trans-render/lib/doActions.js');
        const { pq } = await import('trans-render/lib/pq.js');
        for (const methodName in actions) {
            const action = actions[methodName]!;
            const typedAction = (typeof action === 'string') ? { ifAllOf: [action] } as Action<TControllerProps> : action as Action<TControllerProps>;
            const props = getPropsFromActions(typedAction); //TODO:  cache this
            if (!intersection(queue, props)) continue;
            if (await pq(typedAction, controller.proxy)) {
                filteredActions[methodName] = action;
            }
        }
        doActions(self, filteredActions, controller, controller.proxy);
    }
}

    //better name:  getPropsFromActions
export function getPropsFromActions(action: Action): Set<string>{
    return typeof(action) === 'string' ? new Set<string>([action]) : new Set<string>([
        ...(action.ifAllOf || []) as string[], 
        ...(action.ifKeyIn || []) as string[], 
        ...(action.ifNoneOf || []) as string[],
        ...(action.ifEquals || []) as string[],
        ...(action.ifAtLeastOneOf || []) as string[]
    ]);
}