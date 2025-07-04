import { UIComponentBase } from "../../../UI/UIComponent";
import {
  IFavoritesBadgeComponentState,
  IFavoritesBadgeComponentProperties,
} from "../../Interfaces/IFavoritesBadgeComponentProperties";

export class FavoritesBadgeComponent extends UIComponentBase<
  IFavoritesBadgeComponentState,
  IFavoritesBadgeComponentProperties
> {
  constructor(properties: IFavoritesBadgeComponentProperties) {
    super({
      ...properties,
      id: properties.id || "favorites-badge-component",
      name: properties.name || "FavoriesBadgeComponent",
      state: {
        itemCount: 0, // Initial state: no items
        isVisible: false, // Not visible initially
        ...properties.state, // Allow initial state override
      },
      template: (component: FavoritesBadgeComponent) => {
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
    console.log(`[${this.properties.id}] Subscribing to 'addToFavorites' events.`);
    // Subscribe to the 'addToCart' event published by AddToCartAction
    // The handler updates the component's state.
    this.subscribe("addToFavorites", this.handleEvent.bind(this));
    // You can also use eventBus.subscribe directly if your base UIComponent doesn't have a subscribe method.
    // eventBus.subscribe('addToCart', this.handleAddToCartEvent.bind(this));
  }
  /**
   * Called when the component is removed or becomes inactive.
   * This is where we clean up event subscriptions to prevent memory leaks.
   */
  public onLeave(): void {
    console.log(
      `[${this.properties.id}] Unsubscribing from 'addToFavorites' events.`
    );
    // Unsubscribe from the 'addToCart' event
    //this.unsubscribe('addToCart', this.handleAddToCartEvent.bind(this));
  }

  /**
   * Event handler for the 'addToCart' event.
   * @param payload The data sent with the event (e.g., { productId, quantity }).
   */
  private handleEvent(payload: {
    productId: string;
    quantity: number;
  }): void {
    console.log(
      `[${this.properties.id}] Received 'addToFavorites' event for product ${payload.productId}, quantity ${payload.quantity}.`
    );

    console.log(
      `[${this.properties.id}] Received 'addToFavorites' event for product ${payload.productId}, quantity ${payload.quantity}.`
    );

    const currentCount = this.getState().itemCount; // Get current state
    const newCount = currentCount + payload.quantity;

    this.setState({
      itemCount: newCount,
      isVisible: newCount > 0,
    });

   
  }
}
