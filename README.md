# be-decorated

be-decorated provides a base class that enables attaching ES6 proxies onto other "Shadow DOM peer citizens" -- native DOM or custom elements in the same Shadow DOM realm.

be-decorated provides a much more "conservative" alternative approach to enhancing existing DOM elements, in place of the controversial "is"-based customized built-in element [standard-ish](https://bkardell.com/blog/TheWalrus.html).

In contrast to the "is" approach, we can apply multiple behaviors / decorators to the same element:

```html
#shadow-root (open)
    <be-on-the-next-level upgrade=blacked-eyed-peas if-wants-to-be=on-the-next-level></be-on-the-next-level>
    <be-rocking-over-that-bass-tremble upgrade=black-eyed-peas if-wants-to-be=rocking-over-that-bass-tremble></be-rocking-over-that-bass-tremble>
    <be-chilling-with-my-motherfuckin-crew upgrade=blacked-eyed-peas if-wants-to-be=chilling-with-my-motherfuckin-crew></be-chilling-with-my-motherfuckin-crew>
    ...



    <black-eyed-peas 
        be-on-the-next-level='{"level":"level 11"}' 
        be-rocking-over-that-bass-tremble
        be-chilling-with-my-motherfuckin-crew
    ></black-eyed-peas>

    <!-- Becomes, after upgrading -->
    <black-eyed-peas 
        is-on-the-next-level='{"level":"level 11"}'
        is-rocking-over-that-bass-tremble
        is-chilling-with-my-motherfuckin-crew
    ></black-eyed-peas>
```

## Priors

be-decorated's goals are quite similar to what is achieved via [things](https://htmx.org/docs/) [commonly](https://vuejs.org/v2/guide/custom-directive.html) [referred](https://docs.angularjs.org/guide/directive) to [as](https://aurelia.io/docs/templating/custom-attributes#simple-custom-attribute) "custom directives."

Differences to these solutions:

1. This can be used independently of any framework (web component based).
2. Each decorator can be imported indendently of others via ES6 proxies.
2. Definition is class-based.
3. Applies exclusively within Shadow DOM realms.
4. Reactive properties are managed declaratively via JSON syntax.

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

Then use (mostly) JSON configuration to instruct be-decorated how to apply the decorator onto elements:

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

Note the specification of "virtualProps".  Use of virtualProps is critical if we want to be guaranteed that our component doesn't break, should the native DOM element or custom element be enhanced with a new property with the same name.

Within each shadow DOM realm, our decorator web component will only have an effect if an instance of the web component is plopped somewhere inside that shadow DOM.

Although it is a bit of a nuisance to remember to plop an instance in each shadow DOM realm, it does gives us the ability to avoid name conflicts with other libraries that use custom attributes.  In the example above, if we plop an instance inside the shadow DOM with no overrides: 

```html
<button be-a-butterbeer-counter='{"count": 30}'>Count</button>
...

<be-a-butterbeer-counter></be-a-butterbeer-counter>
```

then it will affect all buttons with attribute be-a-butterbeer-counter within that shadow DOM.

To specify a different attribute, override the default "ifWantsToBe" property thusly:

```html
<button be-a-b-c='{"count": 30}'>Count</button>
...

<be-a-butterbeer-counter if-wants-to-be=a-b-c></be-a-butterbeer-counter>
```

Another silver lining to this nuisance:  It provides more transparency where the behavior modification is coming from.

The [be-hive component](https://github.com/bahrus/be-hive) makes managing this nuisance in a better way.  If developing a component that uses more than a few decorators, it is probably worth the extra dependency.

## Setting properties of the proxy externally

Just as we need to be able to pass property values to custom elements, we need a way to do this with be-decorated elements.  But how?

The tricky thing about proxies is they're great if you have access to them, useless if you don't.  

###  Approach I.  Programmatically (Ugly, not guaranteed)

The instance of the decorator component sitting inside the Shadow DOM has a key to getting the controller class.  Assuming we've waited long enough:

```JavaScript
function getProxy(btn){
const proxy = shadowRoot.querySelector('be-a-butterbeer-counter').targetToController.get(btn).proxy;
}

```


###  Approach II. Setting properties via the controlling attribute:

A more elegant solution, perhaps, which xtal-decor supports, is to pass in properties via its custom attribute:

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

<ul id=list is-sorted='{"direction":"asc","nodeSelectorToSortOn":"span"}'>
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

A [vscode plug-in](https://marketplace.visualstudio.com/items?itemName=andersonbruceb.json-in-html) is available that makes editing JSON attributes like these much less susceptible to human fallibility.

### Approach III.  Integrate with other decorators -- binding decorators -- that hide the complexity

[be-observant](https://github.com/bahrus/be-observant) provides a pattern, and exposes some reusable functions, for "pulling-in" bindings from the host or neighboring siblings.  This can often be a sufficient and elegant way to deal with this concern.

## API

This web component base class builds on the provided api:

```JavaScript
import { upgrade } from 'xtal-decor/upgrade.js';
upgrade({
    shadowDOMPeer: ... //Apply trait to all elements within the same ShadowDOM realm as this node.
    upgrade: ... //CSS query to monitor for matching elements within ShadowDOM Realm.
    ifWantsToBe: // monitor for attributes that start with be-[ifWantsToBe], 
}, callback);
```

API example:

```JavaScript
import {upgrade} from 'xtal-decor/upgrade.js';
upgrade({
    shadowDOMPeer: document.body,
    upgrade: 'black-eyed-peas',
    ifWantsToBe: 'on-the-next-level',
}, target => {
    ...
});
```

The API by itself is much more open ended, as you will need to entirely define what to do in your callback.  In other words, the api provides no built-in support for creating a proxy and passing it to a controller.

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

## Debugging

Compared to working with custom elements, working with attribute-based decorators is more difficult, due to the issues mentioned above -- namely, the difficulty in getting a reference to the proxy.

But if the JSON attribute associated with a decorator has value "debug": true, then an adjacent debugging template element is inserted, that makes viewing the proxy and controller much easier.

In dev tools, after inspecting the element, just look for that adjacent template element, select it in the, and in the console, type $0.controller to show the class behind the behavior.

You should then be able to use the context menu to jump to the definition.  You can view virtual properties by typing $0.controller.[name of virtual property].  You can edit the value by typing $0.proxy.[name of virtual property] = "whatever you want."

## Primary prop [TODO]

Sometimes a decorator will only have a single, primitive-type property value to configure, at least for the time being.  Or maybe there are multiple props, but one property in particular is clearly the most important, and the other properties will rarely deviate from the default value.  In that case, the extra overhead from typing and parsing JSON just to read that value seems like overkill.  So we should have a way of defining a "primary" property, and just set it based on the string value, if the string value doesn't start with a { or a [

## Viewing example from git clone or git fork:

Install node.js.  Then, from a command prompt from the folder of your git clone or github fork:

```
$ npm install
$ npm run serve

Open http://localhost:3030/demo/dev.html
```






