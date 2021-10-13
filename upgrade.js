import { addCSSListener } from 'xtal-element/lib/observeCssSelector.js';
export function upgrade(args, callback) {
    const beAttrib = `be-${args.ifWantsToBe}`;
    const id = 'a' + (new Date()).valueOf().toString();
    monitor(id, beAttrib, args, callback);
}
function monitor(id, beAttrib, args, callback) {
    const attribSelector = `${args.upgrade}[${beAttrib}],${args.upgrade}[data-${beAttrib}]`;
    addCSSListener(id, args.shadowDomPeer, attribSelector, (e) => {
        if (e.animationName !== id)
            return;
        const target = e.target;
        const val = getAttrInfo(target, args.ifWantsToBe, false);
        if (val === null) {
            //console.warn("Mismatch found.");
            //TODO:  investigate this scenario more.
            return;
        }
        target.setAttribute(`${val[1]}is-${args.ifWantsToBe}`, val[0]);
        target.removeAttribute(`${val[1]}be-${args.ifWantsToBe}`);
        if (callback !== undefined)
            callback(target);
    }, args.forceVisible ? `
        ${attribSelector}{
            display:inline !important
        }
    ` : undefined);
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
