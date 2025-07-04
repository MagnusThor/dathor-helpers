// src/UI/Interfaces/IAddToCartActionProperties.ts

import { IUIComponentPropertyBag } from "../../UI/Interfaces/IUIComponentPropertyBag";

/**
 * Properties for the AddToCartAction component.
 */
export interface IAddToFavoritesActionProperties extends IUIComponentPropertyBag<any> {
    /** The ID of the product to be added to the cart. */
    movieId: string;
    /** The quantity of the product to add. Defaults to 1. */
    rating?: number;
    /** The label text for the button. Defaults to "Add to Cart". */
    label?: string;
    /** Optional CSS classes to apply to the button. */
    buttonClasses?: string;
}