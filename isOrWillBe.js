export function isOrWillBe(el, ifWantsToBe) {
    return el.hasAttribute('is-' + ifWantsToBe) || el.hasAttribute('be-' + ifWantsToBe) || el.hasAttribute('data-is-' + ifWantsToBe) || el.hasAttribute('data-be-' + ifWantsToBe);
}
