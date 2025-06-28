

import DathorHelpers from "../helpers/all";
import { IGlobalAppState } from "./Interfaces/IGlobalAppState";
import { Effects } from "./Effects/Effects";
import { IUIComponentPropertyBag } from "./Interfaces/IUIComponentPropertyBag";
import { UIComponentBase } from "./UIComponent";

export class UIObservedComponent<TState extends object = any> extends UIComponentBase {
     public properties: IUIComponentPropertyBag<TState>;

    // Internal reference to the observed (proxied) state object
    private _observedStateInstance: TState; 

    /**
     * @param properties The properties bag for the component.
     * If `properties.state` is provided, it will be made reactive.
     */
    constructor(properties: IUIComponentPropertyBag<TState>) {
        // Assign properties before using it
        super(properties);
        this.properties = properties;
        // Ensure properties.state is an object if it's undefined
        if (!this.properties!.state) {
            this.properties!.state = {} as TState; // Initialize an empty object if no state was given
        }

        this._observedStateInstance = DathorHelpers.observeAll(this.properties!.state, this.handleStateChange.bind(this));
        
        this.properties!.state = this._observedStateInstance;

        this.subscribe('globalStateChanged', this.handleGlobalStateChange.bind(this));


        // Perform an initial re-render after the state is observed
        // This ensures the UI reflects the initial state immediately.
        // We use a microtask to ensure the DOM is ready for the first render.
        // Alternatively, if you're sure render will only be called once by ApplicationManager,
        // you can skip this immediate render here.
         this.handleStateChange(); 
    }

      handleGlobalStateChange(newData: IGlobalAppState): void {
        console.log(`[${this.properties?.id}] Global state updated:`, newData);
        // This component's own state doesn't need to be updated.
        // Its render method will directly read from `globalState.observedState`.
        // Trigger a re-render of THIS component
        // Since it's a UIObservedComponent, it already calls render on its own state change.
        // But if its *own* state isn't changing, and it depends on global state,
        // you explicitly need to re-render it.
        // This could be a good use case for Effects.reRender if its own state hasn't changed.
        // If you are relying on UIObservedComponent's built-in re-render, you might need to
        // make a dummy change to this.properties.state (e.g., `this.properties.state.lastGlobalUpdate = Date.now()`)
        // or ensure the global state change is reflected in its own state.
        // For simplicity, let's just trigger a re-render directly for this example:
        this.handleStateChange(); // Call the UIObservedComponent's re-render trigger
    }


    /**
     * Callback triggered by the state observer when the component's state (or any nested part) changes.
     * Initiates a re-render of the component.
     * This method is protected as it's an internal lifecycle handler for state changes.
     */
     async handleStateChange(): Promise<void> {
        console.log(`[${this.properties?.id || this.constructor.name}] State changed. Triggering re-render...`);
        await Effects.reRender(this);
    }

    /**
     * Overrides the dispose method to also clean up the observed state.
     */
    dispose(): void {
        console.log(`Disposing UIObservedComponent: ${this.properties?.id || 'Unnamed'}`);
        
        // Clean up: Dereference the observed state proxy to aid garbage collection.
        // Setting it to null allows the Proxy and its target object to be garbage collected
        // when the component itself is no longer referenced.
        this._observedStateInstance = null as any; // Cast to any to allow null assignment

        // Call the base class's dispose method for standard cleanup
        super.dispose();
    }

    // You can also override the render method here to enforce it for UIObservedComponent,
    // or let it be implemented by further subclasses.
    // async render(): Promise<IUIComponentRenderResult> {
    //     throw new Error("render() not implemented in UIObservedComponent. Please override in subclass.");
    // }
}