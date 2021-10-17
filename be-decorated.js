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
        // register in the be-hive registry
        const rn = this.getRootNode();
        const sym = Symbol.for('be-hive');
        if (rn[sym] === undefined) {
            rn[sym] = {};
        }
        rn[sym][this.localName] = ifWantsToBe;
    }
    parseAttr({ targetToController, newTarget, noParse, ifWantsToBe, actions, proxyPropDefaults }) {
        const controller = targetToController.get(newTarget);
        if (controller) {
            if (!noParse) {
                const attr = getAttrInfo(newTarget, ifWantsToBe, true);
                if (attr !== null && attr.length > 0 && attr[0].length > 0) {
                    controller.propChangeQueue = new Set();
                    if (proxyPropDefaults !== undefined) {
                        Object.assign(controller.proxy, proxyPropDefaults);
                    }
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
                            if (xe.pq(xe, action, controller.proxy)) {
                                filteredActions[methodName] = action;
                            }
                        }
                        xe.doActions(xe, filteredActions, controller, controller.proxy);
                    }
                }
            }
            return true;
        }
        return false;
    }
    pairTargetWithController({ newTarget, actions, targetToController, virtualProps, controller, ifWantsToBe, noParse, finale, intro }) {
        if (this.parseAttr(this))
            return;
        const controllerInstance = new controller();
        const proxy = new Proxy(newTarget, {
            set: (target, key, value) => {
                if (key === 'self' || (virtualProps !== undefined && virtualProps.includes(key))) {
                    controllerInstance[key] = value;
                }
                else {
                    target[key] = value;
                }
                if (key === 'self')
                    return true;
                if (controllerInstance.propChangeQueue) {
                    controllerInstance.propChangeQueue.add(key);
                }
                else {
                    if (actions !== undefined) {
                        const filteredActions = {};
                        for (const methodName in actions) {
                            const action = actions[methodName];
                            const props = xe.getProps(xe, action); //TODO:  cache this
                            if (!props.has(key))
                                continue;
                            if (xe.pq(xe, action, controllerInstance)) {
                                filteredActions[methodName] = action;
                            }
                        }
                        const nv = value;
                        const ov = controllerInstance[key];
                        xe.doActions(xe, filteredActions, controllerInstance, controllerInstance.proxy);
                    }
                }
                return true;
            },
            get: (target, key) => {
                let value; // = Reflect.get(target, key);
                if (key === 'self' || (virtualProps !== undefined && virtualProps.includes(key))) {
                    value = controllerInstance[key];
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
        controllerInstance.proxy = proxy;
        targetToController.set(newTarget, controllerInstance);
        if (intro !== undefined) {
            controllerInstance[intro](proxy, newTarget, this);
        }
        this.parseAttr(this);
        onRemove(newTarget, (removedEl) => {
            if (controllerInstance !== undefined && finale !== undefined)
                controllerInstance[finale](proxy, removedEl, this);
            //element might come back -- need to reactivate if it does
            const isAttr = removedEl.getAttribute('is-' + this.ifWantsToBe);
            if (isAttr !== null) {
                setTimeout(() => {
                    removedEl.setAttribute('be-' + this.ifWantsToBe, isAttr);
                }, 50);
            }
            removedEl.removeAttribute('is-' + this.ifWantsToBe);
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
                    ifAllOf: ['newTarget', 'ifWantsToBe', 'controller'],
                    ifKeyIn: ['finale', 'virtualProps', 'intro', 'actions']
                },
            },
            style: {
                display: 'none'
            }
        },
        complexPropDefaults: {
            ...controllerConfig.complexPropDefaults
        },
        superclass: BeDecoratedCore
    });
}
