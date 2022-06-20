const batonLookup = new Map();
export function passTheBaton(ifWantsToBe, element, isoHelper) {
    if (!batonLookup.has(ifWantsToBe)) {
        batonLookup.set(ifWantsToBe, new WeakMap());
    }
    batonLookup.get(ifWantsToBe).set(element, isoHelper);
}
export function grabTheBaton(ifWantsToBe, element) {
    if (batonLookup.has(ifWantsToBe)) {
        return batonLookup.get(ifWantsToBe).get(element);
    }
    return undefined;
}
