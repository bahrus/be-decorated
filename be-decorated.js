import { upgrade as upgr, getVal } from './upgrade.js';
import { XE } from 'xtal-element/src/XE.js';
import { onRemove } from 'trans-render/lib/onRemove.js';
import { intersection } from 'xtal-element/lib/intersection.js';
export const xe = new XE();
const reqVirtualProps = ['self', 'emitEvents', 'virtualPropsMap'];
export class BeDecoratedCore extends HTMLElement {
    targetToController = new WeakMap();
    virtualPropsMap = new WeakMap();
    watchForElementsToUpgrade({ upgrade, ifWantsToBe, forceVisible }) {
        const self = this;
        const callback = (target) => {
            self.newTarget = target;
        };
        upgr({
            shadowDomPeer: this,
            upgrade: upgrade,
            ifWantsToBe: ifWantsToBe,
            forceVisible,
        }, callback);
        // register in the be-hive registry
    }
    parseAttr({ targetToController, newTarget, noParse, ifWantsToBe, actions, proxyPropDefaults, primaryProp, virtualPropsMap }) {
        const controller = targetToController.get(newTarget);
        if (controller) {
            if (!noParse) { //yes, parse please
                controller.propChangeQueue = new Set();
                if (proxyPropDefaults !== undefined) {
                    Object.assign(controller.proxy, proxyPropDefaults);
                }
                const val = getVal(newTarget, ifWantsToBe);
                const attr = val[0].trim();
                if (this.virtualPropsMap.has(newTarget)) {
                    //this may happen if an element is moved or "frozen" via trans-render/lib/freeze.js after already initialized
                    const virtualProps = this.virtualPropsMap.get(newTarget);
                    if (attr.length > 0) {
                        try {
                            const parsedObj = JSON.parse(attr);
                            Object.assign(virtualProps, parsedObj);
                        }
                        catch (e) {
                            console.error(e);
                        }
                    }
                    Object.assign(controller.proxy, virtualProps);
                }
                else {
                    if (attr !== null && attr.length > 0 && attr[0].length > 0) {
                        if (proxyPropDefaults !== undefined) {
                            Object.assign(controller.proxy, proxyPropDefaults);
                        }
                        let parsedObj;
                        const proxy = controller.proxy;
                        if (primaryProp !== undefined && attr[0] !== '{') {
                            if (attr[0] === '[') {
                                try {
                                    parsedObj = JSON.parse(attr);
                                    proxy[primaryProp] = parsedObj;
                                    virtualPropsMap.set(newTarget, parsedObj);
                                }
                                catch (e) {
                                    proxy[primaryProp] = attr;
                                    virtualPropsMap.set(newTarget, { [primaryProp]: attr });
                                }
                            }
                            else {
                                proxy[primaryProp] = attr;
                                virtualPropsMap.set(newTarget, { [primaryProp]: attr });
                            }
                        }
                        else {
                            try {
                                parsedObj = JSON.parse(attr);
                                Object.assign(proxy, parsedObj);
                                virtualPropsMap.set(newTarget, parsedObj);
                            }
                            catch (e) {
                                console.error({
                                    attr,
                                    e,
                                    newTarget
                                });
                            }
                        }
                    }
                }
                const filteredActions = {};
                const queue = controller.propChangeQueue;
                controller.propChangeQueue = undefined;
                if (actions !== undefined) {
                    for (const methodName in actions) {
                        const action = actions[methodName];
                        const typedAction = (typeof action === 'string') ? { ifAllOf: [action] } : action;
                        const props = xe.getProps(xe, typedAction); //TODO:  cache this
                        //if(!props.has(key as string)) continue;
                        if (!intersection(queue, props))
                            continue;
                        if (xe.pq(xe, typedAction, controller.proxy)) {
                            filteredActions[methodName] = action;
                        }
                    }
                    xe.doActions(xe, filteredActions, controller, controller.proxy);
                }
            }
            return true;
        }
        return false;
    }
    async pairTargetWithController({ newTarget, actions, targetToController, virtualProps, controller, ifWantsToBe, noParse, finale, intro, nonDryProps, emitEvents, virtualPropsMap }) {
        if (this.parseAttr(this))
            return;
        const controllerInstance = new controller();
        const revocable = Proxy.revocable(newTarget, {
            set: (target, key, value) => {
                const { emitEvents, propChangeQueue } = controllerInstance;
                if (nonDryProps === undefined || !nonDryProps.includes(key)) {
                    if (controllerInstance[key] === value) {
                        if (propChangeQueue !== undefined) {
                            propChangeQueue.add(key);
                        }
                        return true;
                    }
                }
                if (reqVirtualProps.includes(key) || (virtualProps !== undefined && virtualProps.includes(key))) {
                    controllerInstance[key] = value;
                    // if(virtualPropsMap.has(target)){
                    //     virtualPropsMap.get(target)![key] = value;
                    // }
                }
                else {
                    target[key] = value;
                }
                if (key === 'self')
                    return true;
                if (propChangeQueue !== undefined) {
                    propChangeQueue.add(key);
                }
                else {
                    if (actions !== undefined) {
                        const filteredActions = {};
                        for (const methodName in actions) {
                            const action = actions[methodName];
                            const typedAction = (typeof action === 'string') ? { ifAllOf: [action] } : action;
                            const props = xe.getProps(xe, typedAction); //TODO:  cache this
                            if (!props.has(key))
                                continue;
                            if (xe.pq(xe, typedAction, controllerInstance)) {
                                filteredActions[methodName] = action;
                            }
                        }
                        const nv = value;
                        const ov = controllerInstance[key];
                        xe.doActions(xe, filteredActions, controllerInstance, controllerInstance.proxy);
                    }
                }
                if (emitEvents !== undefined) {
                    let emitEvent = true;
                    if (Array.isArray(emitEvents)) {
                        emitEvent = emitEvents.includes(key);
                    }
                    if (emitEvent) {
                        const name = `${ifWantsToBe}::${xe.toLisp(key)}-changed`;
                        const detail = {
                            detail: {
                                value
                            }
                        };
                        target.dispatchEvent(new CustomEvent(name, detail));
                    }
                }
                return true;
            },
            get: (target, key) => {
                let value; // = Reflect.get(target, key);
                if (key === 'self' || (virtualProps !== undefined && virtualProps.includes(key)) || reqVirtualProps.includes(key)) {
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
        const { proxy } = revocable;
        controllerInstance.proxy = revocable.proxy;
        if (newTarget.beDecorated === undefined)
            newTarget.beDecorated = {};
        const key = xe.toCamel(ifWantsToBe);
        const existingProp = newTarget.beDecorated[key];
        if (existingProp !== undefined) {
            Object.assign(proxy, existingProp);
        }
        newTarget.beDecorated[key] = proxy;
        targetToController.set(newTarget, controllerInstance);
        if (intro !== undefined) {
            await controllerInstance[intro](proxy, newTarget, this);
        }
        if (emitEvents !== undefined) {
            const name = `${ifWantsToBe}::is-${ifWantsToBe}`;
            const detail = {
                detail: {
                    proxy,
                    controllerInstance
                }
            };
            newTarget.dispatchEvent(new CustomEvent(name, detail));
        }
        this.parseAttr(this);
        onRemove(newTarget, async (removedEl) => {
            if (controllerInstance !== undefined && finale !== undefined) {
                await controllerInstance[finale](proxy, removedEl, this);
            }
            if (removedEl.beDecorated !== undefined)
                delete removedEl.beDecorated[key];
            // Commented out code below doesn't seem to work, so leaving out for now.
            // //element might come back -- need to reactivate if it does
            // const isAttr = removedEl.getAttribute('is-' + this.ifWantsToBe);
            // if(isAttr !== null) {
            //     setTimeout(() => {
            //         removedEl.setAttribute('be-' + this.ifWantsToBe, isAttr);
            //     }, 50);
            // }
            // removedEl.removeAttribute('is-' + this.ifWantsToBe);
            targetToController.delete(removedEl);
            revocable.revoke();
        });
    }
}
export function define(controllerConfig) {
    const rC = controllerConfig.config;
    xe.def({
        config: {
            tagName: rC.tagName,
            propDefaults: {
                actions: rC.actions,
                ...rC.propDefaults,
                isC: true,
            },
            propInfo: {
                newTarget: {
                    dry: false,
                }
            },
            actions: {
                watchForElementsToUpgrade: {
                    ifAllOf: ['isC', 'upgrade', 'ifWantsToBe'],
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
