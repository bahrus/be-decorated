export async function upgrade(args, callback) {
    const beAttrib = `be-${args.ifWantsToBe}`;
    const id = 'a-' + crypto.randomUUID();
    await monitor(id, beAttrib, args, callback);
}
export function doReplace(target, ifWantsToBe) {
    const val = getAttrInfo(target, ifWantsToBe, false);
    if (val === null) {
        //console.debug("Mismatch found.");
        //TODO:  investigate this scenario more.
        return false;
    }
    target.setAttribute(`${val[1]}is-${ifWantsToBe}`, val[0]);
    target.removeAttribute(`${val[1]}be-${ifWantsToBe}`);
    return true;
}
export async function attach(target, ifWantsToBe, callback) {
    if (!doReplace(target, ifWantsToBe)) {
        const beDeco = target.beDecorated;
        if (!beDeco || beDeco[ifWantsToBe] === undefined)
            return;
    }
    if (callback !== undefined)
        await callback(target, true);
}
async function monitor(id, beAttrib, { upgrade, shadowDomPeer, ifWantsToBe, forceVisible }, callback) {
    const attribSelector = `${upgrade}[${beAttrib}],${upgrade}[data-${beAttrib}]`;
    const { addCSSListener } = await import('trans-render/lib/observeCssSelector.js');
    addCSSListener(id, shadowDomPeer, attribSelector, async (e) => {
        if (e.animationName !== id)
            return;
        let target = e.target;
        // const val = getAttrInfo(target as Element, ifWantsToBe, false);
        // if(val === null) return; //not sure why this happens.
        await attach(target, ifWantsToBe, callback);
        target = null;
    }, forceVisible !== undefined ? `
        ${forceVisible.map(s => `${s}[${beAttrib}],${s}[data-${beAttrib}]`).join(',')}{
            display:inline !important;
            position:absolute;
            height: 0px;
            width: 0px;
            overflow: hidden;
            left:-1000000px;
        }
    ` : undefined, true);
}
export function getAttrInfo(newTarget, ifWantsToBe, is) {
    const bePrefix = is ? 'is-' : 'be-';
    const dataBePrefix = 'data-' + bePrefix;
    if (newTarget.hasAttribute(bePrefix + ifWantsToBe)) {
        return [newTarget.getAttribute(bePrefix + ifWantsToBe), ''];
    }
    if (newTarget.hasAttribute(dataBePrefix + ifWantsToBe)) {
        return [newTarget.getAttribute(dataBePrefix + ifWantsToBe), 'data-'];
    }
    return null;
}
