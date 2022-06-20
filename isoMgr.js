const isoStorage = new Map();
export function passTheBaton(ifWantsToBe, element, isoHelper) {
    if (!isoStorage.has(ifWantsToBe)) {
        isoStorage.set(ifWantsToBe, new WeakMap());
    }
    isoStorage.get(ifWantsToBe).set(element, isoHelper);
}
export function gripTheBaton(ifWantsToBe, element) {
    if (isoStorage.has(ifWantsToBe)) {
        return isoStorage.get(ifWantsToBe).get(element);
    }
    return undefined;
}
