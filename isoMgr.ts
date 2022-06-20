const isoStorage: Map<string, WeakMap<Element, any>> = new Map();

export function passTheBaton(ifWantsToBe: string, element: Element, isoHelper: any){
    if(!isoStorage.has(ifWantsToBe)){
        isoStorage.set(ifWantsToBe, new WeakMap());
    }
    isoStorage.get(ifWantsToBe)!.set(element, isoHelper);
}

export function gripTheBaton(ifWantsToBe: string, element: Element){
    if(isoStorage.has(ifWantsToBe)){
        return isoStorage.get(ifWantsToBe)!.get(element);
    }
    return undefined;
}