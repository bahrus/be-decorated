
import { UpgradeArg } from './types.d.js';

export async function upgrade<T extends EventTarget>(args: UpgradeArg<T>, callback?: (t: T, replaced: boolean) => void){
    const beAttrib = `be-${args.ifWantsToBe}`;
    const id = 'a' + (new Date()).valueOf().toString();
    await monitor(id, beAttrib, args, callback);
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

async function monitor<T extends EventTarget>(id: string, beAttrib: string, {upgrade, shadowDomPeer, ifWantsToBe, forceVisible}: UpgradeArg<T>, callback?: (t: T, replaced: boolean) => void){
    const attribSelector = `${upgrade}[${beAttrib}],${upgrade}[data-${beAttrib}]`;
    const directSearch = (shadowDomPeer.getRootNode() as DocumentFragment).querySelectorAll(attribSelector);
    directSearch.forEach(el => {
        if(!doReplace(el, ifWantsToBe)) return;
        if(callback !== undefined) callback(el as any as T, true);
    });
    const { addCSSListener } = await  import('xtal-element/lib/observeCssSelector.js');
    addCSSListener(id, shadowDomPeer, attribSelector, (e: AnimationEvent) => {
        if(e.animationName !== id) return;
        let target = e.target;
        if(!doReplace(target!, ifWantsToBe)) return;
        if(callback !== undefined) callback(target as T, true);
        target = null;
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

