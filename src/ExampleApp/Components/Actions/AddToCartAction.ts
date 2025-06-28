// src/UI/Components/Actions/AddToCartAction.ts

import { UIComponentBase } from "../../../UI/UIComponent";
import { IAddToCartActionProperties } from "../../Interfaces/IAddToCartActionProperties";

/**
 * A component representing an "Add to Cart" button.
 * It publishes an event when clicked.
 */
export class AddToCartAction extends UIComponentBase<any, IAddToCartActionProperties> {

    constructor(properties: IAddToCartActionProperties) {
        super({
            ...properties,
            id: properties.id || `add-to-cart-${properties.productId}`, // Ensure a unique ID
            name: properties.name || 'AddToCartAction',
            template: (component: AddToCartAction) => {
                const props = component.properties;
                const label = props.label || "Add to Cart";
                const buttonClasses = props.buttonClasses || "bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200";

                return /*html*/`
                    <button class="${buttonClasses}" data-event-click="handleAddToCart">
                        ${label}
                    </button>
                `;
            },
            eventHandlers: {
                click: (event: Event) => {
                    const target = event.target as HTMLElement;
                    if (target.dataset.eventClick === 'handleAddToCart') {
                        this.handleAddToCart(event);
                    }
                }
            }
        });

        // Set default quantity if not provided
        if (this.properties.quantity === undefined || this.properties.quantity === null) {
            this.properties.quantity = 1;
        }
    }

    /**
     * Handles the click event for the "Add to Cart" button.
     * Publishes an 'addToCart' event via the event bus.
     */
    public handleAddToCart(event: Event): void {
        event.preventDefault(); // Prevent default button behavior if it's inside a form

        console.log(`[${this.properties.id}] Adding product ${this.properties.productId} (Qty: ${this.properties.quantity}) to cart.`);

        // Publish an event that other parts of the application (e.g., a CartService) can listen to
        this.publish('addToCart', {
            productId: this.properties.productId,
            quantity: this.properties.quantity
        });

    }

    // You can add onEnter/onLeave if needed for this action component,
    // though typically simple action components don't require them.
}