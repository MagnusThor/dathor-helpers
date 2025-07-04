import { IPageComponent } from "../../Interfaces/IPageComponent";
import { IPageComponentProperties } from "../../Interfaces/IPageComponentProperties";
import { IPageState } from "../../Interfaces/IPageState";
import { UIComponentBase } from "../../UIComponent";

/**
 * Abstract base class for all application page components.
 * Provides common lifecycle methods and ensures correct property typing for pages.
 *
 * @template TState The specific state type for this page. Must extend IPageState.
 */
export abstract class PageComponent<TState extends IPageState = IPageState>
    extends UIComponentBase<TState, IPageComponentProperties<TState>>
    implements IPageComponent<TState>
{

    /**
     * Initializes a new instance of the PageComponent.
     *
     * @param properties The properties bag for this page component, including router details.
     */
    constructor(properties: IPageComponentProperties<TState>) {
        super(properties);

        if (!this.properties.path) {
            console.warn(`[${this.properties.id}] PageComponent initialized without a 'path' property.`);
        }
        if (!this.properties.router) {
            console.error(`[${this.properties.id}] PageComponent initialized without a 'router' instance.`);
        }
    }


    public async onEnter(prevProps?: IPageComponentProperties<TState>): Promise<void> {
        console.log(`[${this.properties.id}] Page entered. Path: ${this.properties.path}`);
       
    }

    public onLeave(): void {
        console.log(`[${this.properties.id}] Page left.`);
        this.dispose();
    }

}