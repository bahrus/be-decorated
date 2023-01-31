import { lispToCamel } from 'trans-render/lib/lispToCamel.js';
export function attachAndResolve(target, behaviorName, defaultVals) {
    return new Promise(async (resolve) => {
        const ifWantsToBe = behaviorName.replace('be-', '');
        const camel = lispToCamel(ifWantsToBe);
        if (target.beDecorated === undefined) {
            target.beDecorated = {};
        }
        const bed = target.beDecorated;
        if (bed[camel] === undefined) {
            bed[camel] === defaultVals;
        }
        else {
            Object.assign(bed[camel], defaultVals);
        }
        const bc = bed[camel];
        if (bc.self === target) {
            resolve();
            return;
        }
        target.addEventListener('be-decorated.' + ifWantsToBe + '.resolved', e => {
            resolve();
        }, { once: true });
        await customElements.whenDefined(behaviorName);
        const beH = document.createElement(behaviorName);
        beH.attach(target);
    });
}
