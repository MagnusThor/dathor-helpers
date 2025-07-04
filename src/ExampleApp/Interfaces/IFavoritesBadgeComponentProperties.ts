import { IUIComponentPropertyBag } from "../../UI/Interfaces/IUIComponentPropertyBag";
import { IUIComponentState } from "../../UI/Interfaces/IUIComponentState";

/**
 * Properties for the CartBadgeComponent.
 */
export interface IFavoritesBadgeComponentProperties extends IUIComponentPropertyBag<any> {
    // No specific properties needed beyond IUIComponentPropertyBag for now,
    // as it mainly relies on internal state and event subscriptions.
}

export interface IFavoritesBadgeComponentState extends IUIComponentState {
    /** The current count of items in the cart (for the badge). */
    itemCount: number;
    /** Whether the badge should be visible (e.g., only if itemCount > 0). */
    isVisible: boolean;
}