import { UIComponentBase } from "../../UI/UIComponent";
import {
  ICartBadgeComponentState,
  ICartBadgeComponentProperties,
} from "../Interfaces/ICartBadgeComponentProperties";

export class CartBadgeComponent extends UIComponentBase<
  ICartBadgeComponentState,
  ICartBadgeComponentProperties
> {
  constructor(properties: ICartBadgeComponentProperties) {
    super({
      ...properties,
      id: properties.id || "cart-badge-component",
      name: properties.name || "CartBadgeComponent",
      state: {
        itemCount: 0, // Initial state: no items
        isVisible: false, // Not visible initially
        ...properties.state, // Allow initial state override
      },
      template: (component: CartBadgeComponent) => {
         const state = component.getState(); 
        if (!state.isVisible || state.itemCount <= 0) {
          return /*html*/ `<div id="${component.properties.id}" class="hidden"></div>`;
        }
        // Basic badge styling with Tailwind CSS
        return /*html*/ `
                    <div id="${component.properties.id}" class="relative inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 border-2 border-white rounded-full -top-2 -right-2">
                        ${state.itemCount}
                    </div>
                `;
      },
    });
  }

  /**
   * Called when the component is first created/entered or becomes active.
   * This is where we set up event subscriptions.
   */
  public async onEnter(): Promise<void> {
    await super.onEnter(); // IMPORTANT: Call super.onEnter() first!
    console.log(`[${this.properties.id}] Subscribing to 'addToCart' events.`);
    // Subscribe to the 'addToCart' event published by AddToCartAction
    // The handler updates the component's state.
    this.subscribe("addToCart", this.handleAddToCartEvent.bind(this));
    // You can also use eventBus.subscribe directly if your base UIComponent doesn't have a subscribe method.
    // eventBus.subscribe('addToCart', this.handleAddToCartEvent.bind(this));
  }
  /**
   * Called when the component is removed or becomes inactive.
   * This is where we clean up event subscriptions to prevent memory leaks.
   */
  public onLeave(): void {
    console.log(
      `[${this.properties.id}] Unsubscribing from 'addToCart' events.`
    );
    // Unsubscribe from the 'addToCart' event
    //this.unsubscribe('addToCart', this.handleAddToCartEvent.bind(this));
  }

  /**
   * Event handler for the 'addToCart' event.
   * @param payload The data sent with the event (e.g., { productId, quantity }).
   */
  private handleAddToCartEvent(payload: {
    productId: string;
    quantity: number;
  }): void {
    console.log(
      `[${this.properties.id}] Received 'addToCart' event for product ${payload.productId}, quantity ${payload.quantity}.`
    );

    console.log(
      `[${this.properties.id}] Received 'addToCart' event for product ${payload.productId}, quantity ${payload.quantity}.`
    );

    // --- FIX IS HERE: Calculate new state, then pass it directly to updateState ---
    const currentCount = this.getState().itemCount; // Get current state
    const newCount = currentCount + payload.quantity;




    // Update the state based on the event data
    this.setState({
      itemCount: newCount,
      isVisible: newCount > 0,
    });
  }
}
