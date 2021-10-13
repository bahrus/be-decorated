import { addCSSListener } from 'xtal-element/lib/observeCssSelector.js';
import { UpgradeArg } from './types.d.js';

export function upgrade<T extends EventTarget>(args: UpgradeArg<T>, callback?: (t: T) => void){
    const beAttrib = `be-${args.ifWantsToBe}`;
    const id = 'a' + (new Date()).valueOf().toString();
    monitor(id, beAttrib, args, callback);
}

function monitor<T extends EventTarget>(id: string, beAttrib: string, args: UpgradeArg<T>, callback?: (t: T) => void){
    const attribSelector = `${args.upgrade}[${beAttrib}],${args.upgrade}[data-${beAttrib}]`;
    addCSSListener(id, args.shadowDomPeer, attribSelector, (e: AnimationEvent) => {
        if(e.animationName !== id) return;
        const target = e.target;
        const val = getAttrInfo(target as Element, args.ifWantsToBe, false);
        if(val === null) {
            //console.warn("Mismatch found.");
            //TODO:  investigate this scenario more.
            return;
        }
        (target as Element).setAttribute(`${val[1]}is-${args.ifWantsToBe}`, val[0] as string);
        (target as Element).removeAttribute(`${val[1]}be-${args.ifWantsToBe}`);
        if(callback !== undefined) callback(target as T);
    }, args.forceVisible ? `
        ${attribSelector}{
            display:inline !important
        }
    `: undefined);
}

export function getAttrInfo(newTarget: Element, ifWantsToBe: string, is: boolean){
    const bePrefix = is ? 'is-' : 'be-';
    const dataBePrefix = 'data-' + bePrefix;
    if(newTarget.hasAttribute(bePrefix + ifWantsToBe)){
        return [newTarget.getAttribute(bePrefix + ifWantsToBe), ''];
    }
    if(newTarget.hasAttribute(dataBePrefix + ifWantsToBe)){
        return [newTarget.getAttribute(dataBePrefix + ifWantsToBe), 'data-'];
    }
    return null;
}

