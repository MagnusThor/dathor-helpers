/**
 * A collection of static utility methods for DOM manipulation and traversal.
 * * NOTE: Internal calls use the class name (e.g., DOMHelpers.get) to avoid 
 * circular dependency issues with the aggregated DathorHelpers object.
 */
export class DOMHelpers {

    /**
     * Sets or gets the value of an HTML input element selected by the given selector.
     * @template T - The type of the value to be returned.
     * @param {string} selector - The CSS selector to find the HTML input element.
     * @param {any} [value] - The value to set for the input element. If not provided, the current value of the input element will be returned.
     * @returns {T | null} - The value of the input element cast to type T, or null if the element is not found.
     */
    static value<T>(selector: string, value?: any) {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const element = DOMHelpers.get<HTMLInputElement>(selector);
        if (value && element) element!.value = value;
        return element ? element.value as T : null;
    }

    /**
     * Retrieves an element from the DOM based on the provided selector.
     * @template T - The type of the HTMLElement to be returned.
     * @param {string} selector - The CSS selector to match the desired element.
     * @param {Element | DocumentFragment | null} [parent] - The parent element or document fragment to search within.
     * @returns {T | null} - The matched element of type T, or null if no element is found.
     */
    static get<T extends HTMLElement>(selector: string, parent?: Element | DocumentFragment | null): T | null {
        if (!parent) {
            return document.querySelector(selector) as T | null;
        }
        return parent.querySelector(selector) as T | null;
    }

    /**
   * Filters elements based on a selector within a set of parent elements.
   * @param {string} filterSelector - The CSS selector to filter elements.
   * @param {HTMLElement | HTMLElement[]} parents - The parent element(s) to search within.
   * @returns {HTMLElement[]} - An array of filtered elements.
   */
    static filter(filterSelector: string, parents: HTMLElement | HTMLElement[]): HTMLElement[] {
        if (!parents) {
            return [];
        }

        if (Array.isArray(parents)) {
            // Note: This needs to be checked for correctness; usually flatMap is used on the array of parents
            return parents.flatMap(parent => Array.from(parent.querySelectorAll(filterSelector)) as HTMLElement[]);
        } else {
            return Array.from(parents.querySelectorAll(filterSelector)) as HTMLElement[];
        }
    }

    /**
     * Retrieves all elements that match the specified CSS selector.
     * @param selector - The CSS selector to match elements against.
     * @param parent - Optional. The parent element or document fragment to search within.
     * @returns An array of elements that match the specified selector.
     */
    static getAll(selector: string, parent?: Element | DocumentFragment): Element[] {
        const queryResult = parent ? parent.querySelectorAll(selector) : document.querySelectorAll(selector);
        return Array.from(queryResult);
    }

    /**
     * Replaces an old HTML element with a new HTML element.
     * @param oldElement - The existing HTML element to be replaced.
     * @param newElement - The new HTML element to replace the old element with.
     */
    static replace(oldElement: HTMLElement, newElement: HTMLElement) {
        oldElement.replaceWith(newElement);
    }

    /**
     * Adds an event listener to multiple elements specified by a selector or a list of elements.
     * @template T - The type of the elements, extending HTMLElement.
     * @param {string} event - The event type to listen for.
     * @param {string | NodeListOf<T> | T[]} selectorOrElements - A CSS selector string, a NodeList of elements, or an array of elements.
     * @param {(event?: Event, el?: T) => void} fn - The callback function.
     * @param {AddEventListenerOptions} [options] - Optional options object.
     * @param {HTMLElement | DocumentFragment | null} [parentEl] - Optional parent element to query the selector within.
     * @returns {void}
     */
    static onAll<T extends HTMLElement>(
        event: string,
        selectorOrElements: string | NodeListOf<T> | T[],
        fn: (event?: Event, el?: T) => void,
        options?: AddEventListenerOptions,
        parentEl?: HTMLElement | DocumentFragment | null
    ): void {
        let elements: NodeListOf<T> | T[];
        if (typeof selectorOrElements === "string") {
            elements = parentEl
                ? parentEl.querySelectorAll(selectorOrElements) as NodeListOf<T>
                : document.querySelectorAll(selectorOrElements) as NodeListOf<T>;
        } else {
            elements = selectorOrElements;
        }

        elements.forEach((el: T) => {
            el.addEventListener(event, (e: Event) => {
                fn(e, el);
            }, options);
        });
    }

    /**
     * Attaches an event listener to elements that match the specified selector, including dynamically added elements.
     * @template T - The type of the HTMLElement.
     * @param {string} event - The event type to listen for.
     * @param {string} selector - The CSS selector to match the elements.
     * @param {(event?: Event, el?: T) => void} fn - The event handler function.
     * @param {AddEventListenerOptions} [options] - Optional options for the event listener.
     * @param {HTMLElement | DocumentFragment | null} [parentEl=document.body] - The parent element to observe for DOM changes.
     */
    static live<T extends HTMLElement>(
        event: string,
        selector: string,
        fn: (event?: Event, el?: T) => void,
        options?: AddEventListenerOptions,
        parentEl: HTMLElement | DocumentFragment | null = document.body
    ): void {
        const applyListeners = () => {
            // Corrected: Using DOMHelpers.onAll instead of DathorHelpers.onAll
            DOMHelpers.onAll(event, selector, fn, options, parentEl);
        };

        applyListeners();

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    applyListeners();
                    break;
                }
            }
        });

        observer.observe(parentEl instanceof DocumentFragment ? parentEl : parentEl as HTMLElement, {
            childList: true,
            subtree: true,
        });
    }

    /**
     * Attaches an event listener to a specified element or elements.
     * @template T - The type of the HTMLElement.
     * @param {string} event - The event type to listen for.
     * @param {string | HTMLElement | Element | DocumentFragment} selector - The target element or selector.
     * @param {(event?: Event, el?: T) => void} fn - The callback function.
     * @param {AddEventListenerOptions} [options] - Optional options object.
     * @param {HTMLElement | DocumentFragment | null} [parentEl] - Optional parent element to scope the selector query within.
     * @returns {T | null} - The element to which the event listener was attached, or null.
     */
    static on<T extends HTMLElement>(
        event: string,
        selector: string | HTMLElement | Element | DocumentFragment,
        fn: (event?: Event, el?: T) => void,
        options?: AddEventListenerOptions,
        parentEl?: HTMLElement | DocumentFragment | null
    ): T | null {
        if (typeof selector === "string") {
            const elements = parentEl
                ? parentEl.querySelectorAll(selector) as NodeListOf<T>
                : document.querySelectorAll(selector) as NodeListOf<T>;

            if (elements.length > 1) {
                // Corrected: Using DOMHelpers.onAll instead of DathorHelpers.onAll
                DOMHelpers.onAll(event, elements, fn, options);
                return null;
            }

            const target = elements[0];
            if (target) {
                target.addEventListener(event, (e: Event) => {
                    fn(e, target);
                }, options);
                return target;
            } else {
                return null;
            }
        } else if (selector instanceof Element || selector instanceof HTMLElement) {
            selector.addEventListener(event, (e: Event) => {
                fn(e, selector as T);
            }, options);
            return selector as T;
        } else if (selector instanceof DocumentFragment) {
            const target = selector.querySelector(selector as unknown as string) as T | null;
            if (target) {
                target.addEventListener(event, (e: Event) => {
                    fn(e, target as T);
                }, options);
            }
            return target;
        }

        return null;
    }

    /**
     * Sets or gets the CSS property value of a given HTML element.
     * @param element - The target HTML element or a string selector.
     * @param property - The CSS property name to set or get.
     * @param value - The value to set for the CSS property.
     * @returns The current value of the CSS property if `value` is not provided; otherwise, returns `void`.
     */
    static css(element: HTMLElement | string, property: string, value?: string): string | void {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const el = typeof element === "string" ? DOMHelpers.get(element) : element;
        if (!el) return;

        if (value === undefined) {
            return getComputedStyle(el).getPropertyValue(property);
        } else {
            el.style.setProperty(property, value);
        }
    }

    /**
     * Removes all child nodes from the specified parent element.
     * @param selector - A string representing a CSS selector or an HTMLElement. 
     */
    static removeChilds(selector: string | HTMLElement): void {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const parent = typeof (selector) === "string" ? DOMHelpers.get(selector) : selector;
        if (!parent) return;
        while (parent.firstChild) {
            parent.firstChild.remove()
        }
    }

    /**
     * Creates an HTML element or uses an existing one, and optionally sets its text content.
     * @template T - The type of the HTML element.
     * @param {string | T} p - The tag name of the element to create, or an existing HTML element.
     * @param {string} [textContent] - Optional text content to set for the element.
     * @returns {T} The created or provided HTML element.
     */
    static create<T extends HTMLElement>(p: string | T, textContent?: string): T {
        let node: T;
        typeof (p) === "string" ? node = document.createElement(p) as T : node = p;
        if (textContent)
            node.textContent = textContent;

        return node;
    }

    /**
     * Converts an HTML string into a DocumentFragment.
     * @param html - The HTML string to convert.
     * @returns A DocumentFragment containing the parsed HTML.
     */
    static toDOM(html: string): DocumentFragment {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content;
    }

    /**
     * Traverses up the DOM tree until it finds an ancestor that matches the selector.
     * @param element - The starting element.
     * @param selector - The CSS selector to match the ancestor elements against.
     * @returns The first ancestor element that matches the selector, or `null`.
     */
    static parentUntil(element: HTMLElement, selector: string) {
        let currentElement = element;
        while (currentElement) {
            if (currentElement.matches(selector)) {
                return currentElement;
            }
            currentElement = currentElement.parentElement as HTMLElement;
        }
        return null;
    }

    /**
     * Converts an HTMLElement or Element to a CSS selector string.
     * @param el - The HTMLElement or Element to convert.
     * @returns The CSS selector string representing the element's path.
     */
    static ElementToSelector(el: HTMLElement | Element): string {
        if (!(el instanceof HTMLElement)) {
            throw new Error('Invalid argument: el must be an HTMLElement');
        }
        let path = [];
        let currentEl = el; // Use a local variable to traverse
        while (currentEl.nodeType === Node.ELEMENT_NODE) {
            let selector = currentEl.nodeName.toLowerCase();
            if (currentEl.id) {
                selector += '#' + currentEl.id;
                path.unshift(selector);
                break;
            } else {
                let sib: Element | null = currentEl, nth = 1;
                while (sib && sib.previousElementSibling) {
                    sib = sib.previousElementSibling;
                    nth++;
                }
                if (nth !== 1) {
                    selector += ':nth-child(' + nth + ')';
                }
                path.unshift(selector);
            }
            currentEl = currentEl.parentNode as HTMLElement;
        }
        return path.join(' > ');
    }

    /**
     * Retrieves the next sibling element of the given element.
     * @param el - The element or a string representing the element's ID.
     * @returns The next sibling element if it exists and is an HTMLElement, otherwise null.
     */
    static nextSibling(el: HTMLElement | string): HTMLElement | null {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const element = typeof el === "string" ? DOMHelpers.get(el) : el;
        return element && element.nextElementSibling instanceof HTMLElement ? element.nextElementSibling : null;
    }

    /**
     * Retrieves the previous sibling of a given HTML element.
     * @param el - The target element or a string representing the element's ID.
     * @returns The previous sibling element if it exists and is an HTMLElement, otherwise null.
     */
    static previousSibling(el: HTMLElement | string): HTMLElement | null {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const element = typeof el === "string" ? DOMHelpers.get(el) : el;
        return element && element.previousElementSibling instanceof HTMLElement ? element.previousElementSibling as HTMLElement : null;
    }

    /**
     * Gets or sets a data attribute on an HTML element.
     * @param el - The target element or a selector string.
     * @param key - The data attribute key (without the "data-" prefix).
     * @param value - The value to set for the data attribute.
     * @returns The current value of the data attribute if getting, or the set value if setting, or undefined if the element is not found.
     */
    static data(el: HTMLElement | string, key: string, value?: string | null): string | null | undefined {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const element = typeof el === "string" ? DOMHelpers.get(el) : el;
        if (!element) return undefined;

        if (value === undefined) {
            return element.dataset[key];
        } else if (value === null) {
            delete element.dataset[key];
        } else {
            element.dataset[key] = value;
        }
        return value;
    }

    /**
     * Finds the closest ancestor of the given element that matches the specified selector.
     * @template T - The type of the HTMLElement.
     * @param {HTMLElement | string} el - The element or a selector string to start the search from.
     * @param {string} selector - The selector to match the ancestor against.
     * @returns {T | null} - The closest matching ancestor element, or null if no match is found.
     */
    static closest<T extends HTMLElement>(el: HTMLElement | string, selector: string): T | null {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const element = typeof el === "string" ? DOMHelpers.get(el) : el;
        return element ? element.closest(selector) as T | null : null;
    }

    /**
     * Retrieves the parent element of the given HTML element or element identified by a selector string.
     * @param el - The target element or a selector string to identify the element.
     * @returns The parent HTMLElement of the given element, or null.
     */
    static parent(el: HTMLElement | string): HTMLElement | null {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const element = typeof el === "string" ? DOMHelpers.get(el) : el;
        return element ? element.parentElement : null;
    }

    /**
     * Inserts a new HTML element before a reference element in the DOM.
     * @param newElement - The new HTML element to be inserted.
     * @param referenceElement - The reference element (HTMLElement or selector string).
     */
    static insertBefore(newElement: HTMLElement, referenceElement: HTMLElement | string): void {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const refEl = typeof referenceElement === "string" ? DOMHelpers.get(referenceElement) : referenceElement;
        if (refEl && refEl.parentNode) {
            refEl.parentNode.insertBefore(newElement, refEl);
        }
    }

    /**
     * Inserts a new HTML element immediately after a reference element in the DOM.
     * @param newElement - The new HTML element to be inserted.
     * @param referenceElement - The reference element (HTMLElement or selector string).
     */
    static insertAfter(newElement: HTMLElement, referenceElement: HTMLElement | string): void {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const refEl = typeof referenceElement === "string" ? DOMHelpers.get(referenceElement) : referenceElement;
        if (refEl && refEl.parentNode) {
            refEl.parentNode.insertBefore(newElement, refEl.nextSibling);
        }
    }

    /**
     * Checks if the given HTML element has the specified class or classes.
     * @param element - The HTML element or a string selector.
     * @param classNames - The class name or an array of class names to check for.
     * @returns `true` if the element has all the specified class names, otherwise `false`.
     */
    static hasClass(element: HTMLElement | string, classNames: string | string[]): boolean {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const el = typeof element === "string" ? DOMHelpers.get(element) : element;
        if (!el) return false;

        if (typeof classNames === "string") {
            return el.classList.contains(classNames);
        } else if (Array.isArray(classNames)) {
            return classNames.every(className => el.classList.contains(className));
        }
        return false;
    }

    /**
     * Adds one or more class names to the specified HTML element.
     * @param element - The target element or a selector string.
     * @param classNames - A single class name or an array of class names to add.
     */
    static addClass(element: HTMLElement | string, classNames: string | string[]): void {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const el = typeof element === "string" ? DOMHelpers.get(element) : element;
        if (!el) return;

        if (typeof classNames === "string") {
            el.classList.add(classNames);
        } else if (Array.isArray(classNames)) {
            classNames.forEach(className => el.classList.add(className));
        }
    }

    /**
     * Removes one or more class names from the specified HTML element.
     * @param element - The target element or a selector string.
     * @param classNames - A single class name or an array of class names to be removed.
     */
    static removeClass(element: HTMLElement | string, classNames: string | string[]): void {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const el = typeof element === "string" ? DOMHelpers.get(element) : element;
        if (!el) return;

        if (typeof classNames === "string") {
            el.classList.remove(classNames);
        } else if (Array.isArray(classNames)) {
            classNames.forEach(className => el.classList.remove(className));
        }
    }

    /**
     * Toggles one or more class names on the specified element.
     * @param element - The target element or a selector string.
     * @param classNames - A single class name or an array of class names to toggle.
     */
    static toggleClass(element: Element | HTMLElement | string, classNames: string | string[]): void {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const el = typeof element === "string" ? DOMHelpers.get(element) : element;
        if (!el) return;

        if (typeof classNames === "string") {
            el.classList.toggle(classNames);
        } else if (Array.isArray(classNames)) {
            classNames.forEach(className => el.classList.toggle(className));
        }
    }

    /**
     * Sets or gets the inner HTML content of a specified HTML element.
     * @param el - The target HTML element or a string selector.
     * @param htmlContent - The HTML content to set. If `undefined`, the current inner HTML is returned.
     * @returns The current inner HTML or the new content, or `undefined` if the element is not found.
     */
    static html(el: HTMLElement | string, htmlContent?: string | null): string | null | undefined {
        // Corrected: Using DOMHelpers.get instead of DathorHelpers.get
        const element = typeof el === "string" ? DOMHelpers.get(el) : el;
        if (!element) return undefined;

        if (htmlContent === undefined) {
            return element.innerHTML;
        } else if (htmlContent === null) {
            element.innerHTML = '';
        } else {
            element.innerHTML = htmlContent;
        }
        return htmlContent;
    }
}
