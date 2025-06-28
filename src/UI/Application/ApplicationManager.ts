import { $D } from "../../helpers/all";
import { IUIComponent } from "../Interfaces/IUIComponent";
import { Router } from "../Router/Router";
import { EventBus } from "./EventBus";
import { GlobalStateStore } from "./GlobalStateStore";


export const eventBus = EventBus.getInstance();

export const globalState = new GlobalStateStore({
    // Initial global state properties can go here
});

export class ApplicationManager {
    private rootComponent: IUIComponent;
    private targetElement: HTMLElement;
    private router: Router; // NEW: Private property to hold the Router instance

    /**
     * @param rootComponent The top-level UI component of your application.
     * @param router The Router instance responsible for navigation.
     * @param targetSelector The CSS selector for the DOM element where the app should be mounted.
     */
    constructor(rootComponent: IUIComponent, router: Router, targetSelector: string = 'body') { // MODIFIED: Added router parameter
        this.rootComponent = rootComponent;
        this.router = router; // NEW: Assign the router instance

        const target = $D.get<HTMLElement>(targetSelector);
        if (!target) {
            throw new Error(`Target element with selector '${targetSelector}' not found in the DOM.`);
        }
        this.targetElement = target;
    }

    /**
     * Renders the root component, mounts it to the target DOM element, and then starts the router.
     */
    async start(): Promise<void> {
        if (!this.rootComponent.render) {
            console.error("Application Manager: Root component does not have a render method defined.");
            return;
        }

        try {
            console.log("Application Manager: Starting render process for root component...");
            // Call the root component's render, which recursively renders its children
            const renderResult = await this.rootComponent.render();

            if (renderResult.result) {
                // Clear any existing content in the target element (e.g., initial loading spinner)
                this.targetElement.innerHTML = '';
                // Append the fully rendered component tree to the actual DOM
                this.targetElement.appendChild(renderResult.result);
                console.log("Application Manager: Root component rendered and mounted to DOM.");

                // NEW: Start the router *after* the root component (containing the router outlet)
                // has been successfully mounted to the DOM.
                console.log("Application Manager: Starting router...");
                this.router.start();
                console.log("Application Manager: Router started successfully.");

            } else {
                console.warn("Application Manager: Root component render result was undefined. Nothing mounted.");
            }
        } catch (error) {
            console.error("Application Manager: Error during rendering or router startup:", error);
        }
    }
}