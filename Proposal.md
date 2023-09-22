
## Author(s)

Bruce B. Anderson

PR's [welcome](https://github.com/bahrus/be-decorated/blob/baseline/Proposal.md)

## Last update

9/21/2023

This is [one](https://github.com/whatwg/html/issues/2271) [of](https://eisenbergeffect.medium.com/2023-state-of-web-components-c8feb21d4f16) [a](https://github.com/WICG/webcomponents/issues/1029) [number](https://github.com/WICG/webcomponents/issues/727) of interesting proposals, one of which (or some combination?) can hopefully get buy-in from all three browser vendors.  This proposal borrows heavily from the others.

This proposal just continues to be my view of the **best** approach, and I don't think [I'm alone](https://github.com/WICG/webcomponents/issues/1029#issuecomment-1728875331), at least in the big things. 

## Custom Attributes For [Simple Enhancements](https://www.w3.org/TR/design-principles/#simplicity)

Say all you need to do is to create an isolated behavior/enhancement/hook/whatever associated with an attribute, say "log-to-console" anytime the user clicks on elements adorned with that attribute, where we can specify the message.  Here's how that would be done with this proposal.  It could be done more simply, with hard coded values, and without the commentary noise, so please allow for that when weighing the complexity. 

```JS
//canonical name of our "custom prop", accessible via oElement.enhancements[enhancement], 
//which is where we will find an instance of the class defined below.
export const canonicalEnhancementName = 'logger'; 
//canonical name(s) of our custom attribute(s)
export const canonicalObservedAttributes = ['log-to-console']; 
customEnhancements.define(canonicalEnhancementName, class extends ElementEnhancement {
    attachedCallback(enhancedElement: Element, enhancementInfo: EnhancementInfo){
        const {observedAttributes, enhancement} = enhancementInfo;
        const [msgAttr] = observedAttributes; 
        // most likely, msgAttr will equal 'log-to-console', 
        // but the party (or parties) responsible for registering the enhancement 
        // could choose to modify the name, either globally, or inside a scoped registry.
        enhancedElement.addEventListener('click', e => {
            console.log(enhancedElement.getAttribute(msgAttr)); 
        });
    }
}, {
    observedAttributes: canonicalObservedAttributes
});
```

```HTML
<svg log-to-console="clicked on an svg"></svg>
    ...
<div log-to-console="clicked on a div"></div>

...

<some-custom-element enh-log-to-console="clicked on some custom element"></some-custom-element>
```

Done!

Why attachedCallback and not connectedCallback?  Advantages of connectedCallback is it perfectly aligns with the terminology used for custom elements, and clearly the custom enhancement class above closely resembles a custom element. I could go with that.  It wouldn't break the essence of this proposal in any way.  I *think*, though it would cause less confusion to use attachedCallback (it feels to me more like attaching shadow, for example).  But I think that decision should be of little consequence, so please replace it with whatever name you like.

Why ElementEnhancement and not CustomAttribute? This proposal **does** "break" if we change it to that name, and the good news is there are some viable interesting proposals, linked above, which take that approach.  I think this naming convention, which may take a little bit of getting used to, based on current parlance, aligns much better with the ultimate goal of this proposal.  This proposal sees custom attributes as a means to an end, just as "custom tag name" is a means to a more abstract end:  A custom (HTML) Element. 

Also, a single element enhancement can "own" multiple attributes (for complex enhancements).

Why not use a static observedAttributes property, why is that part of the registration function?  I thought it should be a static property, out of habit, but then finally realized (hopefully correctly) that in this case, we want consumers of the package to be able to override the default canonical names, as part of the scoped element registry solution, and even as part of the desire to make the class be "side effect" free.  The role these attributes is playing is much more similar to the name of a custom element, which is exclusively registered in the define function, so I now strongly believe, the same must be done for these "custom attributes" associated with the enhancement.  But because we are talking about an array of strings that can be renamed, we need to think of that array as a tuple of strings.

The bottom line is I don't think the slight differences with custom elements make this proposal any more complex than defining a custom element.

The only cautionary note I have is that because of the complete flexibility this proposal provides as far as allowing users of a custom enhancement to choose their own custom attribute names, that may differ from the canonical names defined in the class, the developer will probably want to be a bit cautious when declaring a public attribute that the enhancement supports, kind of like defining columns of a database table.  Like the database table example, adding additional attributes will be easy as pie.  Removing an attribute, though, could break compatibility.  So maybe when introducing a new attribute, give it some time to mature, test it out with your own stuff first, and once you are convinced the need for the attribute is here to stay, only then release the new version that supports the new attribute.

This cautionary note is only applicable for enhancements you wish to make public and have it be widely used.
 

> [!NOTE]
> I agree 100% with others that these proposals must wait on scoped registry being fully settled.  In the above example, we have two strings that we need to protect from colliding with other enhancements (and with attributes of the elements themselves):  The name of the enhancement - "logger" - and the attribute(s) tied to it, if any:  'log-to-console'.  Both will need to be considered as far as best ways of managing these within each Shadow scope.  It may be that the easiest solution will require some sort of pattern between the name of the enhancement and the attributes associated with that name (for example, insisting that the name of the enhancement matches the beginning of the camelCased strings of all the "owned" attributes).  This proposal, for now, opts to allow the developer to name them in the way that makes most sense to the author, with the hope that this can survive scrutiny when considering scoped registries and concerns about name-spacing.


## ElementEnhancement API Shape

```JS
const canonicalObservedAttributes: [string, string, ..., string] = [/* ... */]
class MyEnhancement extends ElementEnhancement {

    static config = {/* ... */} //or use a get

    //or connectedCallback if that is clearer
	attachedCallback(enhancedElement: Element, enhancementInfo:  EnhancementInfo) { /* ... */ } 

    //or disconnectedCallback if that is clearer.
	detachedCallback(enhancedElement: Element, enhancementInfo:  EnhancementInfo) { /* ... */ } 

	// Called whenever the attribute's value changes
	attributeChangedCallback(idx: number, oldValue: string, newValue: string) { 
        const canonicalAttrName = canonicalObservedAttributes[idx];
    }

    //  Entirely optional filtering conditions for when the enhancement should be invoked.
    static get supportedInstanceTypes(){ //entirely optional
        return [HTMLInputElement, 
                HTMLTextArea, 
                SomeAlreadyLoadedCustomElementClass, 
                SVGElement,
                HTMLMarqueeElement]; //For example
    }

    //Entirely optional
    static get supportedCSSMatches() { 
        return 'textarea, input';
    }

}
```

Having filtering support is there to benefit the developer first and foremost -- the developer is essentially publishing a "contract" of what kinds of elements they can support.  The idea for using supportedInstanceTypes, proposed [here](https://github.com/WICG/webcomponents/issues/1029) seems like it has some quite positive benefits:

1.  I think it could help avoid some timing issues of attempting to start enhancing an unknown element, by essentially enforcing a loading sequence of dependencies. 
2.  In some cases, especially with custom elements, it could group a bunch of custom elements together based on the base class.  CSS currently isn't so good at selecting elements based on a common prefix.
3.  The names can be validated by TypeScript.

Another key reason for adding this filtering capability is performance -- there is a cost to instantiating an enhancement class, adding it to the enhancements gateway, invoking the callback, and holding on to the class instance in memory so anything we can do to declaratively prevent that seems like a win for all involved.

<details>
    <summary>But at what cost?</summary>

Now, a well designed build process of a closed system web application would theoretically make validations from the platform redundant -- it would generate compile-time errors when it encounters tags that are adorned with an enhancement, when that enhancement has declared such tags as off-limits.  Meaning in such a closed, deterministic system, the extra checks that the platform would apply before initiating the run-time handshake would be redundant, and thus wasteful.  I guess I'll leave that conundrum as our first open question of the proposal, which doesn't strike me as very significant, but you never know.

</details>

###  What, if any, are the benefits of having a "has" attribute?

<details>
    <summary>None, as far as I can see</summary>

From a "developer advocacy" point of view, as the simple example I opened with demonstrates, there doesn't seem to be any benefit to having an extra "has" attribute -- that would just be clumsy and provide more opportunities for conflicts between different teams of developers.

I amended this proposal, though, to support multiple attributes for a single enhancement, in order to accommodate, as best I can, the [apparent appeal, which I can definitely relate to](https://github.com/WICG/webcomponents/issues/1029#issuecomment-1719996635) that the "has" attribute seemingly provides, kind of a way of grouping related attributes together.  I actually do believe there are very strong use cases where we *do* want one enhancement to be able to break down the "aspects" of the enhancement/behavior into multiple attributes.  Benefits are:

1.  The values can be simple strings / numbers / boolean, vs JSON.  
2.  Some frameworks may prefer to modify state via attributes instead of properties.

However, I think by supporting multiple attributes, requiring that they have dashes, and knowing that developers will go out of their way to avoid clashing with other libraries, we can achieve the same effect without telling the entire IT industry that their way of doing things is wrong.  **Almost no one is using a "has" attribute, so we should, I think, bend over backwards to not impose a new requirement in order to utilize the platform, without an extremely strong reason**.  So with this proposal, we can have attributes that naturally group together.  To take one very practical example where this makes sense:  Suppose we want to provide a userland implementation of [this proposal](https://github.com/whatwg/html/issues/2404).  We could define it like this, which this proposal supports:

```html
<time lang="ar-EG" 
    datetime=2011-11-18T14:54:39.929Z 
    be-intl-weekday=long be-intl-year=numeric be-intl-month=long
    be-intl-day=numeric>
</time>
```

Or perhaps there's a desire to be even more like the has solution and provide for the base attribute as well:

```html
<time lang="ar-EG" 
    datetime=2011-11-18T14:54:39.929Z
    be-intl 
    be-intl-weekday=long be-intl-year=numeric be-intl-month=long
    be-intl-day=numeric>
</time>
```

which this proposal also supports.

So what would make much more sense to me is rather than having a "has" requirement, to instead insist that all the attributes that a single enhancement "observes" begin with the same stem (be-intl in this case), presumably tied to the package of the enhancement.  This proposal is not yet advocating *enforcing* such a rule, but I am weighing the pro's and con's of such a rule, and am much more in favor of that kind of restriction, vs, extra (seemingly unneeded) complexity that a "has" attribute requirement would introduce, that flies in the face of industry practice over several decades.

The only argument I see, honestly, in favor of the "has" requirement, would be simply to make things easier for the browser's parsing, but, again, I think that needs to be backed up by quite solid evidence and a kind of desperate last resort scenario.

</details>

### Better ergonomics for specifying the attribute format?

Since this proposal is focusing somewhat on managing attributes, it is reasonable to see if it makes sense to dovetail this proposal with some related areas for improvement. 

And for clarity, the "house words" for this proposal is "Custom Prop + 0 or more Custom Attributes => Custom Enhancement".  The custom prop refers to the name of the enhancement, which, as will be discussed below, provides the key off of the "enhancements" sub-object of the element.  But within that "custom prop" resides a rich universe of properties defined within the user defined class, and as we've seen, the api shape for that class is almost identical to custom elements.  So it makes sense also to look for better ergonomics as far as defining properties for custom enhancements, just as much as it does for custom elements.

I like the promising ideas presented [here](https://github.com/WICG/webcomponents/issues/1029) as far providing declarative support for managing properties and attributes.  Based on the reasoning above, I think it makes sense to consider such improvements to custom elements themselves, and I see no reason not to carry over such ideas to custom enhancements.  Or maybe it makes more sense to "pilot" such ideas on custom enhancements, and then apply to custom elements.  I think those ideas are 100% compatible with this proposal, and shouldn't break it in any way.  

## Backdrop

The WebKit team has raised a number of valid concerns about extending built-in elements.  I think one of the most compelling is the concern that, since the class extension is linked to the top level of the component, it will be natural for the developer to add properties and methods directly to that component.  Private properties and methods probably are of no concern.  It's the public ones which are.  Why? 

Because that could limit the ability for the platform to add properties without a high probability of breaking some component extensions in userland, thus significantly constraining their ability to allow the platform to evolve.  The same would apply to extending third party custom elements.  

Now why would a developer want to add public properties and methods onto a built-in element?  For the simple reason that the developer expects external components to find it beneficial to pass values to these properties, or call the methods.  I doubt the WebKit team would have raised this issue, unless they were quite sure there would be a demand for doing just that, and I believe they were right.

So for this reason (and others), the customized built-in standard has essentially been blocked.

And yet the need to be able to enhance [existing](https://aurelia.io/docs/templating/custom-attributes#simple-custom-attribute) [elements](https://dojotoolkit.org/reference-guide/1.10/quickstart/writingWidgets.html) [in](https://docs.angularjs.org/guide/directive) [cross-cutting](https://svelte.dev/docs#template-syntax-element-directives) [ways](https://mavo.io/docs/plugins) [has](https://knockoutjs.com/documentation/custom-bindings.html) [been](https://medium.com/@_edhuang/add-a-custom-attribute-to-an-ember-component-81f485f8d997) [demonstrated](https://alpinejs.dev/) [by](https://github.com/bahrus?tab=repositories&q=be-&type=&language=&sort=) [countless](https://htmx.org/docs/) [frameworks](https://vuejs.org/v2/guide/custom-directive.html), [old](https://jqueryui.com/about/) [and](https://riot.js.org/documentation/#html-elements-as-components) [new](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/).  As the latter link indicates, there are great synergies that can be achieved between the client and the server with these declarative blocks of settings.  And making such solutions work across frameworks would be as profound as custom elements themselves.  The only alternative, working with nested custom elements, is [deeply](https://sitebulb.com/hints/performance/avoid-excessive-dom-depth/) [problematic](https://opensource.com/article/19/12/zen-python-flat-sparse#:~:text=If%20the%20Zen%20was%20designed%20to%20be%20a,obvious%20than%20in%20Python%27s%20strong%20insistence%20on%20indentation.).  And quite critically, some built-in elements **can't** be wrapped inside a custom element without breaking functionality and proper HTML decorum.

A close examination of these solutions usually indicates that the problem WebKit is concerned about is only percolating under the surface, pushed (or remaining) underground by a lack of an alternative solution.  One finds plenty of custom objects attached to the element being enhanced.  Just to take one example:  "_x_dataStack".  

Another example:  Currently if I go to https://walmart.com and right click and inspect their tile elements, I see some "react fiber" objects attached (__reactFiber$...), full of properties like memoizedProps, refs (a function) etc.  And reactProps (__reactProps$...), also a function prototype containing properties and methods. 

Clearly, they don't want to "break the web" with these naming conventions, but combine two such libraries together, and chances arise of a conflict.  And such naming conventions don't lend themselves to a very attractive api when being passed values from externally (such as via a framework).

## Custom Property Name-spacing

So, for an alternative to custom built-in extensions to be worthwhile, I strongly believe the alternative solution must first and foremost:

1.  Provide an avenue for developers to be able to safely add properties to their class without trampling on any other developer's classes, or the platform's, and 
2.  Just as critically, make those properties and methods public in a way that is (almost) as easy to access as the top level properties and methods themselves.

So the bottom-line is that the crux of this proposal is to allow developers to do this (with a little tender loving care):

```JavaScript
oInput.enhancements.myEnhancement.foo = bar;
oMyCustomElement.enhancements.yourEnhancement.bar = foo;
```

in a way that is recognized by the platform.

The most minimal solution, then, is for the web platform to simply announce that no built-in element will ever use a property with name "enhancements", push the message to web component developers not to use that name, that it is a reserved property, similar to dataset,  only to be used by third-party enhancement libraries.  Of course, the final name would need to be agreed to.  This is just my suggestion.  Some analysis would be needed to make sure that "enhancements" isn't already in heavy use by any web component library in common usage.

I think that would be a great start.  But the rest of this proposal outlines some ways the platform could assist third parties in implementing their enhancements in a more orderly fashion, so they can work together, and with the platform, in harmony.

## CustomEnhancement:  {CustomProp: string,  CustomAttr?: [string, string..., string]}

The next thing beyond that announcement would be what many (including myself) are clamoring for:

The platform informs web component developers to not use any attributes with a prefix that pairs up with the property gateway name, "enhancements"; that that prefix is only to be used by third parties to match up with the sub-property of "enhancements" they claim ownership of.  My suggestion is enh-*.  

So if server-rendered HTML looks as follows:

```html
<input my-enhancement='{"foo": "bar"}'>
<my-custom-element enh-your-enhancement='{"bar": "foo"}'>
```

... we can expect to see a class instance associated with each of those attributes, accessible via oInput.enhancements.myEnhancement and oMyCustomElement.enhancements.yourEnhancement.  That simple relationship may not need to be rigid, or maybe it would, depending on how this proposal would integrate with scoped registries.

The requirement for the prefix can be dropped only if built-in elements are targeted, in which case the only requirement is that the attribute(s) contain (a) dash(es).  

Another aspect of this proposal that I think should be considered is that as the template instantiation proposal gels, looking for opportunities for these enhancements to play a role in the template instantiation process would be great. Many of the most popular such libraries do provide similar binding support as what template instantiation aims to support.  Basically, look for opportunities to make custom element enhancements serve the dual purpose of making template instantiation extendable, especially if that adds even a small benefit to performance.

## A note about naming

I started this journey placing great emphasis on the HTML attribute aspect of this, but as the concepts have marinated over time, I think it is a mistake to over emphasize that aspect.  The fundamental thing we are trying to do is to enhance existing elements, not attach strings to them.  

When we enhance existing elements during template instantiation, the attributes (can) go away, in order to optimize performance.  It is much faster to pass data through a common gateway property, not through attributes.  For similar reasons, when one big enhancement needs to cobble smaller enhancements together, again, the best gateway is not through attributes, which again would be inefficient, and would result in big-time cluttering of the DOM, but rather through the same common property gateway through which all these enhancements would be linked. 

### Why "enhancements", and not "behaviors"?

Granted, the majority of enhancements would likely fit our common idea of what constitutes a ["behavior"](https://www.brainbell.com/tutors/XML/XML_Book_B/DHTML_Behaviors.htm#:~:text=DHTML%20Behaviors%20are%20lightweight%20components%20that%20extend%20the,referenced%20in%20Internet%20Explorer%205%20by%20using%20styles.).

But enhancements could also include specifying some common theme onto a white label web component, and contorting the language to make those sound like behaviors doesn't sound right:  "Be Picasso blue-period looking" for example.

Some could be adding some common paragraph containing copyright text.  The dictionary defines behaviors as something associated with actions, so does that apply here?

Many are adding binding support to elements, which may or not resonate with developers as being a "behavior".

So "enhancements" seems to cover all bases.

Others prefer "behaviors", I'm open to both.

Choosing the right name seems important, as it ought to align somewhat with the reserved sub-property of the element, as well as the reserved prefix for attributes (think data- / dataset).

## Highlights of this proposal:

1.  Adds a similar property as dataset to all Elements, called "enhancements", off of which template instantiation can pass properties needed by the enhancement class instance (even if the enhancement hasn't loaded yet -- lazy property setting, in other words).  
2.  Sub-properties of the enhancements property can be reserved for only one specific class prototype, based on the customEnhancements.define method, with the scoped registry solution adopted.  It prevents others from using the same path with an instance of a different class.  
3.  Can be used during template instantiation to attach behaviors (and other aspects) to built-in and custom elements (no attributes required, as that may be inefficient -- some musings on what might be effective are outlined below).
4.  Instantiates an instance of the class and attaches it to the reserved sub-property of enhancements, when the live DOM tree encounters any of the (enh- prefixed) observed attributes specified in the class.
5.  Classes extend ElementEnhancement class, which extends EventTarget.
6.  These classes will want to define a callback, "attachedCallback" (or connectedCallback if that ruffles some feathers). The callback will pass in the matching target element, as well as the scoped registry name associated with the class for the Shadow DOM  realm, and initial values that were already sent to it, in absentia, via the "enhancements" property gateway.  This callback can be invoked during template instantiation, or can progressively upgrade from server-rendered HTML with the observed attribute(s).
7.  AttributeChangedCallback method with three parameters (index, oldValue, newValue) is supported in addition.  Yes, the first parameter is a number!

## Use of enh-* prefix for server-rendered progressive enhancement of custom elements should be required

The reason the prefix enh-* should be required is this:

1.  If enh-* is only encouraged the way data-* is encouraged, at least we could still count on custom element authors likely avoiding that prefix when defining their custom attributes associated with their element, to avoid confusion, making the "ownership" clear.
2.  But should a custom enhancement author choose a name that happens to coincide with one of the attribute names of another author's custom element, which seems quite likely to happen frequently, it still leaves the messy situation that the custom element's attribute gets improperly flagged as an enhancement.

## Global api's.

All of the customElements methods would have a corresponding method in customEnhancements:

1.  customEnhancements.define
2.  customEnhancements.whenDefined
3.  customEnhancements.upgrade

The same solution for scoped registries is applied to these methods.

Let's take a close look at what the define method should look like:

```JavaScript
customEnhancements.define('steel', SteelEnhancer, {
    enhances: '*', //the default
    observedAttributes: ['with-steel']
});
```

Going backwards, the third parameter is indicating to match on all element tag names (the default).  But the platform will only tie the knot when it encounters any of the attributes from the observedAttributes list passed into the define method (if any).  Enhancements are not required to specify any attributes, as they are not intrinsically dependent on them.  Examples of enhancements which wouldn't want to burden the browser with searching for some attribute for no reason, are enhancements that are only expecting to be invoked programmatically by other enhancements (or by custom elements or frameworks).

>[!NOTE]
>Bear in mind that if no "enhances" value is specified (the default), and if observedAttributes is also not specified, the platform will *not* automatically enhance every element.  The platform will only act when it finds a matching attribute.  But it will **allow** enhancements to be programmatically attached by the developer on all element types in that scenario.  In fact, the platform will **ignore** the observedAttributes criteria altogether when the developer programmatically attaches an enhancement, only using the "enhances" value (combined with the static values specified by the enhancement author) to prevent unauthorized enhancements. 

I recommend that the developer use a logical naming convention for all these attributes -- maybe they should all be prefixed with the name of the package, for example.  The reason for this is that I suspect, even with the power of the scoped registry, life will still be simpler that way.

We can also filter out element types we have no intention of enhancing:

```JavaScript
customEnhancements.define('withSteel', SteelEnhancer, {
    enhances: { //optional
        cssMatches: 'input,textarea',
        instanceOf: [HTMLMarqueeElement]
    },
    observedAttributes: ['with-steel']

});
```

This enhances option (combined with the static properties of the class) is a binding contract -- the platform won't allow enhancements to take place outside these conditions, if specified.  The cssMatches and instanceOf form an "or" condition (same with static class specifiers).  But an "and" condition is applied to the enhancement restrictions specified in the registration, and the enhancement restrictions specified by the class static properties (supportedInstanceTypes, supportedCSSMatches.)  I.e. both the enhancement author and the enhancement registrar (doing the registering) must opt-in. 

The second parameter is the class, which must extend ElementEnhancement.

The first parameter, gives the key off the enhancements object on the element where the enhancement should land (subject to murky scoped registry rules).  It can be a single word (subject to change as scope registry solution is integrated). 

If some other developer attempts to "hijack" this property extension:

```JavaScript
oInput.enhancements.withSteel = new AluminumEnhancer()
```

it would throw an error.

## Attachment methods of the enhancements property

Unlike dataset, the enhancements property, added to the Element prototype, would have several methods available, making it easy for developers / frameworks to reference and even attach enhancements (without the need for attributes), for example during template instantiation (or later).

```JavaScript
const enhancementInstance = await oElement.enhancements.whenAttached('withSteel');
const enhancementInstance = await oElement.enhancements.whenResolved('withSteel');
```

Both of these methods will see if the enhancement has already been attached, and if so, pass that back.  If not, the method will cause an instance of the class SteelEnhancer to be instantiated, then call attachedCallback and attributeChangedCallback (if applicable) in the same order as is done with custom elements, before returning the instance.

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
        if(newValue === true){
            this.dispatchEvent(new Event('resolved'));
        }else if(newValue === false){
            this.dispatchEvent(new Event('rejected'));
        }
    }

}
```

The whenResolved method would throw an error (catcheable via try/catch with await or .catch() if using the more traditional promise approach) when the developer sets this.resolved = false;

The purpose of having this "whenResolved" feature is explained towards the end of this proposal.
 
## A helper property to make setting properties easier.

In addition to the two methods above, the enhancements property would contain a property which returns a proxy, which can then dynamically return an instance of the enhancement, if the enhancement has already attached.  If it hasn't attached yet, it will return either an empty object, or whatever value has been placed there previously.

This would allow consumers of the enhancement to pass property values (and only property values) ahead of the upgrade (or after the upgrade), so that no "await" is necessary:

```JavaScript
oElement.enhancements.setPropsFor.withSteel.carbonPercent = 0.2;
```

These value settings would either get applied directly to oElement.enhancements.withSteel if it has already been attached.  Or, if it hasn't been attached yet, the browser would set (or merge) the value into the property, and begin attaching the enhancement in the background:

```JavaScript
if(oElement.enhancements.withSteel === undefined) {
    oElement.enhancements.withSteel = {};
    // invoke some method asynchronously in the background to attach the enhancement.
} 
oElement.enhancements.withSteel.carbonPercent = 0.2;

```

The object would sit there, ready to be absorbed into the enhancement during the attachedCallback handshake, which could happen right away if already loaded, or whenever the customEnhancements.whenDefined is resolved for this enhancement.

Due to this property, setPropsFor, being a proxy, the convenience of this approach likely comes at a cost.  Proxies do impose a bit of a performance penalty, so a framework or library that uses this feature would be well-advised to add a little bit of nuance to the code, to set properties directly to the enhancement once it is known that the enhancement has attached.  For example, use this property the first time setting a property value, and then more directly for subsequent times.  Or, alternatively, implement the identical logic described above within the library code, thus avoiding the use of this special property altogether.


##  When should the class instance be created by the platform?

If the enh-* attribute is found on an element in the live DOM tree, this would cause the platform to instantiate an instance of the corresponding class, attach it to the enhancements sub property, and invoke the attachedCallback method, similar to how custom elements are upgraded.

I also argue below that it would be great if, during template instantiation supported natively by the platform, the platform can do whatever helps in achieving the most efficient outcome as far as recognizing these custom attributes.  One key feature this would provide is a way to extend the template instantiation process -- plug-ins essentially.  Especially if this means things could be done in "one-pass".  I don't claim any expertise in this area.  If the experts find little to no performance gain from this kind of integration, perhaps it is asking too much.  Doing this in userland would be quite straightforward (on a second pass, after the built-in instantiation has completed). 

Another integration nicety I would like to see supported by built-in template instantiation is to be able to bind sub objects from the host to the enhancements gateway.  So for example:

```html
<input :enhancements.withSteel.carbonPercent={{carbonPercent}} >
```

would work (using FAST web component syntax here.  Lit uses a . instead).


What follows is going out into uncharted territories, discussing how this proposal might integrate into a work-in-progress spec (template instantiation) that hasn't been fully fleshed out.


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
 

Note that the enhancement class corresponding to this attribute may specify a default count, so that the span would need to be mutated with the initial value,  either while it is being instantiated, if the custom enhancement has already been imported, or in the live DOM tree.  The decision of whether the enhancement should render-block is, when relevant, up to the developer.  If the developer chooses to import the enhancing class synchronously, before invoking the template instantiation, then it will render block, but the span's text will be already set when it is added to the DOM tree.  If the developer imports the class asynchronously, then, depending on what is in cache and other things that could impact timing, the modification could occur before or after getting appended to the live DOM tree.  Ideally before, but often it's better to let the user see something than nothing.

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
                    "beEnhancedBy": "counter",
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
                        "readOnly": true,
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

1.  Use CSS queries (or parts) to find all matching elements within the template clone ("button") in this case.
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

As a custom enhancement vendor, I took the time to implement, with custom enhancements I anticipated would be used thousands of times on a page, an internal, bespoke way of caching attributes globally, so that if a template repeats thousands of times, if I'm passed in the same attribute, I look for the the parsed object from my cache, and if not found, do the parse, and cache it (basically, memoization).  So this could be a pattern we recommend as a best practice way of optimizing performance when it seems warranted.

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
    static get config() {
        return {
            leaveAttr: true
        }
        
    }
}
```

... or more simply:

```JavaScript
class WithSteel extends ElementEnhancement {
    static config = {leaveAttrs: true}
}
```

The other reason for only doing it only for registered enhancements, is it means no guesswork is involved in determining which attributes are meant to be enhancements.

I suspect this "config" static property will grow to have other settings, especially as it integrates with template instantiation binding.

For example, we may want to be able to specify whether it doesn't make sense for the enhancement to be applied during template instantiation, that it only makes sense to get attached when the element being enhanced becomes connected to the live DOM tree.  I have found one such use case with [be-a-beacon](https://github.com/bahrus/be-a-beacon).  So suggested name for that decision:  attachWhenConnected:

```JavaScript
class WithSteel extends ElementEnhancement {
    static config = {
        leaveAttr: true,
        attachWhenConnected: true
    }
}
```


## AttachedCallback signature

I propose the attached (and detached) callback signature look as follows:

```TypeScript
interface ElementEnhancement{
    ...
    attachedCallback(enhancedElement: Element, enhancementInfo: EnhancementInfo);
    detachedCallback(enhancedElement: Element, enhancementInfo: EnhancementInfo);
    ...
}

interface EnhancementInfo {
    enhancement: string; //'withSteel'
    initialPropValues: any; //{ carbonPercent = 0.2}
    templateAttrs: Map<string, string>;
    observedAttributes: string[];
}

```

The enhancement string, and observedAttributes array of strings would, I think, be critical for "self-awareness", particularly for scenarios where the implementation of the enhancement is separated from the code that registers it, and also for being aware of the name of the enhancement and observedAttributes within the context of the scoped registry.

And now, dear reader, I confront you with perhaps the most dizzying concept we will need to face.  Brace yourself in what follows:

1.  We want enhancements to optionally be able to be associated with one or more 

The initialPropValues field of EnhancementInfo would be the object properties that had been passed in to oElement.enhancements.withSteel placeholder prior to the enhancement getting attached.

The templateAttrs would be the original attribute strings that were removed from the template, following Solution 2b above.  This would be undefined for server rendered HTML (and would instead be passed during the attributeChangedCallback).

## DetachedCallback lifecycle event

When would the detachedCallback method be called?

This is an area likely to require some critical feedback from browser vendors, but I will nevertheless express some thoughts on the matter.

One time it definitely would **not** be called is if the enh-* attribute, if present, is removed from the enhanced element, since as we've discussed, the custom attribute aspect is only one way to attach an enhancement.  A developer may want to remove the attribute to reduce clutter, without jeopardizing the enhancement.

I do think the detachedCallback should be associated in some way with the disconnectedCallback method of the enhanced custom element (or the equivalent for built-in elements).  However, there's a scenario where a custom element's disconnectedCallback is called, where we don't necessarily want to fully "dump" the enhancement -- when the element is moved from one parent container to another (within a Shadow DOM realm or even crossing Shadow DOM boundaries.)  To me, it would be ideal if the enhancement could remain attached in this circumstance, as if nothing happened.  

On the other hand, I could see scenarios where the enhancement would want to know that its host has been disconnected.  So the custom enhancement should have a way of being notified that this transfer took place.

My (naive?) recommendation is that the platform add an event that can be subscribed to for elements:  Elements currently have a built-in property, "isConnected".  It would be great if the elements also emitted a standard event when the element becomes [connected and (possibly another) event when it becomes disconnected](https://twitter.com/jaffathecake/status/1521023821003767808).

## How to programmatically detach an enhancement

I'm encountering a small number of use cases where we want enhancements to "do its thing", and then opt for early retirement.  The use cases I've encountered this with is primarily focused around an enhancement that does something with server-rendered HTML, which then goes idle afterwards, possibly to be replaced by a different kind of enhancement during template instantiation.  So I think it should be possible to do this via:

```JavaScript
const detachedEnhancement = await oElement.enhancements.whenDetached('withSteel');
```

I think we would want this to remove the attribute also, if applicable.

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


### Question 1: Should any formal support be provided for dispatching namespaced events from the element being enhanced?

Since the ElementEnhancement class extends EventTarget, we can directly subscribe to events from the enhancement.  Is this enough, though?

What if we need the enhancement to dispatch an event that can bubble up the DOM tree, or be able to be "captured" if not bubbling?

I think dispatching events from the enhanced element seems in keeping with the notion that we are enhancing the element, and that platform name-spacing of such events would be beneficial.

I propose that the ElementEnhancement base class have a method:  dispatchEventFromEnhancedElement that  would prefix the name of all events dispatched through this method, according to the endorsed naming convention.  The code for this method would look roughly as follows:

```TypeScript
class ElementEnhancement{
    ...
    dispatchEventFromEnhancedElement(type: string, init?: CustomEventInit){
        const prefixedType = 'enhanced' + this.enhancementInfo.enhancement + '.' + type;
        const evt = init !== undefined ? new CustomEvent(prefixedType, init) : new Event(prefixedType);
        this.#enhancedElement.dispatchEvent(evt);
    }
}
```

So for the withSteel enhancement, if we call this method with type = "carbonPercentChanged", the event type would be namespaced to enhanced.withSteel.carbonPercentChanged.



