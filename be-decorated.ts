import {upgrade as upgr, getAttrInfo, doReplace} from './upgrade.js';
import {BeDecoratedProps, BeDecoratedActions, BeDecoratedConfig} from './types';
import {CE} from 'trans-render/lib/CE.js';
import {DefineArgs, WCConfig, Action, PropInfo} from 'trans-render/lib/types';
import {onRemove} from 'trans-render/lib/onRemove.js';
import {intersection} from 'xtal-element/lib/intersection.js';

//be careful about adopting async with onRemove, intersection.  Test be-repeated, example IIb, make sure no repeated calls to renderlist.

export {BeDecoratedProps, MinimalController} from './types';

export const ce = new CE<BeDecoratedProps, BeDecoratedActions, PropInfo, Action<BeDecoratedProps>>();

const reqVirtualProps = ['self', 'emitEvents', 'controller', 'resolved', 'rejected'];

export class BeDecoratedCore<TControllerProps, TControllerActions> extends HTMLElement implements BeDecoratedActions{
    targetToController: WeakMap<any, any> = new WeakMap();
    watchForElementsToUpgrade({upgrade, ifWantsToBe, forceVisible}: this){
        const self = this;
        const callback = (target: Element) => {
            self.newTargets = [...(self as any).newTargets, target];
        }
        upgr({
            shadowDomPeer: this,
            upgrade: upgrade!,
            ifWantsToBe: ifWantsToBe!,
            forceVisible,
        }, callback);
    }

    async #parseAttr({targetToController, noParse, ifWantsToBe, actions, proxyPropDefaults, primaryProp, batonPass}: this, newTarget: Element){
        //I think this is residue from some old code
        // if(!this.#modifiedAttrs){
        //     //do we ever hit this code?
        //     console.log('iah');
        //     doReplace(newTarget!, ifWantsToBe);
        //     this.#modifiedAttrs = true;
        // }
        const controller = targetToController.get(newTarget);
        if(controller){
            if(batonPass){
                const {grabTheBaton} = await import('./relay.js');
                const baton = grabTheBaton(ifWantsToBe, newTarget!);
                if(baton !== undefined){
                    controller[batonPass](controller.proxy, newTarget, this, baton);
                    return true;
                }
            }
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
                        const typedAction = (typeof action === 'string') ? {ifAllOf:[action]} as Action<TControllerProps> : action as Action<TControllerProps>;
                        const props = ce.getProps(ce, typedAction); //TODO:  cache this
                        if(!intersection(queue, props)) continue;
                        if(ce.pq(ce, typedAction, controller.proxy)){
                            filteredActions[methodName] = action;
                        }
                    }
                    ce.doActions(ce, filteredActions, controller, controller.proxy);
                }
            }
            return true;
        }
        return false;
    }

    #emitEvent(ifWantsToBe: string, name: string, detail: any, proxy: Element, controller: EventTarget){
        const namespacedEventName = `be-decorated.${ifWantsToBe}.${name}`;
        proxy.dispatchEvent(new CustomEvent(namespacedEventName,{
            detail
        }));
        if(controller instanceof EventTarget){
            proxy.dispatchEvent(new CustomEvent(name));
        } 
    }

    async #pairTargetWithController({actions, targetToController, virtualProps, controller, ifWantsToBe, noParse, finale, intro, nonDryProps, emitEvents}: this, newTarget: Element){
        if(await this.#parseAttr(this, newTarget)) return;
        const controllerInstance = new controller();
        const revocable = Proxy.revocable(newTarget! as Element & TControllerProps, {
            set: (target: Element & TControllerProps, key: string & keyof TControllerProps, value) => {
                const {propChangeQueue} = controllerInstance;
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
                            const typedAction = (typeof action === 'string') ? {ifAllOf:[action]} as Action<TControllerProps> : action as Action<TControllerProps>;
                            const props = ce.getProps(ce, typedAction); //TODO:  cache this
                            if(!props.has(key as string)) continue;
                            if(ce.pq(ce, typedAction, controllerInstance as any as BeDecoratedProps<any, any>)){
                                filteredActions[methodName] = action;
                            }
                        }
                        const nv = value;
                        const ov = controllerInstance[key];
                        ce.doActions(ce, filteredActions, controllerInstance, controllerInstance.proxy); 
                    }
                }
                if(emitEvents !== undefined){
                    let emitEvent = true;
                    if(Array.isArray(emitEvents)){
                        emitEvent = emitEvents.includes(key)
                    }
                    if(emitEvent){
                        const name = `${ce.toLisp(key)}-changed`;
                        this.#emitEvent(ifWantsToBe, name, {value}, target, controllerInstance as any as EventTarget);
                    }
                }
                if((key==='resolved' || key === 'rejected') && value){
                    this.#emitEvent(ifWantsToBe, key, {value}, target, controllerInstance as any as EventTarget);
                }
                return true;
            },
            get:(target: Element & TControllerProps, key: string & keyof TControllerProps)=>{
                let value;// = Reflect.get(target, key);
                if( (virtualProps !== undefined && virtualProps.includes(key)) || reqVirtualProps.includes(key)){
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
        const {proxy} = revocable;
        controllerInstance.proxy = revocable.proxy;
        if((<any>newTarget).beDecorated === undefined) (<any>newTarget).beDecorated = {};
        const key = ce.toCamel(ifWantsToBe!);
        const existingProp = (<any>newTarget).beDecorated[key];
        if(existingProp !== undefined){
            Object.assign(proxy, existingProp);
        }
        (<any>newTarget).beDecorated[key] = proxy;
        targetToController.set(newTarget, controllerInstance);
        if(intro !== undefined){
            await (<any>controllerInstance)[intro](proxy, newTarget, this);
        }
        (proxy as any).self = newTarget;
        (proxy as any).controller =  controllerInstance;  
        if(emitEvents !== undefined){
            this.#emitEvent(ifWantsToBe, `is-${ifWantsToBe}`, {proxy, controllerInstance}, proxy, controllerInstance as any as EventTarget);
        }
        await this.#parseAttr(this, newTarget);
        onRemove(newTarget!, async (removedEl: Element) => {
            if(controllerInstance !== undefined && finale !== undefined){
                await (<any>controllerInstance)[finale](proxy, removedEl, this);
            }
            if((<any>removedEl).beDecorated !== undefined) delete (<any>removedEl).beDecorated[key];
            (<any>proxy).self = undefined;
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

    async pairTargetsWithController({}: this){
        if(this.newTargets.length === 0) return;
        const lastTarget = this.newTargets.pop(); 
        await this.#pairTargetWithController(this, lastTarget!);
        this.newTargets = [...this.newTargets];
    }
}

type BeDecoratedMC<TControllerProps, TControllerActions> =  BeDecoratedActions & BeDecoratedProps<TControllerProps, TControllerActions>;

export interface BeDecoratedCore<TControllerProps, TControllerActions> extends BeDecoratedMC<TControllerProps, TControllerActions>{}


export function define<
    TControllerProps = any, 
    TControllerActions = TControllerProps,
    TActions = Action<TControllerProps>>(controllerConfig: DefineArgs<TControllerProps, TControllerActions, PropInfo, Action<TControllerProps>>){
    const rC = controllerConfig.config as WCConfig;
    ce.def({
        config:{
            tagName: rC.tagName,
            propDefaults:{
                newTargets: [],
                actions: rC.actions,
                ...rC.propDefaults,
                isC: true,
            },
            // propInfo:{
            //     newTargets:{
            //         dry: false,
            //     }
            // },
            actions:{
                watchForElementsToUpgrade:{
                    ifAllOf: ['isC', 'upgrade', 'ifWantsToBe'],
                    ifKeyIn: ['forceVisible'],
                },
                pairTargetsWithController:{
                    ifAllOf:['newTargets', 'ifWantsToBe', 'controller'],
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
