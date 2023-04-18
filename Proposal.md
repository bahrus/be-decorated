Highlights:

1.  Can be used during template instantiation to attach behaviors (and other aspects) to built-in and custom elements (no attributes required, as that would be inefficient -- some other way of providing a mapping to be provided).
2.  Can be used to enhance built-in and custom elements from a server rendered HTML via attributes that *ought* to start with enh- , just as custom data attributes ought to start with data-.  But realistically authors will support both enh-* and an attribute without the prefix, just as Angular does (for example).
3.  Class based, extends ElementEnhancement class, which extends EventTarget.
4.  ElementEnhancement has a callback "attachedCallback" which passes in a proxy that wraps the target element.  The proxy prevents passing in properties, or calling methods that are not defined for built-ins to be passed through to the target element (throws an error), and does the same for upgraded custom elements(?).
5.  Adds a similar property as dataset to all Elements, called "enhancements", off of which template instantiation can pass properties needed by the enhancement class instance (even if the enhancement hasn't loaded yet) -- lazy property setting, in other words.
6.  Frameworks could also pass properties down to the enhancement class instance via the same mechanism.
7.  ElementEnhacement class has a callback "detachedCallback"
8.  ElementEnhancement class provides a way of defining an attribute name to associate with the enh- prefix in each shadow DOM realm (following scoped custom element methodology), and callback for when the attribute value changes (but this should, and I suspect would, be used sparingly, in favor of the enhancements property gateway).   AttributeChangedCallback method with two parameters (oldValue, newValue).

The reason the prefix enh-* should be encouraged, but not necessarily required is this:

1.  Requiring it can make the names unnecessarily clunky, unless there's a slam-dunk reason to do so (I'm on the fence).
2.  If enh- is encouraged the way data-* is encouraged, custom element authors will likely avoid that prefix when defining their custom attributes associated with their element, to avoid confusion, making the "ownership" clear.
3.  Should a custom enhancement author choose a name that happens to coincide with one of the attribute names of the custom element, (which seems likely to happen sometimes) now the markup can fallback to enh-[name-of-attribute].   Except how do we avoid calling the attach method for the custom element that uses a matching name, without the enh-*?  I think that means we need a way to specify in each Shadow Realm, including the document root, whether to abide by "strict" mode, where only enh- prefixed attributes are recognized.

Most (all?) of the customElements methods would have a corresponding method in customEnhancements:

1.  customEnhancements.define
2.  customEnhancements.whenDefined
3.  customEnhacements.upgrade

The same solution for scoped registries is applied to these methods.

I *think* we also want to insist that the name have a dash in it, depending on this decision:   The name should cause server-rendered elements with attribute enh-[name passed to define] to create an instance of the class, create the proxy, etc, and call attachedCallback().  Should it do the same if enh-* is dropped?  If so, we need to require a dash in the name.  



(More details to follow).