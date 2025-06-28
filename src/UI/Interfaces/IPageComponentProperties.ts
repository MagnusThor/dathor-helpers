import { IPageState } from "./IPageState";
import { IUIComponentPropertyBag } from "./IUIComponentPropertyBag";
import { Router } from "../Router/Router";

/**
 * Defines the properties that all PageComponents receive.
 * It extends IUIComponentPropertyBag to inherit common UI component properties,
 * and adds page-specific properties like 'path', 'router', and 'routeParams'.
 */


export interface IPageComponentProperties<TState extends IPageState = IPageState> extends IUIComponentPropertyBag<TState> {
    /**
     * The original path pattern for the matched route (e.g., '/products/:id').
     */
    path: string;
    /**
     * The Router instance, allowing the page component to navigate programmatically.
     */
    router: Router;
    /**
     * An object containing key-value pairs for any dynamic route parameters
     * extracted from the URL (e.g., { id: '123' } for '/products/123').
     */
    routeParams?: { [key: string]: string; };
    /**
     * Optional: An object containing key-value pairs for query parameters
     * from the URL (e.g., { category: 'electronics' } for '?category=electronics').
     * (You would need to implement query param parsing in the Router).
     */
    queryParams?: { [key: string]: string; };
}
