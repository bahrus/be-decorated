import { CE } from 'trans-render/lib/CE.js';
export const ce = new CE();
const reqVirtualProps = ['self', 'emitEvents', 'controller', 'resolved', 'rejected'];
export class BeDecoratedCore extends HTMLElement {
    targetToController = new WeakMap();
    async watchForElementsToUpgrade({ upgrade, ifWantsToBe, forceVisible }) {
        const self = this;
        const callback = (target) => {
            self.newTargets = [...self.newTargets, target];
            target = undefined;
        };
        const { upgrade: upgr } = await import('./upgrade.js');
        await upgr({
            shadowDomPeer: this,
            upgrade: upgrade,
            ifWantsToBe: ifWantsToBe,
            forceVisible,
        }, callback);
    }
    async #parseAttr(self, newTarget) {
        //I think this is residue from some old code
        // if(!this.#modifiedAttrs){
        //     //do we ever hit this code?
        //     console.log('iah');
        //     doReplace(newTarget!, ifWantsToBe);
        //     this.#modifiedAttrs = true;
        // }
        const { targetToController } = self;
        const controller = targetToController.get(newTarget);
        if (controller) {
            const { noParse, ifWantsToBe, batonPass } = self;
            if (batonPass) {
                const { grabTheBaton } = await import('./relay.js');
                const baton = grabTheBaton(ifWantsToBe, newTarget);
                if (baton !== undefined) {
                    controller[batonPass](controller.proxy, newTarget, this, baton);
                    return true;
                }
            }
            if (!noParse) { //Yes, parse!
                const { actions, proxyPropDefaults, primaryProp } = self;
                controller.propChangeQueue = new Set();
                if (proxyPropDefaults !== undefined) {
                    Object.assign(controller.proxy, proxyPropDefaults);
                }
                const { getAttrInfo } = await import('./upgrade.js');
                const attr = getAttrInfo(newTarget, ifWantsToBe, true);
                if (attr !== null && attr.length > 0 && attr[0].length > 0) {
                    if (proxyPropDefaults !== undefined) {
                        Object.assign(controller.proxy, proxyPropDefaults);
                    }
                    let parsedObj;
                    let err;
                    const json = attr[0].trim();
                    const firstChar = json[0];
                    if (firstChar === '{' || firstChar === '[') {
                        try {
                            parsedObj = JSON.parse(json);
                        }
                        catch (e) {
                            err = e;
                        }
                    }
                    const proxy = controller.proxy;
                    if (primaryProp !== undefined) {
                        if (parsedObj === undefined) {
                            proxy[primaryProp] = json;
                        }
                        else {
                            const { primaryPropReq } = self;
                            if (Array.isArray(parsedObj) || (primaryPropReq && parsedObj[primaryProp] === undefined)) {
                                proxy[primaryProp] = parsedObj;
                            }
                            else {
                                Object.assign(proxy, parsedObj);
                            }
                        }
                    }
                    else {
                        if (parsedObj !== undefined) {
                            Object.assign(proxy, parsedObj);
                        }
                        else {
                            console.error({
                                json,
                                err,
                                newTarget
                            });
                        }
                        ;
                    }
                }
                const filteredActions = {};
                const queue = controller.propChangeQueue;
                controller.propChangeQueue = undefined;
                if (actions !== undefined) {
                    const { intersection } = await import('xtal-element/lib/intersection.js');
                    const { doActions } = await import('trans-render/lib/doActions.js');
                    for (const methodName in actions) {
                        const action = actions[methodName];
                        const typedAction = (typeof action === 'string') ? { ifAllOf: [action] } : action;
                        const props = ce.getProps(ce, typedAction); //TODO:  cache this
                        if (!intersection(queue, props))
                            continue;
                        if (await ce.pq(ce, typedAction, controller.proxy)) {
                            filteredActions[methodName] = action;
                        }
                    }
                    doActions(ce, filteredActions, controller, controller.proxy);
                }
            }
            return true;
        }
        return false;
    }
    #emitEvent(ifWantsToBe, name, detail, proxy, controller) {
        const namespacedEventName = `be-decorated.${ifWantsToBe}.${name}`;
        proxy.dispatchEvent(new CustomEvent(namespacedEventName, {
            detail
        }));
        if (controller instanceof EventTarget) {
            proxy.dispatchEvent(new CustomEvent(name));
        }
    }
    async #pairTargetWithController({ actions, targetToController, virtualProps, controller, ifWantsToBe, noParse, finale, intro, nonDryProps, emitEvents }, newTarget) {
        if (await this.#parseAttr(this, newTarget))
            return;
        const controllerInstance = new controller();
        const revocable = Proxy.revocable(newTarget, {
            set: (target, key, value) => {
                const { propChangeQueue } = controllerInstance;
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
                }
                else {
                    target[key] = value;
                }
                if (key === 'self')
                    return true;
                (async () => {
                    if (propChangeQueue !== undefined) {
                        propChangeQueue.add(key);
                    }
                    else {
                        if (actions !== undefined) {
                            const filteredActions = {};
                            for (const methodName in actions) {
                                const action = actions[methodName];
                                const typedAction = (typeof action === 'string') ? { ifAllOf: [action] } : action;
                                const props = ce.getProps(ce, typedAction); //TODO:  cache this
                                if (!props.has(key))
                                    continue;
                                if (await ce.pq(ce, typedAction, controllerInstance)) {
                                    filteredActions[methodName] = action;
                                }
                            }
                            const nv = value;
                            const ov = controllerInstance[key];
                            ce.doActions(ce, filteredActions, controllerInstance, controllerInstance.proxy);
                        }
                    }
                    if (emitEvents !== undefined) {
                        let emitEvent = true;
                        if (Array.isArray(emitEvents)) {
                            emitEvent = emitEvents.includes(key);
                        }
                        if (emitEvent) {
                            const name = `${ce.toLisp(key)}-changed`;
                            this.#emitEvent(ifWantsToBe, name, { value }, target, controllerInstance);
                        }
                    }
                    if ((key === 'resolved' || key === 'rejected') && value) {
                        this.#emitEvent(ifWantsToBe, key, { value }, target, controllerInstance);
                    }
                })();
                return true;
            },
            get: (target, key) => {
                let value; // = Reflect.get(target, key);
                if ((virtualProps !== undefined && virtualProps.includes(key)) || reqVirtualProps.includes(key)) {
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
        newTarget.dispatchEvent(new CustomEvent('be-decorated.resolved', {
            detail: {
                value: newTarget.beDecorated
            }
        }));
        const key = ce.toCamel(ifWantsToBe);
        const existingProp = newTarget.beDecorated[key];
        if (existingProp !== undefined) {
            Object.assign(proxy, existingProp);
        }
        newTarget.beDecorated[key] = proxy;
        targetToController.set(newTarget, controllerInstance);
        proxy.self = newTarget;
        proxy.controller = controllerInstance;
        if (intro !== undefined) {
            await controllerInstance[intro](proxy, newTarget, this);
        }
        if (emitEvents !== undefined) {
            this.#emitEvent(ifWantsToBe, `is-${ifWantsToBe}`, { proxy, controllerInstance }, proxy, controllerInstance);
        }
        await this.#parseAttr(this, newTarget);
        const { onRemove } = await import('trans-render/lib/onRemove.js');
        onRemove(newTarget, async (removedEl) => {
            if (controllerInstance !== undefined && finale !== undefined) {
                await controllerInstance[finale](proxy, removedEl, this);
            }
            if (removedEl.beDecorated !== undefined)
                delete removedEl.beDecorated[key];
            proxy.self = undefined;
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
    async pairTargetsWithController({}) {
        if (this.newTargets.length === 0)
            return;
        const lastTarget = this.newTargets.pop();
        await this.#pairTargetWithController(this, lastTarget);
        this.newTargets = [...this.newTargets];
    }
}
export function define(controllerConfig) {
    const rC = controllerConfig.config;
    ce.def({
        config: {
            tagName: rC.tagName,
            propDefaults: {
                newTargets: [],
                actions: rC.actions,
                ...rC.propDefaults,
                isC: true,
                //doInitSearch: false,
                //searchOnce: false,
            },
            // propInfo:{
            //     newTargets:{
            //         dry: false,
            //     }
            // },
            actions: {
                watchForElementsToUpgrade: {
                    ifAllOf: ['isC', 'upgrade', 'ifWantsToBe'],
                    ifKeyIn: ['forceVisible'],
                },
                pairTargetsWithController: {
                    ifAllOf: ['newTargets', 'ifWantsToBe', 'controller'],
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
