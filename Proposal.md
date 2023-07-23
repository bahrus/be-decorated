# Custom Enhancements Proposal

## Author(s)

Bruce B. Anderson

## Last update

7/22/2023

## Backdrop

The WebKit team has raised a number of valid concerns about extending built-in elements.  I think one of the most compelling is the concern that, since the class extension is linked to the top level of the component, it will be natural for the developer to add properties and methods directly to that component.  Private properties and methods probably are of no concern.  It's the public ones which are.  Why? 

Because that could limit the ability for the platform to add properties without a high probability of breaking some component extensions in userland, thus significantly constraining their ability to allow the platform to evolve.  The same would apply to extending third party custom elements.  

Now why would a developer want to add public properties and methods onto a built-in element?  For the simple reason that the developer expects external components to find it beneficial to pass values to these properties, or call the methods.  I doubt the WebKit team would have raised this issue, unless they were quite sure there would be a demand for doing just that, and I believe they were right.

So for this reason (and others), the customized built-in standard has essentially been blocked.

And yet the need to be able to enhance [existing](https://aurelia.io/docs/templating/custom-attributes#simple-custom-attribute) [elements](https://dojotoolkit.org/reference-guide/1.10/quickstart/writingWidgets.html) [in](https://docs.angularjs.org/guide/directive) [cross-cutting](https://svelte.dev/docs#template-syntax-element-directives) [ways](https://mavo.io/docs/plugins) [has](https://knockoutjs.com/documentation/custom-bindings.html) [been](https://medium.com/@_edhuang/add-a-custom-attribute-to-an-ember-component-81f485f8d997) [demonstrated](https://alpinejs.dev/) [by](https://github.com/bahrus?tab=repositories&q=be-&type=&language=&sort=) [countless](https://htmx.org/docs/) [frameworks](https://vuejs.org/v2/guide/custom-directive.html), [old](https://jqueryui.com/about/) [and](https://riot.js.org/documentation/#html-elements-as-components) [new](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/).  As the latter link indicates, there are great synergies that can be achieved between the client and the server with these declarative blocks of settings.  And making such solutions work across frameworks would be as profound as custom elements themselves.  The only alternative, working with nested custom elements, is [deeply](https://sitebulb.com/hints/performance/avoid-excessive-dom-depth/) [problematic](https://opensource.com/article/19/12/zen-python-flat-sparse#:~:text=If%20the%20Zen%20was%20designed%20to%20be%20a,obvious%20than%20in%20Python%27s%20strong%20insistence%20on%20indentation.).

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

The most minimal solution, then, is for the web platform to simply announce that no built-in element will ever use a property with name "enhancements", push the message to web component developers not to use that name, that it is a reserved property, similar to dataset,  only to be used by third-party enhancement libraries.  Of course, the final name would need to be agreed to.  This is just my suggestion.  Some analysis would be needed to make sure that "enhancements" isn't already in heavy use by any web component library in common usage.

I think that would be a great start.  But the rest of this proposal outlines some ways the platform could assist third parties in implementing their enhancements in a more orderly fashion, so they can work together, and with the platform, in harmony.

## Custom Attribute + Custom Property => Custom Enhancement

The first thing beyond that announcement would be what many (including myself) are clamoring for:

The platform informs web component developers to not use any attributes with a prefix that pairs up with the property gateway name, "enhancements"; that that prefix is only to be used by third parties to match up with the sub-property of "enhancements" they claim ownership of.  My suggestion is enh-*.  

So if server-rendered HTML looks as follows:

```html
<input my-enhancement='{"foo": "bar"}'>
<my-custom-element enh-your-enhancement='{"bar": "foo"}'>
```

... we can expect (after dependencies have loaded) to see a class instance associated with that attribute, accessible via oInput.enhancements.myEnhancement and oCustomElement.enhancements.yourEnhancement.

The requirement for the prefix can be dropped only if built-in elements are targeted, in which case the only requirement is that the attribute contain a dash.

Unlike custom elements, which have the luxury of creating a one-to-one mapping between properties and attributes, with these custom enhancements, the developer will need to "pile in" all the initial property values into one attribute.  Typically, this means the attributes can get quite long in comparison, as the example above suggests.  These custom attributes would not be required to use JSON, that is up to each custom enhancement vendor to decide.

I would expect (and encourage) that once this handshake is established, the way developers will want to update properties of the enhancement is not via replacing the attribute, but via the namespaced properties.  This is already the case for custom elements (top level), and the argument applies even more strongly for custom enhancements, because it would be quite wasteful to have to re-parse the entire string each time, especially if a list of objects needs to be passed in, not to mention the frequent usage of JSON.stringify or eval(), and also quite critically the limitations of what can be passed via strings.   

Another aspect of this proposal that I think should be considered is that as the template instantiation proposal gels, looking for opportunities for these enhancements to play a role in the template instantiation process. Many of the most popular such libraries do provide similar binding support as what template instantiation aims to support.  Basically, look for opportunities to make custom element enhancements serve the dual purpose of making template instantiation extendable, especially if that adds even a small benefit to performance.

## A note about naming

I started this journey placing great emphasis on the HTML attribute aspect of this, but as the concepts have marinated over time, I think it is a mistake to over emphasize that aspect.  The fundamental thing we are trying to do is to enhance existing elements, not attach strings to them.  

When we enhance existing elements during template instantiation, the attributes (can) go away, in order to optimize performance.  It is much faster to pass data through a common gateway property, not through attributes.  For similar reasons, when one big enhancement needs to cobble smaller enhancements together, again, the best gateway is not through attributes, which again would be inefficient, and would result in big-time cluttering of the DOM, but rather through the same common property gateway through which all these enhancements would be linked. 

### Why "enhancements", and not "behaviors"?

Granted, the majority of enhancements would likely fit our common idea of what constitutes a ["behavior"](https://www.brainbell.com/tutors/XML/XML_Book_B/DHTML_Behaviors.htm#:~:text=DHTML%20Behaviors%20are%20lightweight%20components%20that%20extend%20the,referenced%20in%20Internet%20Explorer%205%20by%20using%20styles.).

But enhancements could also include specifying some common theme onto a white label web component, and contorting the language to make those sound like behaviors doesn't sound right:  "Be Picasso blue-period looking" for example.

Some could be adding a copyright symbol to a text.  Does be-copyright-symboled feel right?

Many are adding binding support to elements, which may or not resonate with developers as being a "behavior".

So "enhancements" seems to cover all bases.

Others prefer "behaviors", I'm open to both.

Choosing the right name seems important, as it ought to align somewhat with the reserved sub-property of the element, as well as the reserved prefix for attributes (think data- / dataset).

## Highlights of this proposal:

1.  Adds a similar property as dataset to all Elements, called "enhancements", off of which template instantiation can pass properties needed by the enhancement class instance (even if the enhancement hasn't loaded yet -- lazy property setting, in other words).  
2.  Sub-properties of the enhancements property can be reserved for only one specific class prototype, based on the customEnhancements.define method.  It prevents others from using the same path with an instance of a different class.  
3.  Can be used during template instantiation to attach behaviors (and other aspects) to built-in and custom elements (no attributes required, as that would be inefficient -- some other way of providing a mapping is suggested below).
4.  Instantiates an instance of the class and attaches it to the reserved sub-property of enhancements, when the live DOM tree encounters enh- attributes with matching dash-delimited name.
5.  Classes extend ElementEnhancement class, which extends EventTarget.
6.  These classes will want to define a callback, "attachedCallback". The callback will pass in the matching target element, as well as the scoped registry name associated with the class for the Shadow DOM  realm, and initial values that were already sent to it, in absentia, via the "enhancements" property gateway.  This callback can be invoked during template instantiation, or can progressively upgrade from server-rendered HTML with the matching attribute.
7.  AttributeChangedCallback method with two parameters (oldValue, newValue) is supported in addition. 

## Use of enh-* prefix for server-rendered progressive enhancement of custom elements should be required

The reason the prefix enh-* should be required is this:

1.  If enh-* is only encouraged the way data-* is encouraged, at least we could still count on custom element authors likely avoiding that prefix when defining their custom attributes associated with their element, to avoid confusion, making the "ownership" clear.
2.  But should a custom enhancement author choose a name that happens to coincide with one of the attribute names of another author's custom element, (which seems quite likely to happen frequently) it still leaves the messy situation that the custom element's attribute gets improperly flagged as an enhancement.

## Global api's.

All of the customElements methods would have a corresponding method in customEnhancements:

1.  customEnhancements.define
2.  customEnhancements.whenDefined
3.  customEnhancements.upgrade

The same solution for scoped registries is applied to these methods.

Let's take a close look at what the define method should look like:

```JavaScript
customEnhancements.define('with-steel', WithSteel, {enhances: '*'});
```

Going backwards, the third parameter is indicating to match on all element tag names (the default).  The CSS query for this define is '[with-steel],[enh-with-steel]'. 

If matching elements are found, for built-in elements the attribute could be either with-steel or enh-with-steel.  For custom elements, only enh-with-steel would work.

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

## Methods of the enhancements property

Unlike dataset, the enhancements property, added to the Element prototype, would have several methods available, making it easy for developers / frameworks to reference and even attach enhancements (without the need for attributes), for example during template instantiation (or later).

```JavaScript
const enhancementInstance = await oElement.enhancements.whenDefined('with-steel');
const enhancementInstance = await oElement.enhancements.whenResolved('with-steel');
```

Both of these methods will see if the enhancement has already been attached, and if so, pass that back.  If not, the method will cause an instance of the class WithSteel to be instantiated, then call attachedCallback and attributeChangedCallback (if applicable) in the same order as is done with custom elements, before returning the instance.

The whenResolved promise is returned after the developer sets:

```JavaScript
this.resolved = true;
```

The base class of these enhancements, ElementEnhancement, then, contains a reserved property, resolved:

```JavaScript
class ElementEnhancement extends EventTarget {
    #resolved = undefined;
    get resolved(){
        return this.#resolved;
    }
    set resolved(newValue){
        this.#resolved = newValue;
        if(newValue){
            this.dispatchEvent(new Event('resolved'));
        }else{
            this.dispatchEvent(new Event('rejected'));
        }
    }

}
```

The purpose of having this "whenResolved" feature is explained towards the end of this proposal.
 
## A helper property to make setting properties easier.

In addition to the two methods above, the enhancements property would contain a property which returns a proxy, which can then dynamically return an instance of the enhancement, if the enhancement has already attached.  If it hasn't attached yet, it will return either an empty object, or whatever value has been placed there previously.

This would allow consumers of the enhancement to pass property values (and only property values) ahead of the upgrade (or after the upgrade), so that no "await" is necessary:

```JavaScript
oElement.enhancements.setPropsFor.withSteel.carbonPercent = 0.2;
```

These value settings would either get applied directly to oElement.enhancements.withSteel if has already been attached.  Or, if it hasn't been attached yet, the browser would set (or merge) the value into the property:

```JavaScript
if(oElement.enhancements.withSteel === undefined) oElement.enhancements.withSteel = {};
oElement.enhancements.withSteel.carbonPercent = 0.2;
```

The object would sit there ready to be absorbed into the enhancement during the attachedCallback handshake.

##  When should the class instance be created by the platform?

If the enh-* attribute is found on an element in the live DOM tree, this would cause the platform to instantiate an instance of the corresponding class, attach it to the enhancements sub property, and invoke the attachedCallback method, similar to how custom elements are upgraded.

I also argue below that it would be great if, during template instantiation supported natively by the platform, the platform can do whatever helps in achieving the most efficient outcome as far as recognizing these custom attributes.  One key feature this would provide is a way to extend the template instantiation process -- plug-ins essentially.  Especially if this means things could be done in "one-pass".  I don't claim any expertise in this area.  If the experts find little to no performance gain from this kind of integration, perhaps it is asking too much.  Doing this in userland would be quite straightforward (on a second pass, after the built-in instantiation has completed). 


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
        <button be-counted='{
            "transform": {
                "span": "value"
            }
        }'></button>
    </div>
    <section>
        <span></span>
        <button be-counted='{
            "transform": {
                "span": "value"
            }
        }'></button>
    </section>
<template>
```
 

Note that the enhancement class corresponding to this attribute may specify a default count, so that the span would need to be mutated with the initial value,  either while it is being instantiated, if the custom enhancement has already been imported, or in the live DOM tree.  The decision of whether the enhancement should render-block is, when relevant, up to the developer.  If the developer chooses to import the enhancing class synchronously, before invoking the template instantiation, then it will render block, but will be already set when it is added to the DOM tree.  If the developer imports the class asynchronously, then, depending on what is in cache and other things that could impact timing, the modifications could occur before or after getting appended to the live DOM tree.  Ideally before, but often it's better to let the user see something than nothing.

The problem with using this inline binding in our template, which we might want to repeat hundreds or thousands of times in the document, is that each time we clone the template, we would be copying that attribute along with it, and we would need to parse the values.

So I have two possible suggestions for addressing this issue, both designed to optimize this situation (however, I'm speculating a bit what would be effective here, as I say, I'm not an expert in this field):

## Solution 1 (probably not the right solution)

<details>
    <summary>Since this probably isn't the right solution, hiding it, just in case it helps anyone.</summary>

We move out those settings to a JSON-like structure that can be associated with the template instantiation: 

```JSON
[
    {
        "make": {
            "button": [
                {
                    "beEnhancedBy": "be-counted",
                    "having": {
                        "transform": {
                            "span": "value"
                        }
                    }
                }
            ]
        }
    }

]
```


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

But again, I'm not an expert on performance.  I'm not certain this would produce performance benefits.  While the template might be smaller, the performance benefits from the smaller template might be more than offset by the cost of locating the "part" to apply the settings to.

So the rest of this discussion goes out on a limb and assumes there is a performance benefit, just in case.

The same argument (excessive string parsing) can be (more weakly) applied to custom elements or even built-in attributes. For example:

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
        "make": {
            "input": [
                {
                    "beAssigned": {
                        "disabled": true,
                        "validate": true,
                        "placeholder": "Please enter the city in which you were born."
                    }
                }
            ]
        }
    }

]
```

The chances that this improves performance is probably even lower than for JSON based attributes, but just wanted to suggest investigating the possibility.

This proposal is **not** advocating always limiting the TIM structure to JSON (serializable) structures.  For declarative web components, that would be the preference, or even the requirement, but we could also use the same structure with non-JSON serializable entities as well, when conditions warrant.

What the template instantiation process would do with this mapping, as it takes into account the TIM structure is:

1.  Use CSS queries to find all matching elements within the template clone ("button") in this case.
2.  For each such button element it finds ("oButton"), carefully pass in the associated settings via the "enhancements" gateway property, with the help of template parts, if applicable.

## How exactly would this attribute extraction be orchestrated for custom enhancements?

Going back to the custom enhancement attributes...

From my experience, the **ideal** approach, from a developer experience point of view, is if the built-in template instantiation could intelligently decide, when it encounters these custom enhancement attributes, to  quietly pull out the inline attributes and form this TIM object in memory, leaving the developer oblivious to this whole issue.

In the example I gave, I had two buttons with identical attributes, which seems like a rare thing to happen in a template, so automating the detection of identical attributes, and formulating the most optimal css query to apply the settings to, seems like a lot of work with little benefit.

It's possible that extracting out the attribute only results in savings if it is of a certain size.

And here's the rub -- we can't, I don't think, insist that every custom enhancement vendor use JSON attributes.  The best thing I can suggest (and it is a bit iffy) is to assume that if the attribute is of the form [...] or {} then *try* doing a JSON.parse.  If one of those tests fails, just leave the attribute in place, and let the vendor cache as necessary.

...which takes us to

</details>

## Solution 2 (closer to the right solution?):

What I described in Solution 1 seemed too difficult to me, when I got down to implementing it in my POC.  What I implemented instead, still assumes that there's a benefit in eliminating all the attributes from the final DOM (the more attributes, the bulkier the clone, the larger the memory footprint of the DOM, the more work css querying has to do, etc).

So what I did, essentially, was this:

As a custom enhancement vendor, I took the time to implement, with custom element enhancements I anticipated would be used thousands of times on a page, an internal, bespoke way of caching attributes globally, so that if a template repeats thousands of times, if I'm passed in the same attribute, I look for the the parsed object from my cache, and if not found, do the parse, and cache it (basically, memoization).  So this could be a pattern we recommend as a best practice way of optimizing performance when it seems warranted.

As far as the help the platform's template instantiation would provide:

Say our template looks as follows:

```html
<template>
    <div enhancement-1=clob1 enhancement-2=clob2 enhancement-3=clob3 etc></div>
</template>
```

This is only done for custom attributes that have already been registered.

We turn that template into something like this, using a temporary, internal attribute, say "enhancements":

```html
<template>
     <div enhancements=ff3a5f86-7136-4d63-a959-60433a71e16d></div>
</template>
```

(I think it's better to use a global counter, not a guid, because it's smaller,  but using a guid for clarity)

... and we maintain a lookup from that guid to the cached attributes for that element.

Then when we instantiate the template, we search globally for all "enhancements" attributes, do a look up for what the original attributes were, and instantiate the enhancement class instances.

Solution 2, option a:

Invoke the attribute changed callback on each of them, exactly as if that original attribute that the developer specified was there on the element, even though it isn't, really. 

Solution 2, option b:

Now should we really call "attributeChangedCallback" when there isn't really such an attribute on the element?  Would that not confuse the developer?

Instead of "attributeChangedCallback", I think it would be better to pass that in to the attachedCallback as an additional parameter for this scenario.

Either way, we remove the "enhancements" attribute so what we end up with is a clean div in the live DOM tree:

```html
<html>
    ...
    <body>
        ...
        <div></div>
    </body>
</html>
```

with all the enhancements enhancing away on the div.

Now with all of these solutions, some custom enhancement vendors might complain, saying "hey, I need that attribute to stay on the element, why are you doing that?" so maybe it should be something that is configurable per enhancement?  Perhaps they want to use this attribute in their styling, for example.

That is one of the reasons that I proposed above that we only apply this optimization for enhancements that have already been registered.  Since it's already been registered, the vendor could specify the rule in a config static property of the class:

```JavaScript
class WithSteel extends ElementEnhancement {
    static get config {
        leaveAttr: true
    }
}
```

The other reason for only doing it only for registered enhancements, is it means no guesswork is involved in determining which attributes are meant to be enhancements.

I suspect this "config" static property will grow to have other settings, especially as it integrates with template instantiation binding.

## AttachedCallback signature

I propose the attached callback signature look as follows:

```TypeScript
interface ElementEnhancement{
    ...
    attachedCallback(enhancedElement: Element, enhancementInfo: EnhancementInfo);
    ...
}

interface EnhancementInfo {
    enh: string; //with-steel
    enhancement: string; //withSteel
    data: any; //{ carbonPercent = 0.2}
    templateAttr: string;
}

```

The data property of EnhancementInfo would be the object that had been passed in to oElement.enhancements.withSteel placeholder prior to the enhancement getting attached.

The templateAttr would be the original attribute string that was removed from the template, following Solution 2 above.  This would be undefined for server rendered HTML (and would instead be passed during the attributeChangedCallback).


## How an enhancement class indicates it has hydrated 

Earlier in this document, I mentioned a feature built in to the base class, that indicates a state of "resolved".  Here's the explanation for one use case:

In many cases, multiple enhancements are so loosely coupled, they can be run in parallel.

However, suppose we want to apply three enhancements to an input element, each of which adds a button:

1.  One that opens a dialog window allowing us to specify what type of input we want it to be (number / date, etc).
2.  One that allows us to clone the input element.
3.  One that allows us to delete the input element.

If the three enhancements run in parallel, the order of the buttons will vary, which could confuse the user.

In order to avoid that, we need to schedule them in sequence.  This means that we need a common way each enhancement class instance can signify it either succeeded, or failed, either way you can proceed.  That is why we should have this ability to specify whether the hydration has completed. 

I have a heavy suspicion that as the platform builds out template instantiation and (hopefully) includes something close to this solution as far as plug-in's, there will arise other reasons to support this feature.

But for now, the way this feature can be used is with a bespoke custom enhancement, such as [be-promising](https://github.com/bahrus/be-promising#be-promising).

## Open Questions

Should any formal support be provided for dispatching namespaced events from the element being enhanced?

