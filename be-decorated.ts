import {upgrade as upgr, getAttrInfo} from './upgrade.js';
import {BeDecoratedProps, BeDecoratedActions, BeDecoratedConfig} from './types';
import {XE} from 'xtal-element/src/XE.js';
import {DefineArgs} from 'trans-render/lib/types';
import {onRemove} from 'trans-render/lib/onRemove.js';
import {intersection} from 'xtal-element/lib/intersection.js';

export const xe = new XE<BeDecoratedProps, BeDecoratedActions>();

export class BeDecoratedCore<TControllerProps, TControllerActions> extends HTMLElement implements BeDecoratedActions{
    targetToController: WeakMap<any, any> = new WeakMap();
    watchForElementsToUpgrade({upgrade, ifWantsToBe, forceVisible}: this){
        const callback = (target: Element) => {
            this.newTarget = target;
        }
        upgr({
            shadowDomPeer: this,
            upgrade: upgrade!,
            ifWantsToBe: ifWantsToBe!,
            forceVisible,
        }, callback);
    }

    parseAttr({targetToController, newTarget, noParse, ifWantsToBe, actions}: this){
        const controller = targetToController.get(newTarget);
        if(controller){
            if(!noParse){
                const attr = getAttrInfo(newTarget!, ifWantsToBe!, true);
                if(attr !== null && attr.length > 0 && attr[0]!.length > 0){
                    controller.propChangeQueue = new Set<string>();
                    Object.assign(controller.proxy, JSON.parse(attr[0]!));
                    const filteredActions: any = {};
                    const queue = controller.propChangeQueue;
                    controller.propChangeQueue = undefined;
                    if(actions !== undefined){
                        for(const methodName in actions){
                            const action = actions[methodName]!;
                            const props = xe.getProps(xe, action); //TODO:  cache this
                            //if(!props.has(key as string)) continue;
                            if(!intersection(queue, props)) continue;
                            if(xe.pq(xe, action, this)){
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

    pairTargetWithController({newTarget, actions, targetToController, virtualProps, controllerCtor, ifWantsToBe, noParse, finale, intro}: this){
        if(this.parseAttr(this)) return;
        const controller = new controllerCtor();
        const proxy = new Proxy(newTarget!, {
            set: (target: any, key, value) => {
                if(key === 'self' || (virtualProps !== undefined && virtualProps.includes(key as string))){
                    controller[key] = value;
                }else{
                    target[key] = value;
                }
                if(key === 'self') return true;
                if(controller.propChangeQueue){
                    controller.propChangeQueue.add(key);
                }else{
                    if(actions !== undefined){
                        const filteredActions: any = {};
                        for(const methodName in actions){
                            const action = actions[methodName]!;
                            const props = xe.getProps(xe, action); //TODO:  cache this
                            if(!props.has(key as string)) continue;
                            if(xe.pq(xe, action, this)){
                                filteredActions[methodName] = action;
                            }
                        }
                        const nv = value;
                        const ov = controller[key];
                        xe.doActions(xe, filteredActions, controller, {key, ov, nv}); 
                    }
                }

                return true;
            },
            get:(target, key)=>{
                let value;// = Reflect.get(target, key);
                if(key === 'self' || (virtualProps !== undefined && virtualProps.includes(key as string))){
                    value = controller[key];
                }else{
                    value = target[key];// = value;
                }
                if(typeof(value) == "function"){
                    return value.bind(target);
                }
                return value;
            }
        });
        controller.proxy = proxy;
        targetToController.set(newTarget, controller);
        if(intro !== undefined){
            controller[intro](proxy, newTarget);
        }
        this.parseAttr(this);
        onRemove(newTarget!, (removedEl: Element) =>{
            if(controller !== undefined && finale !== undefined)
            controller[finale](proxy, removedEl);
        });
    }
}

type BeDecoratedMC<TControllerProps, TControllerActions> =  BeDecoratedActions & BeDecoratedProps<TControllerProps, TControllerActions>;

export interface BeDecoratedCore<TControllerProps, TControllerActions> extends BeDecoratedMC<TControllerProps, TControllerActions>{}

// export function define<TControllerProps, TControllerActions>(metaConfig: BeDecoratedConfig<TControllerProps, TControllerActions>){
//     xe.def(metaConfig.wc)
// }

export function define(controllerConfig: DefineArgs){
    const rC = controllerConfig.config;
    xe.def({
        config:{
            tagName: controllerConfig.config.tagName,
            propDefaults:{
                actions: rC.actions,
                ...rC.propDefaults
            }, 
            actions:{
                watchForElementsToUpgrade:{
                    ifAllOf: ['upgrade', 'ifWantsToBe'],
                    ifKeyIn: ['forceVisible'],
                },
                pairTargetWithController:{
                    ifAllOf:['newTarget', 'ifWantsToBe'],
                    ifKeyIn:['finale',  'virtualProps', 'intro', 'actions']
                },             
            }
        },
        complexPropDefaults:{
            ...controllerConfig.complexPropDefaults
        },
        superclass: BeDecoratedCore
    })
}
