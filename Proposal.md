# Custom Enhancements Proposal

## Author(s)

Bruce B. Anderson

## Last update

4/21/2023

## Backdrop

The webkit team has raised a number of valid concerns about extending built-in elements.  I think one of the most compelling is the concern that, since the class extension is linked to the top level of the component, it will be natural for the developer to add properties and methods directly to that component.  Private properties and methods probably are of no concern.  It's the public ones which are.  Why? 

Because that could limit the ability for the platform to add properties without a high probability of breaking some component extensions in userland, thus significantly constraining their ability to allow the platform to evolve.  The same would apply to extending third party custom elements.  

Now why would a developer want to add public properties and methods onto a built-in element?  For the simple reason that the developer expects external components to find it beneficial to pass values to these properties, or call the methods.  I doubt the WebKit team would have raised this issue, unless they were quite sure there would be a demand for doing just that, and I believe they were right.

So for these reasons, the customized-built standard has essentially been blocked.

And yet the need to be able to enhance existing elements in cross-cutting ways has been demonstrated by countless frameworks, [old](https://jqueryui.com/about/) and [new](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/).  As the latter link indicates, there are great synergies that can be achieved between the client and the server with these declarative blocks of settings.

A close examination of these solutions usually indicates that the problem WebKit is concerned about is only percolating under the surface, pushed (or remaining) underground by a lack of an alternative solution.  One finds plenty of custom objects attached to the element being enhanced.  Just to take one example:  "_x_dataStack".  Clearly, they don't want to "break the web" with this naming convention, but combine two such libraries together, and chances arise of a conflict.  And such naming conventions don't lend themselves to a very attractive api when being passed values from externally (such as via a framework).

## Custom Property Name-spacing

So, for an alternative to custom built-in extensions to be worthwhile, I strongly believe the alternative solution must first and foremost:

1.  Provide an avenue for developers to be able to safely add properties to their class without trampling on other developer's classes, or the platform's, and 
2.  Just as critically, make those properties and methods public in a way that is (almost) as easy to access as the top level properties and methods themselves.

So the bottom-line is that the crux of this proposal is to allow developers to do this (with a little tender loving care):

```JavaScript
oInput.enhancements.myEnhancement.foo = bar;
oCustomElement.enhancements.yourEnhancement.bar = foo;
```

in a way that is recognized by the platform.

The most minimal solution, then, is for the web platform to simply announce that no built-in element will ever use a property with name "enhancements", push the message to web component developers not to use that name, that it is a reserved property, similar to dataset,  only to be used by third-party enhancement libraries.  Of course, the final name would need to be agreed to.  This is just my suggestion.  Some analysis would be needed to make sure that isn't already in heavy use by any web component library in common usage.

I think that would be a great start.  But the rest of this proposal outlines some ways the platform could assist third parties in implementing their enhancements in a more orderly fashion, so they can work together, and with the platform, in harmony.

## Custom Attribute + Custom Property => Custom Enhancement

The first thing beyond that announcement would be what many (including myself) are clamoring for:

The platform informs web component developers to not use any attributes with a matching prefix to the gateway name, "enhancements", that that prefix is only to be used by third parties to match up with the sub-property of "enhancements" they claim ownership of.  My suggestion is enh-*.  The restriction to prefix custom attributes with enh- would only be required when adorning third-party custom elements:

So if server-rendered HTML looks as follows:

```html
<input my-enhancement='{"foo": "bar"}'>
<my-custom-element enh-your-enhancement='{"bar": "foo"}'>
```

... we can expect (after dependencies have loaded) to see a class instance associated with that attribute, accessible via oInput.enhancements.myEnhancement and oCustomElement.enhancements.yourEnhancement.

The requirement for the prefix can be dropped only if built-in elements are targeted, in which case the only requirement is that the attribute contain a dash.

Unlike custom elements, which have the luxury of creating a one-to-one mapping between properties and attributes, with these custom enhancements, the developer will need to "pile in" all the properties into one attribute.  Typically, this means the attributes can get quite long in comparison, as the example suggests.  These custom attributes would not be required to use JSON, that is up to each custom attribute vendor to decide.

I would expect (and encourage) that once this handshake is established, the way developers will want to update properties of the enhancement is not via replacing the attribute, but via the namespaced properties.  This is already the case for custom elements (top level), and the argument applies even more strongly for custom enhancements, because it would be quite wasteful to have to re-parse the entire string each time, especially if a list of object needs to be passed, not to mention the frequent usage of JSON.stringify or eval(), and also quite critically the limitations of what can be passed via strings.   

Another aspect of this proposal that I think should be considered is that as the template instantiation proposal gels, looking for opportunities for these enhancements to play a role in the template instantiation process, as many of the most popular such libraries do provide similar binding support as template instantiation.  Basically, look for opportunities to make custom element enhancements serve the dual purpose of making template instantiation extendable, especially if that adds even a small benefit to performance.

## A note about naming

I started this journey placing great emphasis on the HTML attribute aspect of this, but as the concepts have marinated over time, I think it is a mistake to over emphasize that aspect.  The fundamental thing we are trying to do is to enhance existing elements, not attach strings to them.  

When we enhance existing elements during template instantiation, the attributes (can) go away, in order to optimize performance.  It is much faster to pass data through a common gateway property, not through attributes.  For similar reasons, when one big enhancement needs to cobble smaller enhancements together, again, the best gateway is not through attributes, which again would be inefficient, and would result in big-time cluttering of the DOM, but rather through the same common property gateway through which all these enhancements would be linked. 

### Why "enhancements", and not "behaviors"?

Granted, the majority of enhancements would likely fit our common idea of what constitutes a "behavior".

But enhancements could also include specifying some common theme onto a white label web component, and contorting the language to make those sound like behaviors doesn't sound right:  "Be Picasso blue-period looking" for example.

Some could be adding a copyright symbol to a text.  Does be-copyright-symboled feel right?

So "enhancements" seems to cover all bases.

Others prefer "behaviors", I'm open to both.

Choosing the right name seems important, as it ought to align somewhat with the reserved sub-property of the element, as well as the reserved prefix for attributes (think data- / dataset).

## Highlights of this proposal:

1.  Adds a similar property as dataset to all Elements, called "enhancements", off of which template instantiation can pass properties needed by the enhancement class instance (even if the enhancement hasn't loaded yet) -- lazy property setting, in other words.  
2.  Sub-properties of the enhancements can be reserved for only one specific class prototype, based on the customEnhancements.define method.  It prevents others from using the same path with an instance of a different class.  
3.  Can be used during template instantiation to attach behaviors (and other aspects) to built-in and custom elements (no attributes required, as that would be inefficient -- some other way of providing a mapping is suggested below).
4.  Instantiates an instance of the class and attaches it to the reserved sub-property of enhancements, when the DOM encounters enh- attributes with matching dash-delimited name.
5.  Classes extend ElementEnhancement class, which extends EventTarget.
5.  These classes will want to define a callback, "attachedCallback". The call back will pass in the matching  target element, as well as the scoped registry name associated with the class for the Shadow DOM  realm, and initial values that were already sent to it, in absentia, via the "enhancements" property gateway.  This callback can be invoked during template instantiation, or can progressively upgrade from server-rendered HTML with the matching attribute.
8.  AttributeChangedCallback method with two parameters (oldValue, newValue) is supported in addition. 

## Use of enh-* prefix for server-rendered progressive enhancement should be required

The reason the prefix enh-* should be required is this:

1.  If enh-* is only encouraged the way data-* is encouraged, at least we could still count on custom element authors likely avoiding that prefix when defining their custom attributes associated with their element, to avoid confusion, making the "ownership" clear.
2.  But should a custom enhancement author choose a name that happens to coincide with one of the attribute names of another author's custom element, (which seems quite likely to happen frequently) it still leaves the messy situation that the custom element's attribute gets improperly flagged as an enhancement.

Most (all?) of the customElements methods would have a corresponding method in customEnhancements:

1.  customEnhancements.define
2.  customEnhancements.whenDefined
3.  customEnhancements.upgrade

The same solution for scoped registries is applied to these methods.

Because of the requirement that attributes start with enh-*, dashes are not required when using customEnhancements.define.

Let's take a close look at what the define method should look like:

```JavaScript
customEnhancements.define('with-steel', WithSteel, {enhances: '*'});
```

Going backwards, the third parameter is indicating to match on all element tag names (the default).  The CSS query for this define is '[enh-with-steel]'. 

We can also filter out element types we have no intention of enhancing:

```JavaScript
customEnhancements.define('with-steel', WithSteel, {enhances: 'input,textarea'});
```

The second parameter is our class which must extend ElementEnhancement.

So what role does the first parameter fulfill?  Just as with data-my-stuff turning into oElement.dataset.myStuff, the define method above is telling the world that (within the scoped registry), oElement.enhancements.withSteel is "owned" by the class instance of WithSteel.

If some other developer attempts to "hijack" this property extension:

```JavaScript
oInput.enhancements.withSteel = new WithAluminum()
```

it will throw an error.

##  When should the class instance be created?

If the enh-* attribute is found on an element in the live tree, this would cause the platform to instantiate an instance of the corresponding class, attach it to the enhancements sub-tree, and invoke the attachedCallback method, similar to how custom elements are upgraded. 

I also argue below that it would be great if, during template instantiation supported natively by the platform, we can create a mapping, without relying on attributes that would tend to clutter (and enlarge) the template.  One key feature this would provide is a way to extend the template instantiation process -- plug-ins essentially.  Especially if this means things could be done in "one-pass".  I don't claim any expertise in this area.  If the experts find little to no performance gain from this kind of integration, perhaps it is asking too much.  Doing this in userland would be quite straightforward (on a second pass, after the built-in instantiation has completed). 

But the other benefit is being able to pass already parsed / nonJSON serializable settings directly to the enhancement via the enhancement property gateway, rather than through attributes.  The performance gains wouldn't always be huge, but every little bit helps, right?  I also argue that the same thing could benefit custom elements, knowing that that is what most libraries (such as lit) today also support. 

Another integration nicety I would like to see supported by built-in template instantiation is to be able to bind sub objects from the host to the enhancements gateway.  So that if moustache syntax is supported for example:

```html
<input value="{myHost.enhancements.yourEnhancement?.yourProp}">
```

Maybe that's already planned, which is great.


So what follows is going out into uncharted territories, discussing how this proposal might integrate into a work-in-progress spec that hasn't been fully fleshed out.


##  Mapping elements contained in the template to enhancement classes during template instantiation.

Suppose we have a template that we want to use for repeated template instantiation:

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

Now the developer defines a class that provides the ability to keep track of how many times a button has been clicked, and that can broadcast that count to other elements near-by.  The class extends ElementEnhancement.

An example, in concept, of such a class, used in a POC for this proposal, can be [seen here](https://github.com/bahrus/be-counted), just to make the concept less abstract (the POC will not exactly follow what this proposal will outline as far as defining and registering the class), but basically, for server-rendered progressive enhancement, the **server-rendered** HTML this class expects would look as follows:

```html
<span></span>
<button >Count</button>
<template>
    <div>
        <span></span>
        <button enh-be-counted='{
            "transform": {
                "span": "value"
            }
        }'></button>
    </div>
    <section>
        <span></span>
        <button enh-be-counted='{
            "transform": {
                "span": "value"
            }
        }'></button>
    </section>
<template>
```
 

Note that the enhancement class corresponding to this attribute may specify a default count, so that the span would need to be mutated with the initial value,  either while it is being instantiated, if the custom enhancement has already been imported, or in the live DOM tree.  The decision of whether the enhancement should render-block is, when relevant, is up to the developer.  If the developer chooses to import the enhancing class synchronously, before invoking the template instantiation, then it will render block, but will be already set when it is added to the DOM tree.  If the developer imports the class asynchronously, then, depending on what is in cache and other things that could impact timing, the modifications could occur before or after getting appended to the live DOM tree.  Ideally before, but often it's better to let the user see something than nothing.

The problem with using this inline binding in our template, which we might want to repeat hundreds or thousands of times in the document, is that each time we clone the template, we would be copying that attribute along with it, and we would need to parse the values.

What this proposal is calling for is moving out those settings to a JSON structure that can be associated with the template instantiation: 

```JSON
[
    {
        "deepMerge": {
            "props": {
                "enhancements": {
                    "beCounted": {
                        "transform": {
                            "span": "value"
                        }
                    }
                }
            },
            "into": "button",
        }
    }

]
```

Use of the term "deepMerge" refers to algorithms like [this](https://www.npmjs.com/package/deepmerge).

We'll refer to the structure above as the "template instantiation manifest" [TIM].

So now our template is back to the original, with less bulk:

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

Less bulk means faster to clone, less strain on the eye!

The same argument (excessive string parsing) can be applied to custom elements or even built-in attributes.  But in that case, we don't need "deep merging" nearly as often.  For example:

Instead of:

```html
<template>
    <input readonly disabled validate placeholder="Please enter the city in which you were born.">
</template>
```

We can do:

```html
<template>
    <input>
</template>
```

together with our template instantiation manifest:

```JSON
[
    {
        "assign": {
            "props": {
                "readonly": true,
                "disabled": true,
                "validate": true,
                "placeholder": "Please enter the city in which you were born."
            },
            "into": "input",
        }
    }

]
```

This proposal is **not** advocating always limiting the TIM structure to JSON (serializable) structures.  For declarative web components, that would be the preference, or even the requirement, but we could also use the same structure with non-JSON serializable entities as well, when conditions warrant.

What the template instantiation process would do with this mapping, as it takes into account the TIM structure is:

1.  Use CSS queries to find all matching elements within the template clone ("button") in this case.
2.  For each such button element it finds ("oButton"), carefully pass in the associated settings via the "enhancements" gateway property, with the help of template parts (if applicable?);

```JavaScript
//internal logic in the browser, 
//this is just for illustrative purposes, 
//implementations will vary
async function enhance(with, settings, oButton){
    deepMerge(oButton, settings[with]['deepMerge']);
    Object.assign(oButton, settings[with]['assign']);
    const def = await customEnhancements.whenDefined('be-counted');
    const enhancement = new def();
    enhancement.attachCallback(proxy, oButton, with);
}
```

where settings is the parsed (if applicable) RHS expression keyed from "button": 

```JSON
{
    "transform": {
        "span": "value"
    }
}
```

## How an enhancement class indicates it has hydrated   

In many cases, multiple enhancements are so loosely coupled, they can be run in parallel.

However, suppose we want to apply three enhancements to an input element, each of which adds a button:

1.  One that opens a dialog window allowing us to specify what type of input we want it to be (number / date, etc).
2.  One that allows us to clone the input element.
3.  One that allows us to delete the input element.

If the three enhancements run in parallel, the order of the buttons will vary, which could confuse the user.

In order to avoid that, we need to schedule them in sequence.  This means that we need a common way each enhancement class instance can signify it either succeeded, or failed, either way you can proceed.  

Since EnhancementClasses extend the EventTarget, they can do so by dispatching events with name "resolved" and "rejected", respectively.

So this is another "nice-to-see" (in my eyes) integration synergy that the platform could use to promote harmonious integration between third-party enhancement libraries:  Standardizing on these event names, similar to promises, so that scheduling the upgrades can be done in a consistent manner.

The template instantiation manifest structure would need to sequence these enhancements:

```JSON
[
    {
        "deepMerge": {
            "into": "input",
            "sequenceOfMerges": [
                {
                    "enhancements": {
                        "specifyType": {
                            "hydrate": true
                        },
                        "beClonable": {
                            "hydrate": true
                        },
                        "beDeletable": {
                            "hydrate": true
                        }
                    }
                }
            ]
        }
    }
]
```

