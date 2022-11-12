export function isOrWillBe(el: Element, ifWantsToBe: string){
    return el.hasAttribute('is-' + ifWantsToBe) || el.hasAttribute('be-' + ifWantsToBe) || el.hasAttribute('data-is-' + ifWantsToBe) || el.hasAttribute('data-be-' + ifWantsToBe);
}