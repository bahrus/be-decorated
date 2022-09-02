import { addCSSListener } from 'xtal-element/lib/observeCssSelector.js';
export function upgrade(args, callback) {
    const beAttrib = `be-${args.ifWantsToBe}`;
    const id = 'a' + (new Date()).valueOf().toString();
    monitor(id, beAttrib, args, callback);
}
export function doReplace(target, ifWantsToBe) {
    const val = getAttrInfo(target, ifWantsToBe, false);
    if (val === null) {
        //console.warn("Mismatch found.");
        //TODO:  investigate this scenario more.
        return false;
    }
    target.setAttribute(`${val[1]}is-${ifWantsToBe}`, val[0]);
    target.removeAttribute(`${val[1]}be-${ifWantsToBe}`);
    return true;
}
function monitor(id, beAttrib, { upgrade, shadowDomPeer, ifWantsToBe, forceVisible }, callback) {
    const attribSelector = `${upgrade}[${beAttrib}],${upgrade}[data-${beAttrib}]`;
    addCSSListener(id, shadowDomPeer, attribSelector, (e) => {
        if (e.animationName !== id)
            return;
        let target = e.target;
        if (!doReplace(target, ifWantsToBe))
            return;
        if (callback !== undefined)
            callback(target, true);
        target = null;
    }, forceVisible !== undefined ? `
        ${forceVisible.map(s => `${s}[${beAttrib}],${s}[data-${beAttrib}]`).join(',')}{
            display:inline !important;
            position:absolute;
            left:-1000px;
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
