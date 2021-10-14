# be-decorated

be-decorated provides a base class which enables attaching ES6 proxies onto other "Shadow DOM peer citizens" -- native DOM or custom elements in the same Shadow DOM realm.

be-decorated provides a much more "conservative" alternative approach to enhancing existing DOM elements, in place of the controversial "is"-based customized built-in element [standard-ish](https://bkardell.com/blog/TheWalrus.html).

## Priors

be-decorate's goals are quite similar to what is achieved via things [commonly](https://vuejs.org/v2/guide/custom-directive.html) [referred](https://docs.angularjs.org/guide/directive) to as "custom directives."

Prior to that, there was the heretical [htc behaviors](https://en.wikipedia.org/wiki/HTML_Components).

Differences to these solutions:

1. This can be used independently of any framework (web component based).
2. Definition is class-based.
3. Applies exclusively within ShadowDOM realms.

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

```html
<script type=module>
import {ButterbeerController} from '[wherever]';
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

Within each shadow DOM realm, our decorator web component will only have an effective if an instance of the web component is plopped somewhere inside that ShadowDOM realm.

Although it is a bit of a nuisance to remember to plop an instance in each ShadowDOM realm, it does gives us the ability to avoid name conflicts with other libraries that use custom attributes.  In the example above, if we plop an instance inside the ShadowDOM with no overrides: 

```html
<button be-a-butterbeer-counter='{"count": 30}'>Count</button>
...

<be-a-butter-beer-counter></be-a-butter-beer-counter>
```

then it will affect all buttons with attribute be-a-butterbeer-counter.

To specify a different attribute, override the default "ifWantsToBe" property thusly:

```html
<button be-a-b-c='{"count": 30}'>Count</button>
...

<be-a-butter-beer-counter if-wants-to-be=a-b-c></be-a-butter-beer-counter>
```
