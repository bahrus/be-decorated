import { upgrade as upgr, getAttrInfo } from './upgrade.js';
import { XE } from 'xtal-element/src/XE.js';
import { onRemove } from 'trans-render/lib/onRemove.js';
import { intersection } from 'xtal-element/lib/intersection.js';
export const xe = new XE();
export class BeDecoratedCore extends HTMLElement {
    targetToController = new WeakMap();
    watchForElementsToUpgrade({ upgrade, ifWantsToBe, forceVisible }) {
        const callback = (target) => {
            this.newTarget = target;
        };
        upgr({
            shadowDomPeer: this,
            upgrade: upgrade,
            ifWantsToBe: ifWantsToBe,
            forceVisible,
        }, callback);
    }
    parseAttr({ targetToController, newTarget, noParse, ifWantsToBe, actions }) {
        const controller = targetToController.get(newTarget);
        if (controller) {
            if (!noParse) {
                const attr = getAttrInfo(newTarget, ifWantsToBe, true);
                if (attr !== null && attr.length > 0 && attr[0].length > 0) {
                    controller.propChangeQueue = new Set();
                    Object.assign(controller.proxy, JSON.parse(attr[0]));
                    const filteredActions = {};
                    const queue = controller.propChangeQueue;
                    controller.propChangeQueue = undefined;
                    if (actions !== undefined) {
                        for (const methodName in actions) {
                            const action = actions[methodName];
                            const props = xe.getProps(xe, action); //TODO:  cache this
                            //if(!props.has(key as string)) continue;
                            if (!intersection(queue, props))
                                continue;
                            if (xe.pq(xe, action, this)) {
                                filteredActions[methodName] = action;
                            }
                        }
                        xe.doActions(xe, filteredActions, controller, null);
                    }
                }
            }
            return true;
        }
        return false;
    }
    pairTargetWithController({ newTarget, actions, targetToController, virtualProps, controller: controllerCtor, ifWantsToBe, noParse, finale, intro }) {
        if (this.parseAttr(this))
            return;
        const controller = new controllerCtor();
        const proxy = new Proxy(newTarget, {
            set: (target, key, value) => {
                if (key === 'self' || (virtualProps !== undefined && virtualProps.includes(key))) {
                    controller[key] = value;
                }
                else {
                    target[key] = value;
                }
                if (key === 'self')
                    return true;
                if (controller.propChangeQueue) {
                    controller.propChangeQueue.add(key);
                }
                else {
                    if (actions !== undefined) {
                        const filteredActions = {};
                        for (const methodName in actions) {
                            const action = actions[methodName];
                            const props = xe.getProps(xe, action); //TODO:  cache this
                            if (!props.has(key))
                                continue;
                            if (xe.pq(xe, action, this)) {
                                filteredActions[methodName] = action;
                            }
                        }
                        const nv = value;
                        const ov = controller[key];
                        xe.doActions(xe, filteredActions, controller, { key, ov, nv });
                    }
                }
                return true;
            },
            get: (target, key) => {
                let value; // = Reflect.get(target, key);
                if (key === 'self' || (virtualProps !== undefined && virtualProps.includes(key))) {
                    value = controller[key];
                }
                else {
                    value = target[key]; // = value;
                }
                if (typeof (value) == "function") {
                    return value.bind(target);
                }
                return value;
            }
        });
        controller.proxy = proxy;
        targetToController.set(newTarget, controller);
        if (intro !== undefined) {
            controller[intro](proxy, newTarget);
        }
        this.parseAttr(this);
        onRemove(newTarget, (removedEl) => {
            if (controller !== undefined && finale !== undefined)
                controller[finale](proxy, removedEl);
        });
    }
}
// export function define<TControllerProps, TControllerActions>(metaConfig: BeDecoratedConfig<TControllerProps, TControllerActions>){
//     xe.def(metaConfig.wc)
// }
export function define(controllerConfig) {
    const rC = controllerConfig.config;
    xe.def({
        config: {
            tagName: controllerConfig.config.tagName,
            propDefaults: {
                actions: rC.actions,
                ...rC.propDefaults
            },
            actions: {
                watchForElementsToUpgrade: {
                    ifAllOf: ['upgrade', 'ifWantsToBe'],
                    ifKeyIn: ['forceVisible'],
                },
                pairTargetWithController: {
                    ifAllOf: ['newTarget', 'ifWantsToBe'],
                    ifKeyIn: ['finale', 'virtualProps', 'intro', 'actions']
                },
            }
        },
        complexPropDefaults: {
            ...controllerConfig.complexPropDefaults
        },
        superclass: BeDecoratedCore
    });
}
