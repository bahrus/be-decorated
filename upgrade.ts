import { addCSSListener } from 'xtal-element/lib/observeCssSelector.js';
import { UpgradeArg } from './types.d.js';

export function upgrade<T extends EventTarget>(args: UpgradeArg<T>, callback?: (t: T) => void){
    const beAttrib = `be-${args.ifWantsToBe}`;
    const id = 'a' + (new Date()).valueOf().toString();
    monitor(id, beAttrib, args, callback);
}

export function doReplace(target: EventTarget, ifWantsToBe: string){
    const val = getAttrInfo(target as Element, ifWantsToBe, false);
    if(val === null) {
        //console.warn("Mismatch found.");
        //TODO:  investigate this scenario more.
        return false;
    }
    (target as Element).setAttribute(`${val[1]}is-${ifWantsToBe}`, val[0]!);
    (target as Element).removeAttribute(`${val[1]}be-${ifWantsToBe}`);
    return true;
}

function monitor<T extends EventTarget>(id: string, beAttrib: string, {upgrade, shadowDomPeer, ifWantsToBe, forceVisible}: UpgradeArg<T>, callback?: (t: T) => void){
    const attribSelector = `${upgrade}[${beAttrib}],${upgrade}[data-${beAttrib}]`;
    addCSSListener(id, shadowDomPeer, attribSelector, (e: AnimationEvent) => {
        if(e.animationName !== id) return;
        const target = e.target;
        if(!doReplace(target!, ifWantsToBe)) return;
        if(callback !== undefined) callback(target as T);
    }, forceVisible !== undefined ? `
        ${forceVisible.map(s => `${s}[${beAttrib}],${s}[data-${beAttrib}]`).join(',')}{
            display:inline !important;
            position:absolute;
            left:-1000px;
        }
    `: undefined, true);
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

