import {define} from 'be-decorated/DE.js';
import {BeDecoratedProps} from 'be-decorated/types.js';
import {Actions, VirtualProps, Proxy, PP, ProxyProps} from 'be-committed/types';
import {register} from 'be-hive/register.js';

export class BeCommitted extends EventTarget implements Actions{

    clickableElementRef: WeakRef<HTMLElement> | undefined;
    intro(proxy: Proxy, target: HTMLInputElement, beDecorProps: BeDecoratedProps){
        console.log('intro');
        target.addEventListener('keyup', this.handleKeyup);
        proxy.resolved = true;
    }

    async onTo({to, proxy, nudge: n}: PP){
        console.log('onTo');
        const clickableElement = (proxy.getRootNode() as HTMLElement).querySelector('#' + to) as HTMLButtonElement;
        if(clickableElement === null){
            console.error('Unable to locate target ' + to);
            return;
        }
        if(n){
            const {nudge} = await import('trans-render/lib/nudge.js');
            nudge(proxy);
        }

        this.clickableElementRef = new WeakRef<HTMLElement>(clickableElement);
    }

    handleKeyup = (e: KeyboardEvent) => {
        if(e.key === 'Enter'){
            const clickableElement = this.clickableElementRef?.deref();
            if(clickableElement === undefined) return;
            e.preventDefault();
            clickableElement.click();
        }
    }

    async onNudge({self}: ProxyProps){
        
    }
}



const tagName = 'be-committed';
const ifWantsToBe = 'committed';
const upgrade = 'input';
define<VirtualProps & BeDecoratedProps<VirtualProps, Actions>, Actions>({
    config:{
        tagName,
        propDefaults:{
            virtualProps: ['to', 'nudge'],
            upgrade,
            ifWantsToBe,
            intro: 'intro',
            primaryProp: 'to'
        },
        actions:{
            'onTo': 'to',
            'onNudge': 'nudge'
        }
    },
    complexPropDefaults:{
        controller: BeCommitted
    }
});
register(ifWantsToBe, upgrade, tagName);