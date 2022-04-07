import { addCSSListener } from 'xtal-element/lib/observeCssSelector.js';
import { UpgradeArg } from './types.d.js';

export function upgrade<T extends EventTarget>(args: UpgradeArg<T>, callback?: (t: T) => void){
    const beAttrib = `be-${args.ifWantsToBe}`;
    const id = 'a' + (new Date()).valueOf().toString();
    monitor(id, beAttrib, args, callback);
}

export const tempAttrLookup = new WeakMap<Element, {[key: string] : (string | null)[]}>();

function monitor<T extends EventTarget>(id: string, beAttrib: string, {upgrade, shadowDomPeer, ifWantsToBe, forceVisible}: UpgradeArg<T>, callback?: (t: T) => void){
    const attribSelector = `${upgrade}[${beAttrib}],${upgrade}[data-${beAttrib}]`;
    addCSSListener(id, shadowDomPeer, attribSelector, (e: AnimationEvent) => {
        if(e.animationName !== id) return;
        const target = e.target;
        const val = getAttrInfo(target as Element, ifWantsToBe, false);
        if(val === null) {
            //console.warn("Mismatch found.");
            //TODO:  investigate this scenario more.
            return;
        }
        if(!tempAttrLookup.has(target as Element)){
            tempAttrLookup.set(target as Element, {});
        }
        const lookup = tempAttrLookup.get(target as Element)!;
        lookup[ifWantsToBe] = val;
        //(target as Element).setAttribute(`${val[1]}is-${ifWantsToBe}`, '');
        //(target as Element).removeAttribute(`${val[1]}be-${ifWantsToBe}`);
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

