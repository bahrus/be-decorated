import {upgrade as upgr, getAttrInfo} from './upgrade.js';
import {BeDecoratedProps, BeDecoratedActions, BeDecoratedConfig} from './types';
import {XE} from 'xtal-element/src/XE.js';
import {DefineArgs} from 'trans-render/lib/types';
import {XAction, PropInfoExt} from 'xtal-element/src/types';
import {onRemove} from 'trans-render/lib/onRemove.js';
import {intersection} from 'xtal-element/lib/intersection.js';

export {BeDecoratedProps, MinimalController} from './types';

export const xe = new XE<BeDecoratedProps, BeDecoratedActions, PropInfoExt, XAction<BeDecoratedProps>>();

const reqVirtualProps = ['self', 'emitEvents', 'debug'];

export class BeDecoratedCore<TControllerProps, TControllerActions> extends HTMLElement implements BeDecoratedActions{
    targetToController: WeakMap<any, any> = new WeakMap();
    watchForElementsToUpgrade({upgrade, ifWantsToBe, forceVisible, waitForUpgrade}: this){
        const callback = async (target: Element) => {
            if(waitForUpgrade && target instanceof HTMLUnknownElement){
                await customElements.whenDefined(target.localName);
                this.newTarget = target;
            }else{
                this.newTarget = target;
            }
            
        }
        upgr({
            shadowDomPeer: this,
            upgrade: upgrade!,
            ifWantsToBe: ifWantsToBe!,
            forceVisible,
        }, callback);
        // register in the be-hive registry




    }

    parseAttr({targetToController, newTarget, noParse, ifWantsToBe, actions, proxyPropDefaults, primaryProp}: this){
        const controller = targetToController.get(newTarget);
        if(controller){
            if(!noParse){
                controller.propChangeQueue = new Set<string>();
                if(proxyPropDefaults !== undefined){
                    Object.assign(controller.proxy, proxyPropDefaults);
                }
                const attr = getAttrInfo(newTarget!, ifWantsToBe!, true);
                if(attr !== null && attr.length > 0 && attr[0]!.length > 0){
                    
                    if(proxyPropDefaults !== undefined){
                        Object.assign(controller.proxy, proxyPropDefaults);
                    }
                    let parsedObj: any;
                    const json = attr[0]!.trim();
                    const proxy = controller.proxy;
                    if(primaryProp !== undefined && json[0] !== '{'){
                        if(json[0] === '['){
                            try{
                                parsedObj = JSON.parse(json);
                                proxy[primaryProp] = parsedObj;
                            }catch(e){
                                proxy[primaryProp] = json;
                            }
                        }else{
                            proxy[primaryProp] = json;
                        }
                        
                    }else{
                        try{
                            parsedObj = JSON.parse(json);
                            Object.assign(proxy, parsedObj)
                        }catch(e){
                            console.error({
                                json,
                                e,
                                newTarget
                            })
                        }
                    }
                }
                const filteredActions: any = {};
                const queue = controller.propChangeQueue;
                controller.propChangeQueue = undefined;
                if(actions !== undefined){
                    for(const methodName in actions){
                        const action = actions[methodName]!;
                        const typedAction = (typeof action === 'string') ? {ifAllOf:[action]} as XAction<TControllerProps> : action as XAction<TControllerProps>;
                        const props = xe.getProps(xe, typedAction); //TODO:  cache this
                        //if(!props.has(key as string)) continue;
                        if(!intersection(queue, props)) continue;
                        if(xe.pq(xe, typedAction, controller.proxy)){
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

    pairTargetWithController({newTarget, actions, targetToController, virtualProps, controller, ifWantsToBe, noParse, finale, intro, nonDryProps, emitEvents}: this){
        if(this.parseAttr(this)) return;
        const controllerInstance = new controller();
        const proxy = new Proxy<Element & TControllerProps>(newTarget! as Element & TControllerProps, {
            set: (target: Element & TControllerProps, key: string & keyof TControllerProps, value) => {
                const {emitEvents, propChangeQueue, debug} = controllerInstance;
                if(nonDryProps === undefined || !nonDryProps.includes(key)){
                    if(controllerInstance[key] === value) {
                        if(propChangeQueue !== undefined){
                            propChangeQueue.add(key);
                        }
                        return true;
                    }
                }
                
                if(reqVirtualProps.includes(key) || (virtualProps !== undefined && virtualProps.includes(key))){
                    controllerInstance[key] = value;
                }else{
                    target[key] = value;
                }
                if(key === 'self') return true;
                if(propChangeQueue !== undefined){
                    propChangeQueue.add(key);
                }else{
                    if(actions !== undefined){
                        const filteredActions: any = {};
                        for(const methodName in actions){
                            const action = actions[methodName]!;
                            const typedAction = (typeof action === 'string') ? {ifAllOf:[action]} as XAction<TControllerProps> : action as XAction<TControllerProps>;
                            const props = xe.getProps(xe, typedAction); //TODO:  cache this
                            if(!props.has(key as string)) continue;
                            if(xe.pq(xe, typedAction, controllerInstance as any as BeDecoratedProps<any, any>)){
                                filteredActions[methodName] = action;
                            }
                        }
                        const nv = value;
                        const ov = controllerInstance[key];
                        xe.doActions(xe, filteredActions, controllerInstance, controllerInstance.proxy); 
                    }
                }
                if(emitEvents !== undefined){
                    let emitEvent = true;
                    if(Array.isArray(emitEvents)){
                        emitEvent = emitEvents.includes(key)
                    }
                    if(emitEvent){
                        const name = `${ifWantsToBe}::${xe.toLisp(key)}-changed`;
                        const detail: CustomEventInit = {
                            detail:{
                                value
                            }
                        };
                        if(debug){
                            console.log({emitEvents, name, detail, target});
                        }
                        target.dispatchEvent(new CustomEvent(name, detail));

                    }
                }
                return true;
            },
            get:(target: Element & TControllerProps, key: string & keyof TControllerProps)=>{
                let value;// = Reflect.get(target, key);
                if(key === 'self' || (virtualProps !== undefined && virtualProps.includes(key)) || reqVirtualProps.includes(key)){
                    value = controllerInstance[key];
                }else{
                    value = target[key];// = value;
                }
                if(typeof(value) == "function"){
                    return value.bind(target);
                }
                return value;
            }
        });
        controllerInstance.proxy = proxy;
        targetToController.set(newTarget, controllerInstance);
        if(intro !== undefined){
            (<any>controllerInstance)[intro](proxy, newTarget, this);
        }
        if(emitEvents !== undefined){
            const name = `${ifWantsToBe}::is-${ifWantsToBe}`;
            const detail: CustomEventInit = {
                detail:{
                    proxy,
                    controllerInstance
                }
            };
            newTarget!.dispatchEvent(new CustomEvent(name, detail));
        }
        this.parseAttr(this);
        if((<any>proxy).debug){
            const debugTempl = document.createElement('template');
            debugTempl.setAttribute(`data-debugger-for-${ifWantsToBe}`, '');
            (<any>debugTempl).controller = controllerInstance;
            (<any>debugTempl).proxy = proxy;
            newTarget!.insertAdjacentElement('afterend', debugTempl);
        }
        onRemove(newTarget!, (removedEl: Element) =>{
            if(controllerInstance !== undefined && finale !== undefined)
            (<any>controllerInstance)[finale](proxy, removedEl, this);
            //element might come back -- need to reactivate if it does
            const isAttr = removedEl.getAttribute('is-' + this.ifWantsToBe);
            if(isAttr !== null) {
                setTimeout(() => {
                    removedEl.setAttribute('be-' + this.ifWantsToBe, isAttr);
                }, 50);
            }
            removedEl.removeAttribute('is-' + this.ifWantsToBe);
            targetToController.delete(removedEl);
        });
    }
}

type BeDecoratedMC<TControllerProps, TControllerActions> =  BeDecoratedActions & BeDecoratedProps<TControllerProps, TControllerActions>;

export interface BeDecoratedCore<TControllerProps, TControllerActions> extends BeDecoratedMC<TControllerProps, TControllerActions>{}

// export function define<TControllerProps, TControllerActions>(metaConfig: BeDecoratedConfig<TControllerProps, TControllerActions>){
//     xe.def(metaConfig.wc)
// }

export function define<
    TControllerProps = any, 
    TControllerActions = TControllerProps,
    TActions = XAction<TControllerProps>>(controllerConfig: DefineArgs<TControllerProps, TControllerActions, PropInfoExt<TControllerProps>, XAction<TControllerProps>>){
    const rC = controllerConfig.config;
    xe.def({
        config:{
            tagName: controllerConfig.config.tagName,
            propDefaults:{
                actions: rC.actions,
                ...rC.propDefaults,
                isC: true,
            },
            propInfo:{
                newTarget:{
                    dry: false,
                }
            },
            actions:{
                watchForElementsToUpgrade:{
                    ifAllOf: ['isC', 'upgrade', 'ifWantsToBe'],
                    ifKeyIn: ['forceVisible'],
                },
                pairTargetWithController:{
                    ifAllOf:['newTarget', 'ifWantsToBe', 'controller'],
                    ifKeyIn:['finale',  'virtualProps', 'intro', 'actions']
                },             
            },
            style:{
                display: 'none'
            }

        },
        complexPropDefaults:{
            ...controllerConfig.complexPropDefaults
        },
        superclass: BeDecoratedCore
    })
}
