import { IUIComponentPropertyBag } from "./IUIComponentPropertyBag";
import { IUIComponentRenderResult } from "./IUIComponentRenderResult";

/**
 * Represents a user interface component that can optionally render itself and contain child components.
 *
 * @remarks
 * - The `render` method, if implemented, should return a promise that resolves to a `UIComponentRenderResult`.
 * - The `childComponents` array holds any nested UI components.
 *
 * @property render - Optional asynchronous method to render the component.
 * @property childComponents - An array of child `UIComponent` instances.
 */

export interface IUIComponent<TProps extends IUIComponentPropertyBag<any> = IUIComponentPropertyBag<any>> {
    // The properties should now reflect the generic type TProps
    properties: TProps; // This property is no longer 'any' and will be guaranteed after construction.

    render?(): Promise<IUIComponentRenderResult>; // Optional render method for components that manage their own DOM
    childComponents: IUIComponent[]; // Children are also IUIComponent, recursively
    dispose(): void; // Lifecycle method for cleanup

    // The 'template' property is part of IUIComponentPropertyBag, so no need to redeclare it here.
    // It's accessed via this.properties.template
}