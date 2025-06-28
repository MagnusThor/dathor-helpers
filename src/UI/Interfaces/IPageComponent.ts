import { IUIComponent } from "./IUIComponent";
import { IPageComponentProperties } from "./IPageComponentProperties";
import { IPageState } from "./IPageState"; 

/**
 * Represents a component that functions as a navigable page in the application.
 * Extends IUIComponent to enforce properties defined in IPageComponentProperties.
 *
 * @template TState The specific state type for this page component.
 */
export interface IPageComponent<TState extends IPageState = IPageState> extends IUIComponent<IPageComponentProperties<TState>> {
    // You can optionally declare the lifecycle methods here if you want to ensure
    // any implementor of IPageComponent *must* have them, but the PageComponent
    // abstract class already provides default implementations.
    onEnter?(prevProps?: IPageComponentProperties<TState>): Promise<void>;
    onLeave?(): void;
}