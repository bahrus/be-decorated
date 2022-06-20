const isoStorage = new Map();
export function store(ifWantsToBe, element, isoHelper) {
    if (!isoStorage.has(ifWantsToBe)) {
        isoStorage.set(ifWantsToBe, new WeakMap());
    }
    isoStorage.get(ifWantsToBe).set(element, isoHelper);
}
export function get(ifWantsToBe, element) {
    if (isoStorage.has(ifWantsToBe)) {
        return isoStorage.get(ifWantsToBe).get(element);
    }
    return undefined;
}
