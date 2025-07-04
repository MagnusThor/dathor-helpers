// src/UI/Interfaces/IRepeaterComponentInterfaces.ts

import { IUIComponentPropertyBag } from "./IUIComponentPropertyBag";
import { UIComponentBase } from "../UIComponent";


// Define a type for the render function that creates a child component for each item.
// It's responsible for instantiating the child, rendering it into the provided container,
// and returning the component instance so RepeaterComponent can manage its lifecycle.
export type ComponentItemRenderer<T> = (
    item: T,                               // The data item (e.g., IMovie)
    containerElement: HTMLElement,         // The DOM element the item component should render into
    componentId: string,                   // A suggested unique ID for the item component
    context: any                           // Any additional context (e.g., router, services) from the Repeater's properties
) => Promise<UIComponentBase | null>;      // Returns the created component instance (or null on failure)

// Properties for the Generic Repeater Component
export interface IRepeaterComponentProperties<T> extends IUIComponentPropertyBag {
    items: T[];                             // The array of data items to repeat
    itemComponentRenderer: ComponentItemRenderer<T>; // The function to render each item as a component
    uniqueIdField: keyof T;                 // The field on 'T' that provides a unique ID for each item (e.g., 'id')
    cssClasses?: string;                    // Optional CSS classes for the repeater's main container (e.g., grid styles)
    itemContainerTag?: string;              // Optional HTML tag for each individual item's wrapper element (e.g., 'div', 'li')
    context?: any;                          // Optional: context object to pass to the itemComponentRenderer (e.g., { router: this.router })
}

// State for the Repeater Component (can be empty if no internal state is managed)
export interface IRepeaterComponentState {
    
}