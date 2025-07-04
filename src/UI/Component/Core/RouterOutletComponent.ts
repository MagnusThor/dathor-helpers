
import { IPageComponent } from "../../Interfaces/IPageComponent";
import { IPageState } from "../../Interfaces/IPageState";
import { IRouterOutletProperties } from "../../Interfaces/IRouterOutletProperties";
import { IUIComponentRenderResult } from "../../Interfaces/IUIComponentRenderResult";
import { Router } from "../../Router/Router";
import { UIComponentBase } from "../../UIComponent";


export class RouterOutletComponent extends UIComponentBase<any, IRouterOutletProperties> {
    private _activePageComponent: IPageComponent<any> | null = null;
    private _outletElement: HTMLElement | null = null;
    constructor(properties: IRouterOutletProperties) {
        super(properties);
        if (!this.properties.targetSelector) {
            throw new Error("RouterOutletComponent requires an 'targetSelector' property.");
        }
    }

    async render(): Promise<IUIComponentRenderResult> {
        return new Promise<IUIComponentRenderResult>(resolve => {
            const html =`
                <div id="${this.properties.outletId}" class="router-outlet">
                </div>
            `;
            const element = this.toHTMLElement(html) as HTMLElement;
            this._applyCommonElementProperties(element);
            this._outletElement = element;
            resolve({ result: element });
        });
    }

    /**
     * Loads and displays a new page component in the router outlet.
     * This method assumes `newPageComponent` is an instance of `PageComponent` (or something that implements `IPageComponent`).
     *
     * @param newPageComponent The new page component instance to load.
     * @param prevPageComponent The previous page component instance (optional, for onLeave/onEnter logic).
     */
    public async loadPageComponent(
        newPageComponent: IPageComponent<IPageState>,
        prevPageComponent?: IPageComponent<IPageState>
    ): Promise<void> {
        if (this._activePageComponent) {
            if (this._activePageComponent.onLeave) {
                this._activePageComponent.onLeave();
            }
            this._activePageComponent.dispose();
            if (this._outletElement) {
                this._outletElement.innerHTML = '';
            }
        }

        this._activePageComponent = newPageComponent;

        if (this._outletElement) {
            try {
                const renderResult = await newPageComponent.render!();
                if (renderResult.result) {
                    this._outletElement.appendChild(renderResult.result);
                }
            } catch (error) {
                console.error(`Error rendering new page component ${newPageComponent.properties.id}:`, error);
                return;
            }
        } else {
            console.error(`RouterOutletComponent: Outlet element with ID "${this.properties.outletId}" not found for rendering.`);
            return;
        }


        if (newPageComponent.onEnter) {
            const router: Router = newPageComponent.properties.router;
            console.log(`RouterOutlet: Navigating to page ${newPageComponent.properties.path}. Router instance:`, router);

            await newPageComponent.onEnter(prevPageComponent?.properties);
        } else {
            console.warn(`PageComponent ${newPageComponent.properties.id} does not have an onEnter method.`);
        }
    }
}