## Purpose

The need to be able to enhance existing elements in cross-cutting ways has been demonstrated by countless frameworks, [old](https://jqueryui.com/about/) and [new](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/).  As the latter link indicates, there are great synergies that can be achieved between the client and the server with these declarative blocks of settings.

The fact that there is an urgent need for this functionality with template instantiation, leads me to believe this is an opportune time to take stock of all these solutions, and adopt an approach that makes sense in the context of streaming, declarative ShadowDOM, combined with template instantiation.  I think it is clear that we want the solution to provide both progressive enhancement for server-rendered HTML, and completely optimized ways of defining the linkages between DOM elements and the class definition that can enhance the DOM element. I think for template instantiation to really succeed, which I very much want it to do, it needs extensibility, which this functionality provides.

## Highlights:

1.  Can be used during template instantiation to attach behaviors (and other aspects) to built-in and custom elements (no attributes required, as that would be inefficient -- some other way of providing a mapping to be provided).
2.  Can be used to enhance built-in and custom elements from a server rendered HTML via attributes that *ought* to start with enh- , just as custom data attributes ought to start with data-.  But realistically authors will support both enh-* and an attribute without the prefix, just as Angular does (for example).
3.  Class based, extends ElementEnhancement class, which extends EventTarget.
4.  These classes can define a callback, "attachedCallback" which passes in a proxy that wraps the target element.  The proxy prevents pass-through of properties, or calling methods that are not defined for built-ins to be passed through to the target element (throws an error), and does the same for upgraded custom elements(?).  The call back should probably also pass the original target element, for faster read only access.  We need to provide developers tools to do the right thing, while not hampering their ability to get maximum performance.
5.  Adds a similar property as dataset to all Elements, called "enhancements", off of which template instantiation can pass properties needed by the enhancement class instance (even if the enhancement hasn't loaded yet) -- lazy property setting, in other words.
6.  Frameworks could also pass properties down to the enhancement class instance via the same mechanism.
7.  ElementEnhancement class has a callback "detachedCallback."
8.  ElementEnhancement class provides a way of defining an attribute name to associate with the enh- prefix in each shadow DOM realm (following scoped custom element methodology), and callback for when the attribute value changes (but this should, and I suspect would, be used sparingly, in favor of the enhancements property gateway).   AttributeChangedCallback method with two parameters (oldValue, newValue).

## Use of enh-* prefix for server-rendered progressive enhancement - required?

The reason the prefix enh-* should be encouraged, but not necessarily required is this:

1.  Requiring it can make the names unnecessarily clunky, unless there's a slam-dunk reason to do so (I'm on the fence).
2.  If enh- is encouraged the way data-* is encouraged, custom element authors will likely avoid that prefix when defining their custom attributes associated with their element, to avoid confusion, making the "ownership" clear.
3.  Should a custom enhancement author choose a name that happens to coincide with one of the attribute names of the custom element, (which seems likely to happen sometimes) now the markup can fallback to enh-[name-of-attribute].   Except how do we avoid calling the attach method for the custom element that uses a matching name, without the enh-*?  I think that means we need a way to specify in each Shadow Realm, including the document root, whether to abide by "strict" mode, where only enh- prefixed attributes are recognized.

Most (all?) of the customElements methods would have a corresponding method in customEnhancements:

1.  customEnhancements.define
2.  customEnhancements.whenDefined
3.  customEnhancements.upgrade

The same solution for scoped registries is applied to these methods.

I *think* we also want to insist that the name has a dash in it, depending on this decision:   The name should cause server-rendered elements with attribute enh-[name passed to define] to create an instance of the class, create the proxy, etc, and call attachedCallback().  Should it do the same if enh-* is dropped?  If so, we need to require a dash in the name.  

##  Mapping template elements to enhancement classes.

Let's first cast aside the important, but delicate and difficult question of how we can take server-rendered initial render of a DOM element and "reverse-engineer" it into a template. Let's just assume we have a template that we want to use for repeated template instantiation:

For example:

```html
<template>
    <div>
        <span></span>
        <button></button>
    </div>
    <section>
        <span></span>
        <button></button>
    </section>
<template>
```

Now the developer defines a class that provides the ability to keep track of how many times a button has been clicked, and that can broadcast that count to other elements near-by, which extends ElementEnhancement.

An example, in concept, of such a class, used in a POC for this proposal, can be [seen here](https://github.com/bahrus/be-counted), just to make the concept less abstract (the POC will not exactly follow what this proposal will outline as far as defining and registering the class), but basically, for server-rendered progressive enhancement, the **server-rendered** HTML this class expects would look as follows:

```html
<span></span>
<button enh-be-counted='{
    "transform": {
        "span": "value"
    }
}'>Count</button>
```

I find it much easier to document these enhancement classes sticking to the server-render HTML, leaving how it behaves during template instantiation as a more advanced topic once the concepts are understood.

The scope of this proposal is not to endorse the particular settings this enhancement class expects, but the idea is that the transform specifies a css-like way of saying to pass the value of the count maintained in the enhancing class to the span element.  Other syntaxes could be used.

The problem with using this inline binding in our template, which we might want to repeat hundreds or thousands of times in the document, is that each time we clone the template, we would be copying that attribute along with it, and we would need to parse the values.

What this proposal is calling for is moving out those settings to a JSON structure that can be associated with the transform: 

```JSON
{
    "enhance": {
        "button": {
            "with": "be-counted",
            "having":{
                "transform": {
                    "span": "value"
                }
            }
        }
    }
}
```

We'll refer to the structure above as the "template instantiation enhancement mapping" [TIEM], name subject to change.

This proposal is **not** advocating always limiting the TIEM structure to JSON (serializable) structures.  For declarative web components, that would be the preference, or even the requirement, but we could also use the same structure with non-JSON serializable entities as well, when conditions warrant.

What the template instantiation process would do with this mapping, as it takes into account the TIEM structure is:

1.  Use CSS queries to find all matching elements within the template clone ("button") in this case.
2.  For each such button element it finds ("oButton"), carefully pass in the associated settings, with the help of template parts (if applicable?):

```JavaScript
async function(tiem, oButton){
    const {enhancements} = oButton;
    if(enhancements.BeCounted === undefined) {
        enhancements.BeCounted = {};
    }
    Object.assign(enhancements.BeCounted, {transform: {span: 'value'}});
    const def = await customEnhancements.whenDefined('be-counted');
    const beCounted = new def();
    const proxy = //do some code to create a proxy around oButton;
    beCounted.attachCallback(proxy, oButton, tiem);
}
```

where tiem is the parsed (if applicable) RHS expression keyed from "button": 

```JSON
{
    "transform": {
        "span": "value"
    }
}
```


(More details to follow).