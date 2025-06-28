// Effects.ts

import { $D } from "../../helpers/all";
import { UIComponentBase } from "../UIComponent";

export class Effects {
    /**
     * Re-renders a UIComponent and replaces its old DOM element with the new one.
     * This is a generic helper for the common re-render pattern.
     * @param component The UIComponentBase instance to re-render.
     * @returns A Promise that resolves when the re-render is complete.
     */
    public static async reRender(component: UIComponentBase): Promise<void> {
        if (!component.properties?.id) {
            console.warn(`[Effects.reRender] Cannot re-render component without an ID:`, component);
            return;
        }

        try {
            const oldElement = $D.get(`#${component.properties.id}`);
            if (oldElement) {
                const newRenderResult = await component.render();
                if (newRenderResult.result) {
                    oldElement.replaceWith(newRenderResult.result);
                    console.log(`[Effects.reRender] Component "${component.properties.id}" re-rendered successfully.`);
                }
            } else {
                console.warn(`[Effects.reRender] Old element not found for component "${component.properties.id}". Not re-rendered.`);
            }
        } catch (error) {
            console.error(`[Effects.reRender] Error re-rendering component "${component.properties.id}":`, error);
        }
    }

    /**
     * Updates the text content of a component's root element without re-rendering the whole component.
     * This assumes the component's root element directly contains the text.
     * Use with caution if the text is complex or part of a deeper structure.
     * @param component The UIComponentBase instance.
     * @param newText The new text content.
     */
    public static setText(component: UIComponentBase, newText: string): void {
        if (!component.properties?.id) {
            console.warn(`[Effects.setText] Cannot set text for component without an ID:`, component);
            return;
        }
        const element = $D.get(`#${component.properties.id}`);
        if (element) {
            element.textContent = newText;
            console.log(`[Effects.setText] Component "${component.properties.id}" text updated to: "${newText}".`);
        } else {
            console.warn(`[Effects.setText] Element not found for component "${component.properties.id}". Text not set.`);
        }
    }
    public static setHTML(component: UIComponentBase, html: string): void {
        if (!component.properties?.id) {
            console.warn(`[Effects.setHTML] Cannot set text for component without an ID:`, component);
            return;
        }

        const element = $D.get(`#${component.properties.id}`);
        if (element) {
            element.innerHTML = html;
        } else {
            console.warn(`[Effects.setText] Element not found for component "${component.properties.id}". Text not set.`);
        }

    }


    /**
     * Sets a data attribute on a component's root DOM element.
     * @param component The UIComponentBase instance.
     * @param key The data attribute key (e.g., 'active', 'count'). Will be prefixed with 'data-'.
     * @param value The value to set the data attribute to.
     */
    public static setDataAttribute(component: UIComponentBase, key: string, value: string | number | boolean): void {
        if (!component.properties?.id) {
            console.warn(`[Effects.setDataAttribute] Cannot set data attribute for component without an ID:`, component);
            return;
        }
        const element = $D.get(component.properties.id);
        if (element) {
            element.setAttribute(`data-${key}`, String(value));
            console.log(`[Effects.setDataAttribute] Component "${component.properties.id}" data-${key} set to: "${value}".`);
        } else {
            console.warn(`[Effects.setDataAttribute] Element not found for component "${component.properties.id}". Data attribute not set.`);
        }
    }


    public static addClass(component: UIComponentBase, className: string): void {
        if (!component.properties?.id) {
            console.warn(`[Effects.addClass] Cannot add class to component without an ID:`, component);
            return;
        }
        const element = $D.get(`#${component.properties.id}`);
        if (element) {
            element.classList.add(className);
            console.log(`[Effects.addClass] Component "${component.properties.id}" added class: "${className}".`);
        } else {
            console.warn(`[Effects.addClass] Element not found for component "${component.properties.id}". Class not added.`);
        }
    }

    /**
     * Removes a class from a component's root DOM element.
     * @param component The UIComponentBase instance.
     * @param className The class name to remove.
     */
    public static removeClass(component: UIComponentBase, className: string): void {
        if (!component.properties?.id) {
            console.warn(`[Effects.removeClass] Cannot remove class from component without an ID:`, component);
            return;
        }
        const element = $D.get(`#${component.properties.id}`);
        if (element) {
            element.classList.remove(className);
            console.log(`[Effects.removeClass] Component "${component.properties.id}" removed class: "${className}".`);
        } else {
            console.warn(`[Effects.removeClass] Element not found for component "${component.properties.id}". Class not removed.`);
        }
    }

    /**
     * Toggles a class on a component's root DOM element.
     * @param component The UIComponentBase instance.
     * @param className The class name to toggle.
     * @param force (Optional) If true, adds the class; if false, removes it.
     */
    public static toggleClass(component: UIComponentBase, className: string, force?: boolean): void {
        if (!component.properties?.id) {
            console.warn(`[Effects.toggleClass] Cannot toggle class on component without an ID:`, component);
            return;
        }
        const element = $D.get(`#${component.properties.id}`);
        if (element) {
            element.classList.toggle(className, force);
            console.log(`[Effects.toggleClass] Component "${component.properties.id}" toggled class: "${className}". Force: ${force}.`);
        } else {
            console.warn(`[Effects.toggleClass] Element not found for component "${component.properties.id}". Class not toggled.`);
        }
    }

    /**
     * Sets a generic attribute on a component's root DOM element.
     * @param component The UIComponentBase instance.
     * @param attrName The name of the attribute (e.g., 'title', 'aria-expanded').
     * @param value The value to set the attribute to.
     */
    public static setAttribute(component: UIComponentBase, attrName: string, value: string): void {
        if (!component.properties?.id) {
            console.warn(`[Effects.setAttribute] Cannot set attribute for component without an ID:`, component);
            return;
        }
        const element = $D.get(`#${component.properties.id}`);
        if (element) {
            element.setAttribute(attrName, value);
            console.log(`[Effects.setAttribute] Component "${component.properties.id}" attribute "${attrName}" set to: "${value}".`);
        } else {
            console.warn(`[Effects.setAttribute] Element not found for component "${component.properties.id}". Attribute not set.`);
        }
    }


    /**
    * Returns a chainable API for applying effects to a specific UIComponent's root DOM element.
    * This allows you to chain multiple DOM manipulations concisely.
    * @param component The UIComponentBase instance to target.
    * @returns An object with chainable methods.
    */
    public static for(component: UIComponentBase): IChainableEffects {
        if (!component.properties?.id) {
            console.warn(`[Effects.for] Cannot create chainable effects for component without an ID:`, component);
            // Return a no-op chainable object to prevent runtime errors
            const noOpApi: IChainableEffects = {
                addClass: () => noOpApi, removeClass: () => noOpApi,
                toggleClass: () => noOpApi, setText: () => noOpApi,
                setHTML: () => noOpApi, setDataAttribute: () => noOpApi,
                setAttribute: () => noOpApi,
                get element() { return null; }
            };
            return noOpApi;
        }

        const element = $D.get(`#${component.properties.id}`);
        if (!element) {
            console.warn(`[Effects.for] Element not found for component "${component.properties.id}". Chainable effects will be no-ops.`);
            // Return a no-op chainable object
            const noOpApi: IChainableEffects = {
                addClass: () => noOpApi, removeClass: () => noOpApi,
                toggleClass: () => noOpApi, setText: () => noOpApi,
                setHTML: () => noOpApi, setDataAttribute: () => noOpApi,
                setAttribute: () => noOpApi,
                get element() { return null; }
            };
            return noOpApi;
        }

        // Define the chainable API object
        const api: IChainableEffects = {
            addClass(className: string) {
                element.classList.add(className);
                console.log(`[Effects.for] Component "${component.properties?.id}" added class: "${className}".`);
                return api; // Return the API object for chaining
            },
            removeClass(className: string) {
                element.classList.remove(className);
                console.log(`[Effects.for] Component "${component.properties?.id}" removed class: "${className}".`);
                return api;
            },
            toggleClass(className: string, force?: boolean) {
                element.classList.toggle(className, force);
                console.log(`[Effects.for] Component "${component.properties?.id}" toggled class: "${className}". Force: ${force}.`);
                return api;
            },
            setText(newText: string) {
                element.textContent = newText;
                console.log(`[Effects.for] Component "${component.properties?.id}" text updated to: "${newText}".`);
                return api;
            },
            setHTML(html: string) {
                element.innerHTML = html;
                console.log(`[Effects.for] Component "${component.properties?.id}" HTML updated.`);
                return api;
            },
            setDataAttribute(key: string, value: string | number | boolean) {
                element.setAttribute(`data-${key}`, String(value));
                console.log(`[Effects.for] Component "${component.properties?.id}" data-${key} set to: "${value}".`);
                return api;
            },
            setAttribute(attrName: string, value: string) {
                element.setAttribute(attrName, value);
                console.log(`[Effects.for] Component "${component.properties?.id}" attribute "${attrName}" set to: "${value}".`);
                return api;
            },

            // Allows direct access to the resolved DOM element if needed
            get element(): HTMLElement | null {
                return element;
            }
        };

        return api;
    }



}

export interface IChainableEffects {
    addClass(className: string): IChainableEffects;
    removeClass(className: string): IChainableEffects;
    toggleClass(className: string, force?: boolean): IChainableEffects;
    setText(newText: string): IChainableEffects;
    setHTML(html: string): IChainableEffects;
    setDataAttribute(key: string, value: string | number | boolean): IChainableEffects;
    setAttribute(attrName: string, value: string): IChainableEffects;

    get element(): HTMLElement | null;
}
