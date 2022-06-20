const batonLookup: Map<string, WeakMap<Element, any>> = new Map();

export function passTheBaton(ifWantsToBe: string, element: Element, isoHelper: any){
    if(!batonLookup.has(ifWantsToBe)){
        batonLookup.set(ifWantsToBe, new WeakMap());
    }
    batonLookup.get(ifWantsToBe)!.set(element, isoHelper);
}

export function grabTheBaton(ifWantsToBe: string, element: Element){
    if(batonLookup.has(ifWantsToBe)){
        return batonLookup.get(ifWantsToBe)!.get(element);
    }
    return undefined;
}