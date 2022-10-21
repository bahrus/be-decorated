const batonLookup: Map<string, WeakMap<Element, any>> = new Map();

export function passTheBaton(ifWantsToBe: string, element: Element, isoHelper: any){
    if(!batonLookup.has(ifWantsToBe)){
        batonLookup.set(ifWantsToBe, new WeakMap());
    }
    batonLookup.get(ifWantsToBe)!.set(element, isoHelper);
}

export function grabTheBaton(ifWantsToBe: string, element: Element){
    const lookup = batonLookup.get(ifWantsToBe);
    if(lookup !== undefined){
        const result = lookup.get(element);
        lookup.delete(element);
        return result;
    }
    return undefined;
}