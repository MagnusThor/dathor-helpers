import { FooterComponent } from "../../../ExampleApp/Components/Footer/FooterComponent";
import { HeaderComponent } from "../../../ExampleApp/Components/Header/HeaderComponent";
import { IUIComponentPropertyBag } from "../../Interfaces/IUIComponentPropertyBag";
import { IUIComponentRenderResult } from "../../Interfaces/IUIComponentRenderResult";
import { Router } from "../../Router/Router";
import { serviceLocator } from "../../Service/ServiceLocator";
import { UIComponentBase } from "../../UIComponent";
import { RouterOutletComponent } from "./RouterOutletComponent";


const RootUIComponentTemplate = (component: RootUIComponent): string => /*html*/`
    <div class="app-container min-h-screen flex flex-col">
        <div id="${component.properties.id}-header-container"></div>         
        <main id="main-content" class="flex-grow container mx-auto p-4">
        </main>    
        <div id="notifications-container"></div> 
        <div id="${component.properties.id}-footer-container"></div>
    </div>
`;

export class RootUIComponent extends UIComponentBase {
    private _isRendered: boolean = false;
    private _onRenderedCallbacks: (() => void)[] = [];
    constructor(properties: IUIComponentPropertyBag<{}>) {
        super({
            ...properties,
            template: RootUIComponentTemplate
        });
        
        this.childComponents.push(new RouterOutletComponent({ 
            id: 'main-router-outlet', 
            targetSelector: '#main-content', 
            outletId:"#main-content"
        }));


        console.log(`[${this.properties.id}] RootUIComponent initialized.`);
    }

    public async render(): Promise<IUIComponentRenderResult> {
        const renderResult = await super.render();
        if (renderResult.result) {
            this._isRendered = true;
            this._onRenderedCallbacks.forEach(callback => callback());
            this._onRenderedCallbacks = []; 
        }
        return renderResult;
    }

    public onRendered(callback: () => void): void {
        if (this._isRendered) {
            callback();
        } else {
            this._onRenderedCallbacks.push(callback);
        }
    }
}