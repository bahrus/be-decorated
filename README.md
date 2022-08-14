# be-decorated

[![Published on webcomponents.org](https://img.shields.io/badge/webcomponents.org-published-blue.svg)](https://www.webcomponents.org/element/be-decorated)

[![Playwright Tests](https://github.com/bahrus/be-decorated/actions/workflows/CI.yml/badge.svg?branch=baseline)](https://github.com/bahrus/be-decorated/actions/workflows/CI.yml)

<a href="https://nodei.co/npm/be-decorated/"><img src="https://nodei.co/npm/be-decorated.png"></a>

<img src="http://img.badgesize.io/https://cdn.jsdelivr.net/npm/be-decorated?compression=gzip">

be-decorated provides a base class that enables attaching ES6 proxies onto other "Shadow DOM peer citizens" -- native DOM or custom elements in the same Shadow DOM realm, based on cross-cutting custom attributes.

be-decorated provides a much more "conservative" alternative approach to enhancing existing DOM elements, in place of the controversial "is"-based customized built-in element [standard-ish](https://bkardell.com/blog/TheWalrus.html).

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

be-decorated's goals are [quite](https://github.com/lume/element-behaviors) [similar](https://knockoutjs.com/documentation/custom-bindings.html) [to](https://medium.com/@_edhuang/add-a-custom-attribute-to-an-ember-component-81f485f8d997) [what](https://twitter.com/biondifabio/status/1530474444266823682) [is](https://docs.astro.build/en/reference/directives-reference/#:~:text=Template%20directives%20are%20a%20special%20kind%20of%20HTML,life%20easier%20%28like%20using%20class%3Alist%20instead%20of%20class%29.) achieved via [things](https://htmx.org/docs/) [that](https://vuejs.org/v2/guide/custom-directive.html) [go](https://docs.angularjs.org/guide/directive) [by](https://dojotoolkit.org/reference-guide/1.10/quickstart/writingWidgets.html) [many](https://aurelia.io/docs/templating/custom-attributes#simple-custom-attribute) [names](https://svelte.dev/docs#template-syntax-element-directives).

We prefer ["decorator"](https://en.wikipedia.org/wiki/Decorator_pattern) as the term, but "[cross-cutting] [custom attribute](https://github.com/matthewp/custom-attributes)", "directive", and especially ["behavior"](https://github.com/lume/element-behaviors) are also acceptable terms.  

Differences to these solutions (perhaps):

1. This can be used independently of any framework (web component based).
2. Each decorator can be imported independently of others via an ES6 module.
3. Definition is class-based.
4. Applies exclusively within Shadow DOM realms.
5. Reactive properties are managed declaratively via JSON syntax.
6. Namespace collisions easily avoidable within each shadow DOM realm.
7. Use of ES6 proxies for extending properties allows us to avoid future conflicts.
8. be-decorated provides "isomorphic" support for using the same declarative syntax while transforming templates during template instantiation, as well as while the DOM is sitting in the live DOM tree.  But the critical feature is that if the library is not yet loaded during template instantiation, *nuk ka problem*, the live DOM decorator can apply the logic progressively when the library is loaded.  Meaning we can punt during template instantiation, so that render blocking is avoided.  And if the library *is* loaded prior to template instantiation, it can still be supplemented by the live DOM decorator, but the initial work performed during the template instantiation can be skipped by the live DOM decorator.

Prior to that, there was the heretical [htc behaviors](https://en.wikipedia.org/wiki/HTML_Components).


## Basic Syntax

To define a decorator, define a "controller" class.  The structure of the class is fairly wide open.  The lifecycle event methods can have any name you want.  For example:

```TypeScript
export class ButterbeerController{
    #self: ButterbeerCounterProps | undefined;
    init(self: ButterbeerCounterProps, btn: HTMLButtonElement){
        this.#self = self;
        btn.addEventListener('click', this.handleClick)
        self.count = 0;
        
    }
    onCountChange(){
        console.log(this.#self!.count);
    }
    handleClick = (e: MouseEvent) => {
        this.#self!.count++;
    }
}
```

Then use (mostly) JSON configuration to instruct be-decorated library how to apply the decorator onto elements:

```JavaScript
import {ButterbeerController} from '[wherever]';
import {define} from 'be-decorated/be-decorate.js';

define({
    config:{
        tagName: 'be-a-butterbeer-counter',
        propDefaults:{
            virtualProps: ['count'],
            upgrade: 'button',
            ifWantsToBe: 'a-butterbeer-counter',
            intro: 'init'
        },
        actions:{
            'onCountChange': {
                ifKeyIn: ['count']
            }
        }
    },
    complexPropDefaults:{
        controller: ButterbeerController,
    }
});
```

> **Note**: Use of the "virtualProps" setting is critical if we want to be guaranteed that our component doesn't break, should the native DOM element or custom element be enhanced with a new property with the same name.

<details>
    <summary>Why not specify a specific interface for lifecycle event methods?</summary>

Being a home-grown library, as opposed to a universal web standard, the advantage of not specifying the names of lifecycle event names (like init, for example) is that it provides developers the flexibility to work with other libraries that may also use the same method names for other purposes.

The disadvantage is it requires an additional step, providing the mapping between the internal name be-decorated uses for initialization (intro) and what the developer may prefer (which might be a different name, like init).  As a result, the following "boring" configuration has to be added to tap into the initialization method, assuming the developer is fine adopting the internal name of "intro":

```JavaScript
intro: 'intro'
```

And of course the previous example indicates what the configuration looks like when the developer feels the need to adopt a different name.

</details>

Within each shadow DOM realm, our decorator web component will only have an effect if an instance of the web component is plopped somewhere inside that shadow DOM.

Although it is a bit of a nuisance to remember to plop an instance in each shadow DOM realm, it does give us the ability to avoid name conflicts with other libraries that use custom attributes.  In the example above, if we plop an instance inside the shadow DOM with no overrides: 

```html
<button be-a-butterbeer-counter-bahrus-github='{"count": 30}'>Count</button>
...

<be-a-butterbeer-counter-bahrus-github></be-a-butterbeer-counter-bahrus-github>
```

then it will affect all buttons with attribute be-a-butterbeer-counter-bahrus-github within that shadow DOM realm.

To specify a different attribute, override the default "ifWantsToBe" property thusly:

```html
<button be-a-b-c='{"count": 30}'>Count</button>
...

<be-a-butterbeer-counter-bahrus-github if-wants-to-be=a-b-c></be-a-butterbeer-counter-bahrus-github>
```

Another silver lining to this nuisance:  It provides more transparency where the behavior modification is coming from.

The [be-hive component](https://github.com/bahrus/be-hive) makes managing this nuisance almost seamless.  If developing a component that uses more than a few decorators, it is probably worth the extra dependency.

Note the use of long names of the web component.  Since the key name used in the markup is configurable via if-wants-to-be, using long names for the web component, like guid's even, will really guarantee no namespace collisions, even without the help of pending standards.  If be-hive is used to help manage the integration, developers don't really need to care too much what the actual name of the web component is, only the value of if-wants-to-be, which is configurable within each shadow DOM realm.


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


###  Approach II. Setting properties via the controlling attribute:

An alternative approach, which be-decorated also supports, is to pass in properties via its custom attribute:

```html
<list-sorter upgrade=* if-wants-to-be=sorted></list-sorter>

...

<ul be-sorted='{"direction":"asc","nodeSelectorToSortOn":"span"}'>
    <li>
        <span>Zorse</span>
    </li>
    <li>
        <span>Aardvark</span>
    </li>
</ul>

```


After list-sorter does its thing, the attribute "be-sorted" switches to "is-sorted":

```html

<ul is-sorted='{"direction":"asc","nodeSelectorToSortOn":"span"}'>
    <li>
        <span>Aardvark</span>
    </li>
    <li>
        <span>Zorse</span>
    </li>
</ul>

```

You cannot pass in new values by using the is-sorted attribute.  Instead, you need to continue to use the be-sorted attribute:


```html

<ul id=list is-sorted>
    <li>
        <span>Aardvark</span>
    </li>
    <li>
        <span>Zorse</span>
    </li>
</ul>

<script>
    list.setAttribute('be-sorted', JSON.stringify({direction: 'desc'}))
</script>

```

The disadvantage of this approach is we are limited to JSON-serializable properties, and there is a cost to stringifying / parsing.

By the way, a [vscode plug-in](https://marketplace.visualstudio.com/items?itemName=andersonbruceb.json-in-html) is available that makes editing JSON attributes like these much less susceptible to human fallibility.


### Approach III.  Pulling, rather than pushing, props down.

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
<list-sorter upgrade=* if-wants-to-be=sorted></list-sorter>

...

<ul data-be-sorted='{"direction":"asc","nodeSelectorToSortOn":"span"}'>
    <li>
        <span>Zorse</span>
    </li>
    <li>
        <span>Aardvark</span>
    </li>
</ul>

```


## Reserved, universal events [TODO]

**If** emitEvents is defined, then when the proxy has been established, the target element will emit event:

"beDecorated.[if-wants-to-be].is-[if-wants-to-be]".

For example, this behavior:

```html
<form be-reformable='{}'>
</form>
```

will emit event "beDecorated.reformable.is-reformable" when the proxy has been created.

The detail of the event contains the proxy, and the controller instance.

The subscriber can then opt to receive further events via the controller, rather than via the proxy [TODO] 

The advantage of subscribing via the controller, is the event names will be much shorter.

Access to the controller can be made via element.beDecorated.reformable.controller, but only once the component has upgraded.

Where this is applicable, the creator of a be-Decorated controller will need to extend the EventTarget class.

## Event Notification, with breaking change [TODO]

Any be-decorated-based decorator/behavior can be configured to emit namespaced events via the emitEvents property.  An example can be [seen here](https://github.com/bahrus/be-looking-up/blob/baseline/be-looking-up.ts):

```JavaScript
emitEvents: ['value', 'fetchInProgress'],
```

For example, if a property "foo" is modified via the proxy on a decorator named be-spoke, and emitEvents is set to an array containing "foo", then an event will be dispatched from the adorned element with name "beDecorated.spoke.foo-changed".

Other web components that provide element behavior in a different way from be-decorated could then emit its own events, and conflicts between them can be avoided in this way.

Since beDecorated based proxies are linked to a controller, users can also / alternatively subscribe to the controller, in which case the event name is simply foo-changed.

## be-noticed pattern

Alternatively, more controversially, and in addition, [be-noticed](https://github.com/bahrus/be-noticed) provides a pattern as far as syntax, as well as reusable code, that can pass things more directly to the hosting (custom) element, or neighboring elements, similar to be-observant (but in the opposite direction).

## Primary prop

Sometimes a decorator will only have a single, primitive-type property value to configure, at least for the time being.  Or maybe there are multiple props, but one property in particular is clearly the most important, and the other properties will rarely deviate from the default value.  In that case, the extra overhead from typing and parsing JSON just to read that value seems like overkill.  

So be-decorated provides a way of defining a "primary" property, and just set it based on the string value, if the string value doesn't start with a { or a [.

Name of the property:  "primaryProp"

## Lifecycle milestones

There are three lifecycle milestones that be-decorated observes.  They are all optional and can be omitted.  The names of the lifecycle milestones do not need to match with method names in the controller class.  The mapping between the lifecycle milestones and methods of the controller is specified in the propDefaults section of the configuration settings, as discussed earlier.



<table>
<tr>
    <th>Name</th><th>Description</th>
</tr>
<tr>
    <td>intro</td><td>Occurs when the proxy is created for a new target that has been discovered that matches the custom attribute criteria.</td>
</tr>
<tr>
    <td>batonPass</td><td>This is used in conjunction with template instantiation, when applying isomorphic logic between template instantiation and within the live DOM tree.  More on this below.</td>
</tr>
<tr>
    <td>finale</td><td>Occurs when the underlying element is removed from the DOM, and the proxy is destroyed.</td>
</table>

## Isomorphic logic -- baton passing

In the grand scheme of things, in many cases it makes sense for the declarative HTML syntax that be-decorated-based decorators / behavior activates in the live DOM tree, to also be recognized beyond the confines of said tree.  The same syntax can potentially be applied in 4 "legs" of the journey from the server to the end user's screen, in a kind of "relay race", where the baton is passed during the pipeline of processing.

Those 4 "legs" are:

1.  On the server -- for example, in a CloudFlare worker that uses the HTMLRewriter api.
2.  In a service worker running in the browser, [w3c willing](https://discourse.wicg.io/t/proposal-support-cloudflares-htmlrewriter-api-in-workers/5721).
3.  In the browser's main thread, during template instantiation.
4.  In the browser's live DOM tree, using this library's proxy support tied to CSS pattern matching (attribute + element name, optionally), as we've discussed thus far.  This code also runs in the main thread, [unless](https://amp.dev/documentation/components/amp-script/) [alternatives](https://partytown.builder.io/) are found to both work and improve the performance.

These four legs may be subdivided into two halves -- the "back-end" two "legs" could, w3c willing, contain ["isomorphic"](https://medium.com/airbnb-engineering/isomorphic-javascript-the-future-of-web-apps-10882b7a2ebc) (i.e. shared) code.  Likewise, the two "front-end" legs can share code, as the api's available during template instantiation are quite similar to the api's available within the live DOM tree.  The be-decorated library provides explicit support for this.

To see this in action, let's look at [a](https://github.com/bahrus/be-delible) [few](https://github.com/bahrus/be-typed) [examples](https://github.com/bahrus/be-clonable): 

The first thing we observe is that we end up wanting a "diamond-shaped" dependency graph of file dependencies:

File index.js has two references that can load in parallel -- 1.  trPlugin.js that is used for template instantiation, and 2. be-*.js, used within the DOM tree.  But those two files have fairly minimal, mostly boilerplate code.  Most of the interesting logic, instead, is contained in a shared ("isomorphic") class -- Deleter.js, Typer.js Cloner.js, in these examples.

It is a good practice to then have three test files -- one that only does template instantiation, one that does only live DOM tree manipulation, and one that does both.  The one that does both should be checked that the code doesn't unnecessarily get invoked twice, in both layers -- only once during template instantiation.  Only prop changes after the initial rendering should result in any code getting executed in the DOM live tree.

## Viewing example from git clone or git fork:

Install node.js.  Then, from a command prompt from the folder of your git clone or github fork:

```
$ npm install
$ npm run serve

Open http://localhost:3030/demo/ for a listing of examples.
```






