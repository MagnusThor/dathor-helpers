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
    // Tell UIComponentBase that its properties will be IPageComponentProperties<TState>
    extends UIComponentBase<TState, IPageComponentProperties<TState>> // <--- CRUCIAL CHANGE HERE!
    implements IPageComponent<TState>
{
    // No need to redeclare 'properties' here; it's correctly inherited from UIComponentBase
    // as IPageComponentProperties<TState> due to the extends clause above.

    /**
     * Initializes a new instance of the PageComponent.
     *
     * @param properties The properties bag for this page component, including router details.
     */
    constructor(properties: IPageComponentProperties<TState>) {
        super(properties); // Pass the page-specific properties directly to the base UIComponentBase constructor.

        // You can now safely access `this.properties.path`, `this.properties.router`, etc.
        // No optional chaining `?.` or non-null assertions `!` are needed for these
        // because IPageComponentProperties guarantees their presence.
        // You might keep these checks as defensive runtime assertions if external code
        // could bypass TypeScript:
        if (!this.properties.path) {
            console.warn(`[${this.properties.id}] PageComponent initialized without a 'path' property.`);
        }
        if (!this.properties.router) {
            console.error(`[${this.properties.id}] PageComponent initialized without a 'router' instance.`);
        }
    }

    // ... (rest of PageComponent methods remain the same)

    public async onEnter(prevProps?: IPageComponentProperties<TState>): Promise<void> {
        console.log(`[${this.properties.id}] Page entered. Path: ${this.properties.path}`);
        // ...
    }

    public onLeave(): void {
        console.log(`[${this.properties.id}] Page left.`);
        this.dispose();
    }

    // public abstract render(): Promise<IUIComponentRenderResult>;
}