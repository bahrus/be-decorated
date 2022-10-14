const batonLookup = new Map();
export function passTheBaton(ifWantsToBe, element, isoHelper) {
    if (!batonLookup.has(ifWantsToBe)) {
        batonLookup.set(ifWantsToBe, new WeakMap());
    }
    batonLookup.get(ifWantsToBe).set(element, isoHelper);
}
export function grabTheBaton(ifWantsToBe, element) {
    const lookup = batonLookup.get(ifWantsToBe);
    if (lookup !== undefined) {
        const result = lookup.get(element);
        lookup.delete(element);
        return result;
    }
    return undefined;
}
