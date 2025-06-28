import { $D } from "../helpers/all";
import { IActiveEventListener } from "./Interfaces/IActiveEventListener";
import { IComponentSubscription } from "./Interfaces/IComponentSubscription";
import { IUIComponent } from "./Interfaces/IUIComponent";
import { IUIComponentPropertyBag } from "./Interfaces/IUIComponentPropertyBag";
import { eventBus } from "./Application/ApplicationManager";
import { IGlobalAppState } from "./Interfaces/IGlobalAppState";
import { IUIComponentRenderResult } from "./Interfaces/IUIComponentRenderResult";


export abstract class UIComponentBase<
    TState extends object = any,
    TProps extends IUIComponentPropertyBag<TState> = IUIComponentPropertyBag<TState>
> implements IUIComponent<TProps>{

 childComponents: IUIComponent[];
    private _activeSubscriptions: IComponentSubscription[];
    private _activeEventListeners: IActiveEventListener[];
    protected uuid: string; // Made required as it's always assigned
    protected _element: HTMLElement | null = null;

    // The 'properties' member is now correctly typed and always present after the constructor.
    public properties: TProps;
    private _parent: IUIComponent | undefined;


  
        constructor(properties: TProps) {
        this.properties = properties;

        // Ensure state is initialized, still using TState for the state part
        if (!this.properties.state) {
            this.properties.state = {} as TState;
        }

        this.childComponents = [];
        this._activeEventListeners = [];
        this._activeSubscriptions = [];
        this.uuid = properties.id || crypto.randomUUID();
        this._parent = undefined;

        this.subscribe('globalStateChanged', this.handleGlobalStateChange.bind(this));
    }


    /**
     * Handles updates to the global application state.
     *
     * @param newData - The updated global application state.
     */
    public handleGlobalStateChange(newData: IGlobalAppState): void {
        console.log(`[${this.properties?.id}] Global state updated:`, newData);
    }

    async handleStateChange(): Promise<void> {

    }

    /**
     * Adds a child UIComponent to this component's list of child components.
     *
     * @param component - The UIComponent instance to add as a child.
     */
    addChild(component: IUIComponent): void {
        this.childComponents.push(component);
        if (component instanceof UIComponentBase) {
            component._parent = this;
        }
    }

    addChilds(components: IUIComponent[]): void {
        return components.forEach(component => {
            this.addChild(component);
        });
    }

    /**
       * Subscribes the component to a specific event topic on the global EventBus.
       * The component's ID is automatically passed for targeted messaging.
       * @param topic The name of the event topic.
       * @param action The callback function to execute when the event is published.
       */
    subscribe(topic: string, action: (...args: any[]) => void): void {
        if (!this.properties?.id) {
            console.warn(`[${this.constructor.name}] Cannot subscribe to topic "${topic}" without an ID. Subscription ignored.`);
            return;
        }
        const boundAction = action.bind(this);
        eventBus.subscribe(topic, boundAction, this.properties.id);
        this._activeSubscriptions.push({ topic, action: boundAction });
    }

    /**
     * Publishes data to a specific event topic on the global EventBus for all subscribers.
     * @param topic The name of the event topic.
     * @param data The data to be passed to the subscribers.
     */
    publish<T>(topic: string, data?: T): void {
        eventBus.publish(topic, data);
    }

    /**
   * Publishes data to a specific event topic, targeting ONLY a component with the given ID.
   * @param targetComponentId The ID of the component that should receive the message.
   * @param topic The name of the event topic.
   * @param data The data to be passed to the target component's subscriber.
   */
    publishTo<T>(targetComponentId: string, topic: string, data?: T): void {
        eventBus.publishTo(targetComponentId, topic, data);
    }

    /**
     * Converts an HTML fragment string into a DOM element.
     *
     * @param html - The HTML to convert.
     * @returns The resulting DOM element.
     */
    toHTMLElement(html: string) {
        return $D.toDOM(html);
    }

    /**
         * Performs a querySelector on the component's own root DOM element.
         * This allows querying for elements *within* the component's specific rendered output.
         * The component must be rendered and attached to the DOM for this to find elements.
         * @param selector The CSS selector string.
         * @returns The first matching HTMLElement within the component's root, or null.
         */
    querySelector<T extends HTMLElement = HTMLElement>(selector: string): T | null {
        if (!this.properties?.id) {
            console.warn(`[${this.constructor.name}] querySelector: Cannot query without a component ID. Selector: "${selector}"`);
            return null;
        }

        // Get the component's *own root element* using its ID.
        // This is the element that contains all the HTML rendered by *this* component.
        const componentRootElement = $D.get<HTMLElement>(`#${this.properties.id}`);

        if (componentRootElement) {
            // Perform the query *within* the component's own root element
            return $D.get<T>(selector, componentRootElement);
        }

        console.warn(`[${this.constructor.name}] querySelector: Component root element (ID: "${this.properties.id}") not found in DOM. Cannot query. Selector: "${selector}"`);
        return null;
    }

    /**
     * Performs a querySelectorAll on the component's own root DOM element.
     * This allows querying for elements *within* the component's specific rendered output.
     * The component must be rendered and attached to the DOM for this to find elements.
     * @param selector The CSS selector string.
     * @returns An array of matching HTMLElements within the component's root, or an empty array.
     */
    querySelectorAll<T extends HTMLElement = HTMLElement>(selector: string): T[] {
        if (!this.properties?.id) {
            console.warn(`[${this.constructor.name}] querySelectorAll: Cannot query without a component ID. Selector: "${selector}"`);
            return [];
        }
        const componentRootElement = $D.get<HTMLElement>(`#${this.properties.id}`);
        if (componentRootElement) {
            return $D.getAll(selector, componentRootElement) as T[];
        }
        console.warn(`[${this.constructor.name}] querySelectorAll: Component root element (ID: "${this.properties.id}") not found in DOM. Cannot query. Selector: "${selector}"`);
        return [];
    }

      // --- Core Render Method (Default Implementation) ---
    // This is no longer abstract. Subclasses can override it.
    public async render(): Promise<IUIComponentRenderResult> {
        const html = this.getTemplateHtml();

        if (html === null) {
            // If no template is provided, return an empty result or throw an error
            // depending on desired behavior for components without templates.
            console.warn(`[${this.properties.id}] Component has no template and no custom render method.`);
            return { result: document.createElement('div') }; // Return an empty div
        }

        const element = this.toHTMLElement(html) as HTMLElement; // Assume single root for _applyCommonElementProperties
        this._applyCommonElementProperties(element);

        this._element = element; // Store reference to the root element

        return { result: element };
    }


    /**
     * Traverses the component's child hierarchy (depth-first) and executes a callback for each component.
     *
     * @param callback - The function to execute for each component.
     * If the callback returns `false`, the traversal will stop.
     * @returns `true` if the traversal completed, `false` if it was stopped by the callback.
     */
    traverse(callback: (component: IUIComponent) => boolean | void): boolean {
        // Process current component (optional, depending on if you want to include self in traversal)
        // For typical child traversal, we start with children.
        for (const child of this.childComponents) {
            if (callback(child) === false) {
                return false; // Stop traversal if callback returns false
            }
            // Recursively traverse children's children
            if (child instanceof UIComponentBase && !child.traverse(callback)) {
                return false; // Propagate stop signal from deeper traversal
            }
        }
        return true; // Traversal completed
    }

    /**
     * Finds the first descendant UIComponent that satisfies the given predicate.
     * Performs a depth-first search.
     *
     * @param predicate - A function that returns `true` if the component is the one being searched for.
     * @returns The first `UIComponent` that satisfies the predicate, or `undefined` if not found.
     */
    find(predicate: (component: IUIComponent) => boolean): IUIComponent | undefined {
        let foundComponent: IUIComponent | undefined = undefined;
        this.traverse((component) => {
            if (predicate(component)) {
                foundComponent = component;
                return false; // Stop traversal once found
            }
            return true; // Continue traversal
        });

        return foundComponent;
    }

    /**
     * Finds a child component by its ID.
     *
     * @param id The ID of the component to find.
     * @returns The component with the matching ID, or `undefined` if not found.
     */
    findById(id: string): IUIComponent | undefined {
        return this.find(component => component.properties?.id === id);
    }

    /**
         * Helper method to append a child's rendered DOM to the correct location within the parent's DOM.
         * It uses the child's properties.targetSelector if provided, otherwise appends to the parent's root element.
         * This method is intended to be called by parent components within their own render method.
         *
         * @param parentRenderedElement The DOM element or DocumentFragment representing the parent component's own rendered output.
         * @param childComponent The child UIComponent instance whose rendered output is being appended.
         * @param childRenderedElement The DOM element or DocumentFragment representing the child component's rendered output.
         */
    protected _appendChildToParentDom(
        parentRenderedElement: HTMLElement | DocumentFragment,
        childComponent: IUIComponent,
        childRenderedElement: HTMLElement | DocumentFragment
    ): void {
        const targetSelector = childComponent.properties?.targetSelector;
        let appendTarget: HTMLElement | DocumentFragment = parentRenderedElement; // Default target is parent's root

        // If a targetSelector is provided AND the parent's element is an HTMLElement (DocumentFragment doesn't have querySelector)
        if (targetSelector && parentRenderedElement instanceof HTMLElement) {
            const foundTarget = parentRenderedElement.querySelector(targetSelector);
            if (foundTarget instanceof HTMLElement) {
                appendTarget = foundTarget; // Found the specific target element
            } else {
                console.warn(
                    `[${this.properties?.id || 'Unnamed Parent'}] Target selector "${targetSelector}" ` +
                    `for child "${childComponent.properties?.id || 'Unnamed Child'}" not found within parent's rendered DOM. ` +
                    `Appending to parent's root element (ID: ${parentRenderedElement.id || 'N/A'}) instead.`
                );
            }
        } else if (targetSelector && !(parentRenderedElement instanceof HTMLElement)) {
            console.warn(
                `[${this.properties?.id || 'Unnamed Parent'}] Target selector "${targetSelector}" ` +
                `for child "${childComponent.properties?.id || 'Unnamed Child'}" was provided, but parent's rendered element is a DocumentFragment. ` +
                `Selectors cannot be used directly on DocumentFragments. Appending to DocumentFragment directly.`
            );
        }

        appendTarget.appendChild(childRenderedElement);
    }

    /**
     * Renders all direct child components and appends their results to the specified parent DOM element.
     * This method is intended to be called by concrete component's render methods.
     *
     * @param parentRenderedElement The DOM element or DocumentFragment representing the parent component's own rendered output.
     * Children will be appended within this element based on their targetSelector.
     */
    protected async _renderAndAppendChildren(parentRenderedElement: HTMLElement | DocumentFragment): Promise<void> {
        // 1. Gather all child render promises
        const childRenderPromises = this.childComponents
            .filter(child => child.render) // Only process children that have a render method
            .map(child => child.render!()); // Call render and get the promise for each child

        // 2. Wait for all children to render concurrently
        const childRenderResults = await Promise.all(childRenderPromises);

        // 3. Iterate over the results and append each child's rendered DOM
        childRenderResults.forEach((childResult, index) => {
            const childComponent = this.childComponents[index]; // Get the original child component instance
            if (childResult?.result) {
                // Use the helper to append to the correct slot within the parent's DOM
                this._appendChildToParentDom(parentRenderedElement, childComponent, childResult.result);
            }
        });
    }

    /**
    * Helper to safely add an event listener and track it for disposal.
    * @param element The DOM element to attach the listener to.
    * @param eventName The name of the event (e.g., 'click', 'change').
    * @param handler The event handler function.
    */
    protected _addTrackedEventListener(element: EventTarget, eventName: string, handler: (event: Event) => void): void {
        element.addEventListener(eventName, handler);
        this._activeEventListeners.push({ element, eventName, handler });
    }

    /**
    * Applies common properties (data attributes, event handlers) to a component's root DOM element.
    * This method is intended to be called by concrete component's render methods.
    *
    * @param element The HTMLElement that is the root of the component's own rendered output.
    */
    protected _applyCommonElementProperties(element: HTMLElement): void {
        if (this.properties?.state) {
            for (const key in this.properties.state) {
                if (Object.prototype.hasOwnProperty.call(this.properties.state, key)) {
                    element.setAttribute(`data-${key}`, String(this.properties.state[key]));
                }
            }
        }
        if (this.properties?.eventHandlers) {
            for (const eventName in this.properties.eventHandlers) {
                if (Object.prototype.hasOwnProperty.call(this.properties.eventHandlers, eventName)) {
                    const handler = this.properties.eventHandlers[eventName];
                    this._addTrackedEventListener(element, eventName, handler);
                }
            }
        }
    }

    dispose(): void {
        console.log(`Disposing component: ${this.properties?.id || 'Unnamed'}`);

        // Unsubscribe all EventBus subscriptions made by this component
        this._activeSubscriptions.forEach(sub => {
            if (this.properties?.id) {
                eventBus.unsubscribe(sub.topic, sub.action, this.properties.id); // Pass component's ID for unsubscribe!
            } else {
                console.warn(`[${this.constructor.name}] Cannot unsubscribe from topic "${sub.topic}" without an ID.`);
            }
        });
        this._activeSubscriptions = [];

        // Remove all DOM event listeners attached by this component
        this._activeEventListeners.forEach(listener => {
            listener.element.removeEventListener(listener.eventName, listener.handler);
        });
        this._activeEventListeners = [];

        // Recursively dispose of child components
        this.childComponents.forEach(child => {
            if (child instanceof UIComponentBase) { // Ensure it's a UIComponentBase instance to call its dispose
                child.dispose();
            }
        });
    }
    /**
   * Retrieves the direct logical parent UIComponent of this component.
   * This method allows a child component to access its parent in the component hierarchy.
   * @returns The parent UIComponent, or `undefined` if this is a root component.
   */
    parent<T extends IUIComponent = IUIComponent>(): T | undefined {
        return this._parent as T; // Cast to the expected parent type for convenience
    }


    /**
     * Retrieves the HTML template for the component.
     *
     * If the `template` property exists in `this.properties` and is a function,
     * it invokes the function with the current instance and returns the resulting HTML string.
     * If the `template` property exists but is not a function, a warning is logged and `null` is returned.
     * If the `template` property does not exist, `null` is returned.
     *
     * @returns {string | null} The HTML template string, or `null` if not available or invalid.
     */
    protected getTemplateHtml(): string | null {
        if (this.properties?.template) {
            if (typeof this.properties.template === 'function') {
                return (this.properties.template as (instance: any) => string)(this);
            } else {
                console.warn(`[${this.properties.id || this.constructor.name}] Template property is not a function, found:`, typeof this.properties.template);
                return null;
            }
        }
        return null;
    }




    // NEW: Method to handle re-rendering the component
    protected async reRender(): Promise<void> {
        // Only attempt to re-render if the component has been initially rendered
        // and is currently attached to the DOM.
        if (this._element && this._element.parentNode) {
            const oldElement = this._element; // Store reference to the current DOM element
            const parent = oldElement.parentNode; // Store reference to its parent

            try {
                // Call the main render logic which will generate new HTML based on current state/properties
                const renderResult = await this.render();
                const newElement = renderResult.result;

                if (newElement && parent) {
                    // Replace the old DOM element with the newly rendered one
                    parent.replaceChild(newElement, oldElement);

                    if (newElement instanceof HTMLElement) {
                        this._element = newElement; // Update the internal reference to the new DOM element
                    } else {
                        this._element = null;
                        console.warn(`[${this.properties?.id || this.constructor.name}] New element is not an HTMLElement. Internal _element set to null.`);
                    }

                    console.log(`[${this.properties?.id || this.constructor.name}] Component re-rendered and DOM updated.`);
                } else if (!newElement) {
                    console.warn(`[${this.properties?.id || this.constructor.name}] Re-render failed: New element was not generated.`);
                } else { // parent is null, meaning oldElement was detached before re-render could replace it
                    console.warn(`[${this.properties?.id || this.constructor.name}] Re-render aborted: Old element was detached from DOM.`);
                }
            } catch (error) {
                console.error(`[${this.properties?.id || this.constructor.name}] Error during re-render:`, error);
            }
        } else if (this._element) {
            // If _element exists but has no parent, it means it's not in the DOM.
            // Re-rendering in this case just updates _element internally, but won't show on screen.
            console.warn(`[${this.properties!.id || this.constructor.name}] Re-render called but component is not currently in the DOM. Updating internal element only.`);
            await this.render(); // Still call render to update the internal _element state
        } else {
            console.warn(`[${this.properties!.id || this.constructor.name}] Re-render called before initial render or after dispose. No action taken.`);
        }
    }

    protected updateState(newState: Partial<TState>): void {
        // Merge the new state with the existing state
        // Using 'as TState' to assert the final type after merging
        this.properties!.state = { ...this.properties!.state, ...newState } as TState;
        console.log(`[${this.properties!.id || this.constructor.name}] State updated:`, this.properties!.state);

        // Trigger a re-render of the component to reflect the state changes
        this.reRender();
    }



}


