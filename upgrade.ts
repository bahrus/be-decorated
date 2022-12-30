
import { UpgradeArg } from './types.d.js';

export async function upgrade<T extends EventTarget>(args: UpgradeArg<T>, callback?: (t: T, replaced: boolean) => void){
    const beAttrib = `be-${args.ifWantsToBe}`;
    const id = 'a' + (new Date()).valueOf().toString();
    await monitor(id, beAttrib, args, callback);
}

export function doReplace(target: EventTarget, ifWantsToBe: string){
    const val = getAttrInfo(target as Element, ifWantsToBe, false);
    if(val === null) {
        //console.debug("Mismatch found.");
        //TODO:  investigate this scenario more.
        return false;
    }
    (target as Element).setAttribute(`${val[1]}is-${ifWantsToBe}`, val[0]!);
    (target as Element).removeAttribute(`${val[1]}be-${ifWantsToBe}`);
    return true;
}

export async function attach<T extends EventTarget>(target: EventTarget, ifWantsToBe: string, callback?: (t: T, replaced: boolean) => void){
    if(!doReplace(target!, ifWantsToBe)) {
        const beDeco = (<any>target).beDecorated;
        if(!beDeco || beDeco[ifWantsToBe] === undefined) return;
    }
    if(callback !== undefined) await callback(target as T, true);
}

async function monitor<T extends EventTarget>(id: string, beAttrib: string, {upgrade, shadowDomPeer, ifWantsToBe, forceVisible}: UpgradeArg<T>, callback?: (t: T, replaced: boolean) => void){
    const attribSelector = `${upgrade}[${beAttrib}],${upgrade}[data-${beAttrib}]`;
    const { addCSSListener } = await  import('trans-render/lib/observeCssSelector.js');
    addCSSListener(id, shadowDomPeer, attribSelector, async (e: AnimationEvent) => {
        if(e.animationName !== id) return;
        let target = e.target;
        const val = getAttrInfo(target as Element, ifWantsToBe, false);
        if(val === null) return; //not sure why this happens.
        await attach(target as EventTarget, ifWantsToBe, callback);
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

