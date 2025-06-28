// Core/Interfaces/IRoute.ts

import { PageComponent } from "../Components/Core/PageComponent";
import { IPageComponentProperties } from "./IPageComponentProperties";


/**
 * Defines the structure for a single route in the application router.
 */
export interface IRoute {
    /**
     * The URL path pattern for this route (e.g., '/', '/products/:id').
     */
    path: string;
    /**
     * The constructor function for the PageComponent associated with this route.
     * The router will use this to create a new instance when the route matches.
     */
    component: new (properties: IPageComponentProperties<any>) => PageComponent<any>;
    /**
     * Optional default properties to be passed to the PageComponent constructor
     * when this route is activated. These will be merged with runtime properties
     * (like router instance, routeParams).
     * IMPORTANT: This must be typed as IPageComponentProperties, not IUIComponentPropertyBag.
     */
    defaultProps?: IPageComponentProperties<any>;
    
}