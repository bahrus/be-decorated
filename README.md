# be-decorated

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/be-decorated)
[![Playwright Tests](https://github.com/bahrus/be-decorated/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-decorated/actions/workflows/CI.yml)
[![NPM version](https://badge.fury.io/js/be-decorated.png)](http://badge.fury.io/js/be-decorated)
[![How big is this package in your project?](https://img.shields.io/bundlephobia/minzip/be-decorated?style=for-the-badge)](https://bundlephobia.com/result?p=be-decorated)
<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-decorated?compression=gzip">



be-decorated provides a base class that enables "casting spells" on server-rendered DOM elements, by attaching ES6 proxies onto other "Shadow DOM peer citizens" -- native DOM or custom elements in the same Shadow DOM realm, based on cross-cutting custom attributes.  These base classes can also be used during template instantiation for a more optimal repeated web component scenario. 

be-decorated provides a much more "conservative" alternative approach to enhancing existing DOM elements, in place of the controversial "is"-based customized built-in element [standard-ish](https://bkardell.com/blog/TheWalrus.html).  There are, however, a small number of use cases where the is-based built-in approach [may be](https://github.com/WebKit/standards-positions/issues/97) the preferred one.

In contrast to the "is" approach, we can apply multiple behaviors / decorators to the same element:

```html
#shadow-root (open)
<black-eyed-peas 
    be-on-the-next-level=11
    be-rocking-over-that-bass-tremble
    be-chilling-with-my-motherfuckin-crew
></black-eyed-peas>

```

which seems [more readable](https://opensource.com/article/19/12/zen-python-flat-sparse#:~:text=If%20the%20Zen%20was%20designed%20to%20be%20a,obvious%20than%20in%20Python%27s%20strong%20insistence%20on%20indentation.) than:

```html
<is-on-the-next-level level=11>
    <is-rocking-over-that-base-tremble>
        <is-chilling-with-my-motherfunckin-crew>
            <black-eyed-peas></black-eyed-peas>
        </is-chilling-with-my-motherfuckin-crew>
    </is-rocking-over-that-base-tremble>
</is-on-the-next-level>
```

Not to mention [concerns about performance](https://sitebulb.com/hints/performance/avoid-excessive-dom-depth/).  And then there's [this](https://github.com/WICG/webcomponents/issues/809)

Note that after upgrading,  the first example ends up upgrading to:

```html
#shadow-root (open)
<black-eyed-peas 
    is-on-the-next-level=11
    is-rocking-over-that-bass-tremble
    is-chilling-with-my-motherfuckin-crew
></black-eyed-peas>
```

## Priors

be-decorated's goals are [quite](https://github.com/lume/element-behaviors) [similar](https://knockoutjs.com/documentation/custom-bindings.html) [to](https://medium.com/@_edhuang/add-a-custom-attribute-to-an-ember-component-81f485f8d997) [what](https://twitter.com/biondifabio/status/1530474444266823682) [is](https://docs.astro.build/en/reference/directives-reference/#:~:text=Template%20directives%20are%20a%20special%20kind%20of%20HTML,life%20easier%20%28like%20using%20class%3Alist%20instead%20of%20class%29.) [achieved](https://alpinejs.dev/) via [things](https://htmx.org/docs/) [that](https://vuejs.org/v2/guide/custom-directive.html) [go](https://docs.angularjs.org/guide/directive) [by](https://dojotoolkit.org/reference-guide/1.10/quickstart/writingWidgets.html) [many](https://aurelia.io/docs/templating/custom-attributes#simple-custom-attribute) [names](https://svelte.dev/docs#template-syntax-element-directives).

We prefer ["decorator"](https://en.wikipedia.org/wiki/Decorator_pattern) as the term, but "[cross-cutting] [custom attribute](https://github.com/matthewp/custom-attributes)", "directive", and especially ["behavior"](https://github.com/lume/element-behaviors) are also acceptable terms.

Differences to these solutions (perhaps):

1. This can be used independently of any framework (web component based).
2. Each decorator can be imported independently of others via an ES6 module.
3. Definition is class-based, but with functional reactive ways of organizing the code ("FROOP")
4. Applies exclusively within Shadow DOM realms.
5. Reactive properties are managed declaratively via JSON syntax.
6. Namespace collisions easily avoidable within each shadow DOM realm.
7. Use of ES6 proxies for extending properties allows us to avoid future conflicts.
8. be-decorated provides "isomorphic" support for using the same declarative syntax while transforming templates during template instantiation, as well as while the DOM is sitting in the live DOM tree.  But the critical feature is that if the library is not yet loaded during template instantiation, *nuk ka problem*, the live DOM decorator can apply the logic progressively when the library is loaded.  Meaning we can punt during template instantiation, so that render blocking is avoided.  And if the library *is* loaded prior to template instantiation, it can still be supplemented by the live DOM decorator, but the initial work performed during the template instantiation can be skipped by the live DOM decorator.

Prior to that, there was the heretical [htc behaviors](https://en.wikipedia.org/wiki/HTML_Components).

## Soapbox, repetitive, thinking out loud ramble, or, my thoughts on standards

At the risk of seeming rude (and I say this with the greatest admiration towards others who may disagree), my views have evolved to the point where I can say with growing confidence that should ideas remotely like these be elevated to a standard, my very least favorite term for what they should be called is "custom attribute."  And it should **not** extend a class called "Attribute" or some such.  The reason being the focus of what this functionality is supplying should **not** be on some flexible / customizable attribute name and its single value, but on what *purpose* it is serving -- and that purpose is to enhance existing elements in a safe, loosely coupled, future-proof, often cross cutting way.  I believe the decorator pattern is the best fit for the right word, so if there is a class we should extend, it should be called something to that effect:  ElementDecorator, for example? ElementBehavior assumes too much (see below).

Yes, it is true that in some contexts, ["attribute"](https://www.geeksforgeeks.org/custom-attributes-in-c-sharp/) is okay as a general term for specifying metadata associated with some functionality.  But Python uses decorators.  And oh, yeah, so does JavaScript officially now (woohoo!!!).  In the context of custom elements (and built-in elements for that matter) we are already using "custom" and "built-in" attributes when we define the metadata for the class instance.  In the case of c# classes, the equivalent to what those HTML attributes are doing are really the parameters of the constructor, so calling those other things "attributes" in C# makes sense, because there's no cause for confusion.  What we are providing with these cross cutting attributes are really linkages to another class.

For very, very simple cases, where the loosely coupled, extending class has only one property, it *might* make sense to update the corresponding attribute, but I think we're rarely going to find that sufficient, and even the simplest cases will tend to quickly outgrow that single property, based on my experience.  If you don't believe me, take a look at Alpine or what [WordPress](https://make.wordpress.org/core/2023/03/30/proposal-the-interactivity-api-a-better-developer-experience-in-building-interactive-blocks/) is doing. Yes, WordPress supports updating the attribute.  But just as passing down "parameter" changes to a custom element via attributes is possible but discouraged, that argument applies ten-fold for these attributes.  We don't want to promote constant re-parsing of a large attribute when tiny fragments of it change.  I initially supported that, but withdrew it, for that very reason.  I would be perfectly content removing any official support for changing the attribute, using it only for initial settings during hydration, but I can see arguments for why that could be too constraining.  We need to have a better way to pass changes in, and I think we should use dataset as our example. There needs to be at least one property added to all elements that can act as the gateway through which all custom enhancements are tied together.  Only then will the proposal make any coherent sense.  **That's** where the name we assign (customizable within each ShadowDOM, once we have the ability to scope custom elements, perhaps) comes into critical play.  Also, how we can subscribe to namespaced events needs to be considered.  If we want to use the word "custom" it should be custom [some term to describe the] common root gateway property.  A key decision should be what to call that gateway property.  I purposely used "beDecorated" because I know that's **not** what it should be called. My vote is "decorators" or something very close to that.  I could live with "directives", but I found that term a bit intimidating when I first encountered it in Angular, I think because of [this association](https://codedocs.org/what-is/directive-programming#:~:text=In%20computer%20programming%2C%20a%20directive%20or%20pragma%20%28from,language%2C%20and%20may%20vary%20from%20compiler%20to%20compiler.).  Plus it sounds bossy.   Decorators sounds artistic, which I like.

I also think there should be a distinguishing feature all such attributes should have (similar in spirit to data- / dataset), so that we can distinguish the ownership.  I think be- is assuming too much about what all these enhancements will be doing (see below) in case you were wondering (🙂).  Maybe it should be required to use a colon in the name, just to be a little different?  If a prefix with a dash is still the preferred approach (similar to data-), my vote is x-.  Which I suppose would push for the gateway property to be called "extensions", which I would also be okay with.  Whatever we use for this prefix, it will likely be:

1.  Just as ignored, normally, as data-
2.  But support for recognizing the prefix by decorator authors will be provided to conform to best practices.
3.  Authors of custom elements will avoid that prefix when defining their attributes to avoid confusion.
4.  As such, if the name of the decorator matches the name of one of the custom element's attributes, **now** we can fallback to using the prefixed name.

For server-rendered content (as opposed to template instantiated content), yes, we need single attributes to be used to stuff all the needed settings needed by the class.

But I strongly believe we want to be able to enhance elements during template instantiation, using the same class definitions, and we should not require some fixed attribute name associated with a giant string of configurations being cloned every time to do this.  Instead, we should be passing in properties via the gateway property described above (even if the class hasn't been loaded, the class instance should be able to absorb already passed in property values).  

There may be more than one category for the types of  enhancements we make to existing elements.  The angle be-decorated takes is squarely fixated on is adding "behaviors".  Every dream I've had since 1994, when it comes to enhancing HTML (or maybe a little later, when I was trying to polyfill MathML (🙂) ), has been associated with adding things that are best described as behaviors.  But I'm not sure that perfectly describes *all* types of enhancements people might want to make.  Things that are look and feel related (that may define which CSS theme to pull in for example) don't really fit that.  And there may be other categories.  Which is why I come back to "decorators", to match what we call those things in JavaScript.  And I really like the phrase "adorned element."  And decorators seems like it could aptly describe CSS themes also, no?

## Example

There are [numerous](https://github.com/bahrus?tab=repositories&q=be-&type=&language=&sort=) useful element decorators/behaviors that provide a good introduction to what creating a be-decorated behavior/decorator entails.

They all use a secondary dependency, be-hive.  So the example shown below indicates how to create one without [be-hive](https://github.com/bahrus/be-hive).

```TypeScript
import { define } from 'be-decorated/DE.js';
export class BeCounted extends EventTarget {
    hydrate({ on, self }) {
        return [{ resolved: true }, { handleClick: { on: on, of: self } }];
    }
    handleClick(pp, e) {
        pp.count++;
    }
}
define({
    config: {
        tagName: 'be-counted',
        propDefaults: {
            virtualProps: ['count', 'on'],
            upgrade: 'button',
            ifWantsToBe: 'counted',
            emitEvents: ['count'],
            proxyPropDefaults: {
                on: 'click',
                count: 0
            }
        },
        actions: {
            'hydrate': [
                ifAllOf: ['on']
            ]
        }
    },
    complexPropDefaults: {
        controller: BeCounted,
    }
});
document.head.appendChild(document.createElement('be-counted'));
```

We can now activate the behavior:

```html
<button id='test' be-counted='{"count": 30}'>Count</button>
```

The actions section of the configuration routes property changes of the proxy to methods of the class, where the first argument of the class is passed in the proxy.

So anytime property 'on' changes (which will happen during initialization of the properties via proxyPropDefaults which can be overridden by settings in the attribute).

Without use of [be-hive](https://github.com/bahrus/be-hive), the decorator won't apply within any ShadowDOM, without plopping an instance of the web component inside each ShadowDOM realm somewhere.

## Support for Duo Lingo

By default, the initial settings specified by the attribute are expected to be in JSON format.

There is a way to allow for simpler attributes, by specifying the default prop name:

```JavaScript
    propDefaults:{
        ...
        primaryProp: 'count'
    }
```

```html
<button id='test' be-counted=30>Count</button>
```

be-decorated also provides support for a radically different kind of syntax, which we dub ["Hemingway Notation"](https://www.youtube.com/watch?v=4hJiVqSP4qM), including support for comments.  

As the example below illustrates, the two can be combined:

### (Mostly) Hemingway Notation Example

```html
<div be-scoped='{
    "count": 30,
    "status": "Logged in",
    "propWithAndAndToInName": "hello"
}'>
    <button></button>
    <div></div>
    <span></span>
    <script be-sharing='
        {"shareCountAndStatusTo":  [{"div": ["status", " (", "count", " times)"]}]}
        Set observing realm to parent. //This is the default.
        Set home in on path to be scoped:scope.  //Not set by default.  //Special intervention for properties that start with be[space].
        Set sharing realm to parent. //This is the default.
        Share count to button element as text content.
        Share prop with \and \and \to in name to span element.
    '>
    </script>
</div>
```

Each comment must start with // and end with a period.

### Equivalent markup with all JSON

```html
<div be-scoped='{
    "count": 30,
    "status": "Logged In"
}'>
    <button></button>
    <div></div>
    <script be-sharing='{
        "observingRealm": "parent",
        "homeInOnPath": "beDecorated.beScoped.scope",
        "sharingRealm": "parent",
        "shareCountAndStatusTo":  [{"div": ["status", " (", "count", " times)"]}],
        "Share": ["countToButtonEAsTextContent"],
        "share": [{
            "props": ["propWithAndOrToInName"],
            "transform": {
                "span": "propWithAndOrToInName"
            }
        }]
    }'>
    </script>
</div>
```

The JSON syntax can be more convenient if one is adopting a build step -- editing an mts/mjs file, which compiles to HTML, so the developer can use JS (no quotes, support for comments, etc) and benefit from TypeScript compile time checks.  Hemingway notation seems better when working with HTML files without a build step.  The performance penalty from this DX nicety is quite low, and the penalty 
 is only incurred if there is actual Hemingway notation in the attribute, so it could also be eliminated during a (more sophisticated) build step.

> **Note**: Use of the "virtualProps" setting is critical if we want to be guaranteed that our component doesn't break, should the native DOM element or custom element the decorator adorns be enhanced with a new property with the same name.


## Setting properties of the proxy externally

Just as we need to be able to pass property values to custom elements, we need a way to do this with be-decorated proxy decorators.  But how?

The tricky thing about proxies is they're great if you have access to them, useless if you don't.  

###  Approach I.  Programmatically, but carefully.

be-decorated reluctantly commits a "cardinal sin" by attaching a field onto the adorned element called "beDecorated", specifically to allow passing properties down easier.  Within this field, all the proxies based off of be-decorated are linked.  So to set the property of a proxy via the element it adorns, we need to act gingerly:

```JavaScript
if(myElement.beDecorated === undefined) myElement.beDecorated = {};
if(myElement.beDecorated.aButterbeerCounter === undefined) myElement.beDecorated.aButterbeerCounter = {};
myElement.beDecorated.aButterbeerCounter.count = 7;
```

The intention here is even if the element hasn't been upgraded yet, property settings made this way should be absorbed into the proxy once it becomes attached.  And if the proxy is already attached, then those undefined checks will be superfluous, but better to play it safe.

### Approach II.  Pulling, rather than pushing, props down.

[be-observant](https://github.com/bahrus/be-observant) provides a pattern, and exposes some reusable functions, for "pulling-down" bindings from the host or neighboring siblings.  This can often be a sufficient and elegant way to deal with this concern.


## API

This web component base class builds on the provided api:

```JavaScript
import { upgrade } from 'be-decorated/upgrade.js';
upgrade({
    shadowDOMPeer: ... //Apply trait to all elements within the same ShadowDOM realm as this node.
    upgrade: ... //CSS query to monitor for matching elements within ShadowDOM Realm.
    ifWantsToBe: // monitor for attributes that start with be-[ifWantsToBe], 
}, callback);
```

API example:

```JavaScript
import {upgrade} from 'be-decorated/upgrade.js';
upgrade({
    shadowDOMPeer: document.body,
    upgrade: 'black-eyed-peas',
    ifWantsToBe: 'on-the-next-level',
}, target => {
    ...
});
```

The API by itself is much more open-ended, which means we need to entirely define what to do in our callback.  In other words, the API provides no built-in support for creating a proxy and passing it to a controller.

## For the sticklers

If you are concerned about using attributes that are prefixed with the non standard be-, use data-be instead:


```html
<ul data-be-sorted='{"direction":"asc","nodeSelectorToSortOn":"span"}'>
    <li>
        <span>Zorse</span>
    </li>
    <li>
        <span>Aardvark</span>
    </li>
</ul>

```

## Reserved Props

Using be-decorated to define an element decorator/behavior does impinge a bit on the developer's naming creativity:  There is a small number of reserved proxy prop names that have deep meaning to be-decorated, and thus should only be used in the prescribed manner.  They are listed below:

<table>
    <caption>Reserved Controller Properties / Proxy Virtual Property Names</caption>
    <thead>
        <th>Name</th>
        <th>Meaning/usage</th>
        <th>Scope</th>
    </thead>
    <tbody>
        <tr>
            <td>emitEvents</td>
            <td>List of virtual properties that should emit an event when the reference or value changes.  Discussed in more detail below</td>
            <td>Virtual property of proxy</td>
        </tr>
        <tr>
            <td>self</td>
            <td>Direct reference to the adorned element.  Certain method calls don't work when applied to the proxy.</td>
            <td>Virtual property of proxy.</td>
        </tr>
        <tr>
            <td>proxy</td>
            <td>The ES6 proxy wrapping the adorned element</td>
            <td>Inherited property of controller</td>
        </tr>
        <tr>
            <td>controller</td>
            <td>The controller for the decorator/behavior</td>
            <td>Virtual property of proxy</td>
        </tr>
        <tr>
            <td>resolved</td>
            <td>
                Standard way for a decorator/behavior to indicate it has "hydrated and is currently waiting on further instructions, if any."  Critical for <a href=https://github.com/bahrus/be-promising>be-promising</a>.  The adorned element emits event "be-decorated.[if-wants-to-be].resolved when it is in resolved state.
            </td>
            <td>Virtual property of proxy.</td>
        </tr>
        <tr>
            <td>rejected</td>
            <td>Standard way for a decorator/behavior to indicate it has "failed to hydrate."  Critical for <a href=https://github.com/bahrus/be-promising>be-promising</a>.
                The adorned element emits event "be-decorated.[if-wants-to-be].rejected when it is in rejected state.
            </td>
            <td>Virtual property of proxy.</td>
        </tr>  
    </tbody>
</table>

## Event Notifications

Any be-decorated-based decorator/behavior can be configured to emit namespaced events via the emitEvents property.  An example can be [seen here](https://github.com/bahrus/be-looking-up/blob/baseline/be-looking-up.ts):

```JavaScript
emitEvents: ['value', 'fetchInProgress'],
```

For example, if a property "foo" is modified via the proxy on a decorator named be-spoke, and emitEvents is set to an array containing "foo", then an event will be dispatched from the adorned element with name "be-decorated.spoke.foo-changed".

Other web components that provide element behavior in a different way from be-decorated could then emit its own events, and conflicts between them can be avoided in this way.

Also, it seems natural for the event name to match the [fully namespaced] property name.  

Since beDecorated based element behaviors are linked to a controller, users can also / alternatively subscribe to the controller, in which case the event name is simply foo-changed.


## Reserved, universal events

**If** emitEvents is defined, then when the proxy has been established, the target element will emit event:

"be-decorated.[if-wants-to-be].is-[if-wants-to-be]".

For example, this behavior:

```html
<form be-reformable='{}'>
</form>
```

will emit event "be-decorated.reformable.is-reformable" when the proxy has been created.

The detail of the event contains the proxy, and the controller instance.

The subscriber can then opt to receive further events via the controller, rather than via the proxy. 

The advantage of subscribing via the controller, is the event names will be much shorter.

Access to the controller can be made via element.beDecorated.reformable.controller, but only once the component has upgraded.

Where this is applicable, the creator of a be-decorated controller will need to extend the EventTarget class.


## be-noticed pattern

Alternatively, more controversially, and in addition, [be-noticed](https://github.com/bahrus/be-noticed) provides a pattern as far as syntax, as well as reusable code, that can pass things more directly to the hosting (custom) element, or neighboring elements, similar to be-observant (but in the opposite direction).


## Lifecycle milestones

There are two lifecycle milestones that be-decorated observes.  They are all optional and can be omitted.  The names of the lifecycle milestones do not need to match with method names in the controller class.  The mapping between the lifecycle milestones and methods of the controller is specified in the propDefaults section of the configuration settings, as discussed earlier.



<table>
<tr>
    <th>Name</th><th>Description</th>
</tr>
<tr>
    <td>intro</td><td>Occurs when the proxy is created for a new target that has been discovered that matches the custom attribute criteria.</td>
</tr>
<tr>
    <td>finale</td><td>Occurs when the underlying element is removed from the DOM, and the proxy is destroyed.</td>
</table>

## Isomorphic logic

In the grand scheme of things, in many cases it makes sense for the declarative HTML syntax that be-decorated-based decorators / behavior activates in the live DOM tree, to also be recognized beyond the confines of said tree.  The same syntax can potentially be applied in 4 "legs" of the journey from the server to the end user's screen, in a kind of "relay race", where the baton is passed during the pipeline of processing.

Those 4 "legs" are:

1.  On the server -- for example, in a CloudFlare worker that uses the HTMLRewriter api.
2.  In a service worker running in the browser, [w3c willing](https://discourse.wicg.io/t/proposal-support-cloudflares-htmlrewriter-api-in-workers/5721).
3.  In the browser's main thread, during template instantiation, using ["non-verbal spells"](https://github.com/bahrus/trans-render#extending-tr-dtr-horizontally).
4.  In the browser's live DOM tree, using this library's proxy support tied to CSS pattern matching (attribute + element name, optionally), as we've discussed thus far.  This code also runs in the main thread, [unless](https://amp.dev/documentation/components/amp-script/) [alternatives](https://partytown.builder.io/) are found to both work and improve the performance.

These four legs may be subdivided into two halves -- the "back-end" two "legs" could, w3c willing, contain ["isomorphic"](https://medium.com/airbnb-engineering/isomorphic-javascript-the-future-of-web-apps-10882b7a2ebc) (i.e. shared) code.  Likewise, the two "front-end" legs can share code, as the api's available during template instantiation are quite similar to the api's available within the live DOM tree.  The be-decorated library provides explicit support for this.

In fact, if used with the [trans-render](https://github.com/bahrus/trans-render) template instantiating library, be-decorated decorators can also be used, with no changes / additions needed, during [template instantiation](https://github.com/bahrus/trans-render#extending-tr-dtr-horizontally).

## All about the FROOP orchestrator [Documentation in progress]

Element decorators / behaviors built with be-decorated can consist of "action methods" that react to state changes made to the proxy.

These action methods can often avoid taking any responsibility for causing side effects -- they can pass back an object that should be shallow merged ("object.assigned") into the proxy.

Or it can pass back a two-element tuple (for now),  [Props, EventConfigs], where the first element is just as before -- an object that should be shallow merged into the proxy, and the second element is an "event configuration" object, that the FROOP orchestrator can use to wire events to other action methods, which recursively also have no side effects, because the FROOP orchestrator will merge whatever it returns as well.

This makes the code trivial to test, as each method will tend to be quite loosely coupled from the other methods.   It will be rare that one action method needs to directly call another action method.  In addition, the code can become quite library neutral, as each action method  can only contain the base essentials of what needs to happen.  

## Viewing example from git clone or git fork:

Install node.js.  Then, from a command prompt from the folder of your git clone or github fork:

```
$ npm install
$ npm run serve

Open http://localhost:3030/demo/ for a listing of examples.
```





