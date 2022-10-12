export class DE extends HTMLElement {
    static DA;
    #ifWantsToBe;
    #upgrade;
    connectedCallback() {
        this.#ifWantsToBe = this.getAttribute('if-wants-to-be');
        this.#upgrade = this.getAttribute('upgrade');
        this.#watchForElementsToUpgrade();
    }
    async #watchForElementsToUpgrade() {
        const da = this.constructor.DA;
        const controller = da.complexPropDefaults.controller;
        const { config } = da;
        const propDefaults = config.propDefaults;
        const { upgrade, ifWantsToBe, forceVisible, batonPass, noParse } = propDefaults;
        const callback = async (target) => {
            const controllerInstance = new controller();
            if (batonPass) {
                const { grabTheBaton } = await import('./relay.js');
                const baton = grabTheBaton(ifWantsToBe, target);
                if (baton !== undefined) {
                    throw 'NI';
                    //controller[batonPass](controller.proxy, newTarget, this, baton);
                    return;
                }
            }
            const { nonDryProps, emitEvents } = propDefaults;
            if (target.beDecorated === undefined)
                target.beDecorated = {};
            const { lispToCamel } = await import('trans-render/lib/lispToCamel.js');
            const key = lispToCamel(ifWantsToBe);
            const existingProp = target.beDecorated[key];
            console.log({ controllerInstance });
            const { propChangeQueue } = controllerInstance;
            const revocable = Proxy.revocable(target, {
                set: (target, key, value) => {
                    const { propChangeQueue } = controllerInstance;
                    const { virtualProps, actions } = propDefaults;
                    if (nonDryProps === undefined || !nonDryProps.includes(key)) {
                        if (controllerInstance[key] === value) {
                            if (propChangeQueue !== undefined) {
                                propChangeQueue.add(key);
                            }
                            return true;
                        }
                        if (reqVirtualProps.includes(key) || (virtualProps !== undefined && virtualProps.includes(key))) {
                            controllerInstance[key] = value;
                        }
                        else {
                            target[key] = value;
                        }
                        if (key === 'self')
                            return true;
                    }
                    (async () => {
                        if (propChangeQueue !== undefined) {
                            propChangeQueue.add(key);
                        }
                        else {
                            if (actions !== undefined) {
                                const filteredActions = {};
                                const { getPropsFromActions } = await import('./parse.js');
                                const { pq } = await import('trans-render/lib/pq.js');
                                for (const methodName in actions) {
                                    const action = actions[methodName];
                                    const typedAction = (typeof action === 'string') ? { ifAllOf: [action] } : action;
                                    const props = getPropsFromActions(typedAction); //TODO:  cache this
                                    if (!props.has(key))
                                        continue;
                                    if (await pq(typedAction, controllerInstance)) {
                                        filteredActions[methodName] = action;
                                    }
                                }
                                const nv = value;
                                const ov = controllerInstance[key];
                                this.doActions(this, filteredActions, controllerInstance, controllerInstance.proxy);
                            }
                        }
                        if (emitEvents !== undefined) {
                            let emitEvent = true;
                            if (Array.isArray(emitEvents)) {
                                emitEvent = emitEvents.includes(key);
                            }
                            if (emitEvent) {
                                const { camelToLisp } = await import('trans-render/lib/camelToLisp.js');
                                const name = `${camelToLisp(key)}-changed`;
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
                    const { virtualProps } = propDefaults;
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
            controllerInstance.proxy = proxy;
            if (!noParse) { //yes, parse!
                const { parse } = await import('./parse.js');
                await parse(this, propDefaults, target, controllerInstance);
            }
            if (existingProp !== undefined) {
                Object.assign(proxy, existingProp);
            }
            target.beDecorated[key] = proxy;
            proxy.self = target;
            proxy.controller = controllerInstance;
            target.dispatchEvent(new CustomEvent('be-decorated.resolved', {
                detail: {
                    value: target.beDecorated
                }
            }));
            const { intro, finale } = propDefaults;
            if (intro !== undefined) {
                await controllerInstance[intro](proxy, target, this);
            }
            if (emitEvents !== undefined) {
                this.#emitEvent(ifWantsToBe, `is-${ifWantsToBe}`, { proxy, controllerInstance }, proxy, controllerInstance);
            }
            const { onRemove } = await import('trans-render/lib/onRemove.js');
            onRemove(target, async (removedEl) => {
                if (controllerInstance !== undefined && finale !== undefined) {
                    await controllerInstance[finale](proxy, removedEl, this);
                }
                if (removedEl.beDecorated !== undefined)
                    delete removedEl.beDecorated[key];
                proxy.self = undefined;
                revocable.revoke();
            });
        };
        const { upgrade: u } = await import('./upgrade.js');
        await u({
            shadowDomPeer: this,
            upgrade,
            ifWantsToBe: ifWantsToBe,
            forceVisible,
        }, callback);
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
    async doActions(self, actions, target, proxy) {
        const { doActions } = await import('trans-render/lib/doActions.js');
        await doActions(self, actions, target, proxy);
    }
    postHoc(self, action, target, returnVal, proxy) {
    }
}
export function define(controllerConfig) {
    const { config } = controllerConfig;
    const { tagName } = config;
    if (customElements.get(tagName) !== undefined)
        return;
    class DECO extends DE {
    }
    DECO.DA = controllerConfig;
    customElements.define(tagName, DECO);
}
const reqVirtualProps = ['self', 'emitEvents', 'controller', 'resolved', 'rejected'];
