export class TaskScheduler {
    private tasks: { id: number; time: number; callback: () => void }[] = [];
    private animationFrameId: number | null = null;
    private startTime: number | null = null;
    private nextTaskId: number = 0;
    private isPaused: boolean = false;
    private pauseStartTime: number | null = null;
    private idleTime: number = 0;

    addTask(callback: () => void, delay: number): number {
        const taskId = this.nextTaskId++;
        this.tasks.push({ id: taskId, time: delay + this.idleTime, callback });
        this.tasks.sort((a, b) => a.time - b.time);
        this.start();
        return taskId;
    }

    removeTask(taskId: number): boolean {
        const index = this.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            if (this.tasks.length === 0) {
                this.stop();
            }
            return true;
        }
        return false;
    }

    rescheduleTask(taskId: number, newDelay: number): boolean {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.time = newDelay + this.idleTime;
            this.tasks.sort((a, b) => a.time - b.time);
            return true;
        }
        return false;
    }

    start(): void {
        if (this.animationFrameId !== null) return;
        if (this.isPaused && this.pauseStartTime) {
            this.idleTime += performance.now() - this.pauseStartTime;
            this.pauseStartTime = null;
            this.isPaused = false;
            this.tasks.forEach(task => task.time += this.idleTime);
            this.tasks.sort((a, b) => a.time - b.time);
        }

        this.startTime = performance.now();
        const executeTasks = (currentTime: number) => {
            if (this.startTime === null) return;

            const elapsed = currentTime - this.startTime;

            while (this.tasks.length > 0 && this.tasks[0].time <= elapsed) {
                const task = this.tasks.shift();
                if (task) {
                    task.callback();
                }
            }

            if (this.tasks.length > 0) {
                this.animationFrameId = requestAnimationFrame(executeTasks);
            } else {
                this.stop();
            }
        };

        this.animationFrameId = requestAnimationFrame(executeTasks);
    }

    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.startTime = null;
        }
    }

    clear(): void {
        this.tasks = [];
        this.stop();
        this.idleTime = 0;
    }

    pause(): void {
        if (this.animationFrameId !== null && !this.isPaused) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.pauseStartTime = performance.now();
            this.isPaused = true;
        }
    }
}

export class DathorHelpers {

    /**
     * Sets or gets the value of an HTML input element selected by the given selector.
     * 
     * @template T - The type of the value to be returned.
     * @param {string} selector - The CSS selector to find the HTML input element.
     * @param {any} [value] - The value to set for the input element. If not provided, the current value of the input element will be returned.
     * @returns {T | null} - The value of the input element cast to type T, or null if the element is not found.
     */
    static value<T>(selector: string, value?: any) {
        const element = DathorHelpers.get<HTMLInputElement>(selector);
        if (value && element) element!.value = value;
        return element ? element.value as T : null;
    }


    /**
     * Creates and returns a new instance of `TaskScheduler`.
     *
     * @returns {TaskScheduler} A new `TaskScheduler` instance.
     */
    static createTaskScheduler(): TaskScheduler {
        return new TaskScheduler();
    }


    /**
     * Retrieves an element from the DOM based on the provided selector.
     * 
     * @template T - The type of the HTMLElement to be returned.
     * @param {string} selector - The CSS selector to match the desired element.
     * @param {Element | DocumentFragment | null} [parent] - The parent element or document fragment to search within. If not provided, the document is used as the parent.
     * @returns {T | null} - The matched element of type T, or null if no element is found.
     */
    static get<T extends HTMLElement>(selector: string, parent?: Element | DocumentFragment | null): T | null { // Allow null
        if (!parent) {
            return document.querySelector(selector) as T | null; // Handle null parent
        }
        return parent.querySelector(selector) as T | null; // Handle null parent
    }

    /**
   * Filters elements based on a selector within a set of parent elements.
   *
   * @param {string} filterSelector - The CSS selector to filter elements.
   * @param {HTMLElement | HTMLElement[]} parents - The parent element(s) to search within.
   * @returns {HTMLElement[]} - An array of filtered elements.
   */
    static filter(filterSelector: string, parents: HTMLElement | HTMLElement[]): HTMLElement[] {
        if (!parents) {
            return []; // Return empty array if no parents are provided.
        }

        if (Array.isArray(parents)) {
            return parents.flatMap(parent => Array.from(parent.querySelectorAll(filterSelector)));
        } else {
            return Array.from(parents.querySelectorAll(filterSelector));
        }
    }

    /**
     * Retrieves all elements that match the specified CSS selector within the given parent element or document fragment.
     * If no parent is provided, it searches within the entire document.
     *
     * @param selector - The CSS selector to match elements against.
     * @param parent - Optional. The parent element or document fragment to search within. Defaults to the entire document.
     * @returns An array of elements that match the specified selector.
     */
    static getAll(selector: string, parent?: Element | DocumentFragment): Element[] {
        const queryResult = parent ? parent.querySelectorAll(selector) : document.querySelectorAll(selector);
        return Array.from(queryResult);
    }

    /**
     * Replaces an old HTML element with a new HTML element.
     *
     * @param oldElement - The existing HTML element to be replaced.
     * @param newElement - The new HTML element to replace the old element with.
     */
    static replace(oldElement: HTMLElement, newElement: HTMLElement) {
        oldElement.replaceWith(newElement);
    }

    /**
     * Adds an event listener to multiple elements specified by a selector or a list of elements.
     *
     * @template T - The type of the elements, extending HTMLElement.
     * @param {string} event - The event type to listen for (e.g., 'click', 'mouseover').
     * @param {string | NodeListOf<T> | T[]} selectorOrElements - A CSS selector string, a NodeList of elements, or an array of elements to attach the event listener to.
     * @param {(event?: Event, el?: T) => void} fn - The callback function to execute when the event is triggered. Receives the event object and the element as arguments.
     * @param {AddEventListenerOptions} [options] - Optional. An options object that specifies characteristics about the event listener.
     * @param {HTMLElement | DocumentFragment | null} [parentEl] - Optional. The parent element or document fragment to query the selector within. Defaults to the document if not provided.
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
     * Creates a debounced function that delays invoking the provided function until after the specified delay has elapsed since the last time the debounced function was invoked.
     *
     * @param func - The function to debounce.
     * @param delay - The number of milliseconds to delay.
     * @returns A new debounced function.
     */
    static debounce(func: Function, delay: number): Function {
        let timeoutId: ReturnType<typeof setTimeout>;
        return function (this: any, ...args: any[]) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };

    }

    /**
     * Retrieves the FormData object from a given HTML form element.
     *
     * @param form - The HTML form element or a string selector to identify the form.
     * @returns The FormData object containing the form's data, or null if the form element is not found.
     */
    static getFormData(form: HTMLFormElement | string): FormData | null {
        const formElement = typeof form === "string" ? $D.get(form) as HTMLFormElement : form;
        if (!formElement) return null;
        return new FormData(formElement);
    }

    /**
     * Serializes an HTML form into an object, with optional keys to omit or pick.
     *
     * @template T - The type of the resulting object.
     * @template K - The keys of T to omit.
     * @param {HTMLFormElement} form - The form element to serialize.
     * @param {K[]} [omit] - An optional array of keys to omit from the resulting object.
     * @param {(keyof T)[]} [pick] - An optional array of keys to pick from the resulting object.
     * @returns {Omit<T, K> | Pick<T, keyof Pick<T, keyof T>>} - The serialized form data as an object, with omitted or picked keys.
     */
    static serializeForm<T extends object, K extends keyof T = never>(
        form: HTMLFormElement,
        omit?: K[],
        pick?: (keyof T)[]
    ): Omit<T, K> | Pick<T, keyof Pick<T, keyof T>> {
        const formData = new FormData(form);
        const serialized: { [key: string]: any } = {};

        formData.forEach((value, key) => {
            if (serialized[key]) {
                if (Array.isArray(serialized[key])) {
                    serialized[key].push(value);
                } else {
                    serialized[key] = [serialized[key], value];
                }
            } else {
                serialized[key] = value;
            }
        });

        let result: any = serialized;

        if (pick) {
            result = pick.reduce((acc: any, key) => {
                if (result[key]) {
                    acc[key] = result[key];
                }
                return acc;
            }, {});
        }

        if (omit) {
            result = Object.keys(result).reduce((acc: any, key) => {
                if (!omit.includes(key as K)) {
                    acc[key] = result[key];
                }
                return acc;
            }, {});
        }

        return result as Omit<T, K> | Pick<T, keyof Pick<T, keyof T>>;
    }
    /**
     * Creates a throttled version of the provided function that will only execute
     * the function at most once every specified limit of milliseconds.
     *
     * @param func - The function to throttle.
     * @param limit - The number of milliseconds to wait before allowing the function to be called again.
     * @returns A throttled version of the provided function.
     */
    static throttle(func: Function, limit: number): Function {
        let inThrottle: boolean;
        return function (this: any, ...args: any[]) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    /**
     * Sets or gets the CSS property value of a given HTML element.
     *
     * @param element - The target HTML element or a string selector to identify the element.
     * @param property - The CSS property name to set or get.
     * @param value - The value to set for the CSS property. If omitted, the current value of the property will be returned.
     * @returns The current value of the CSS property if `value` is not provided; otherwise, returns `void`.
     */
    static css(element: HTMLElement | string, property: string, value?: string): string | void {
        const el = typeof element === "string" ? $D.get(element) : element;
        if (!el) return;

        if (value === undefined) {
            return getComputedStyle(el).getPropertyValue(property);
        } else {
            el.style.setProperty(property, value);
        }
    }

    /**
     * Executes an array of tasks, which can be either synchronous functions or functions returning promises,
     * and returns a promise that resolves when all tasks have completed.
     *
     * @param tasks - An array of functions that return either a value or a promise.
     * @returns A promise that resolves to an array of results when all tasks have completed.
     *          If any task throws an error or returns a rejected promise, the returned promise will be rejected with that error.
     */
    static awaitAll(tasks: (() => any | Promise<any>)[]): Promise<any[]> {
        const promises = tasks.map(task => {
            try {
                const result = task();
                if (result instanceof Promise) {
                    return result; // If it's a promise, return it
                } else {
                    return Promise.resolve(result); // If it's sync, wrap it in a promise
                }
            } catch (error) {
                return Promise.reject(error); // Handle errors
            }
        });

        return Promise.all(promises);
    }

    /**
     * Attaches an event listener to elements that match the specified selector, including elements
     * that are added to the DOM after the initial call. The event listener is reapplied whenever
     * the DOM changes.
     *
     * @template T - The type of the HTMLElement.
     * @param {string} event - The event type to listen for (e.g., 'click', 'mouseover').
     * @param {string} selector - The CSS selector to match the elements.
     * @param {(event?: Event, el?: T) => void} fn - The event handler function to be called when the event is triggered.
     * @param {AddEventListenerOptions} [options] - Optional options for the event listener (e.g., { capture: true }).
     * @param {HTMLElement | DocumentFragment | null} [parentEl=document.body] - The parent element to observe for DOM changes. Defaults to document.body.
     */
    static live<T extends HTMLElement>(
        event: string,
        selector: string,
        fn: (event?: Event, el?: T) => void,
        options?: AddEventListenerOptions,
        parentEl: HTMLElement | DocumentFragment | null = document.body // Default to document.body
    ): void {
        const applyListeners = () => {
            $D.onAll(event, selector, fn, options, parentEl);
        };

        applyListeners(); // Apply listeners initially

        const observer = new MutationObserver((mutationsList) => {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    applyListeners(); // Reapply listeners on DOM changes
                    break; // No need to check other mutations if childList changed
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
     *
     * @template T - The type of the HTMLElement.
     * @param {string} event - The event type to listen for (e.g., 'click', 'mouseover').
     * @param {string | HTMLElement | Element | DocumentFragment} selector - The CSS selector string, HTMLElement, Element, or DocumentFragment to attach the event listener to.
     * @param {(event?: Event, el?: T) => void} fn - The callback function to execute when the event is triggered.
     * @param {AddEventListenerOptions} [options] - Optional options object that specifies characteristics about the event listener.
     * @param {HTMLElement | DocumentFragment | null} [parentEl] - Optional parent element to scope the selector query within.
     * @returns {T | null} - The element to which the event listener was attached, or null if multiple elements were handled or no element was found.
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
                // Delegate to onAll if multiple elements match
                DathorHelpers.onAll(event, elements, fn, options);
                return null; // Return null since multiple elements were handled
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
            // Handle DocumentFragment: Find the first matching element within.
            const target = selector.querySelector(selector as unknown as string) as T | null; // Query inside it
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
     * Removes all child nodes from the specified parent element.
     *
     * @param selector - A string representing a CSS selector or an HTMLElement. 
     *                   If a string is provided, the element will be selected using `DOMUtils.get`.
     *                   If an HTMLElement is provided, it will be used directly.
     * 
     * @remarks
     * If the parent element is not found, the function will return without performing any action.
     */
    static removeChilds(selector: string | HTMLElement): void {
        const parent = typeof (selector) === "string" ? DathorHelpers.get(selector) : selector;
        if (!parent) return;
        while (parent.firstChild) {
            parent.firstChild.remove()
        }
    }

    /**
     * Creates an HTML element or uses an existing one, and optionally sets its text content.
     *
     * @template T - The type of the HTML element.
     * @param {string | T} p - The tag name of the element to create, or an existing HTML element.
     * @param {string} [textContent] - Optional text content to set for the element.
     * @returns {T} The created or provided HTML element with the optional text content set.
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
     *
     * @param html - The HTML string to convert.
     * @returns A DocumentFragment containing the parsed HTML.
     */
    static toDOM(html: string): DocumentFragment {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content;
    }

    /**
     * Traverses up the DOM tree from the given element until it finds an ancestor that matches the specified selector.
     *
     * @param element - The starting element from which to begin the traversal.
     * @param selector - The CSS selector to match the ancestor elements against.
     * @returns The first ancestor element that matches the selector, or `null` if no matching ancestor is found.
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
     *
     * @param el - The HTMLElement or Element to convert.
     * @returns The CSS selector string representing the element's path.
     * @throws {Error} If the provided argument is not an HTMLElement.
     */
    static ElementToSelector(el: HTMLElement | Element): string {
        if (!(el instanceof HTMLElement)) {
            throw new Error('Invalid argument: el must be an HTMLElement');
        }
        let path = [];
        while (el.nodeType === Node.ELEMENT_NODE) {
            let selector = el.nodeName.toLowerCase();
            if (el.id) {
                selector += '#' + el.id;
                path.unshift(selector);
                break;
            } else {
                let sib = el, nth = 1;
                while (sib.previousElementSibling) {
                    sib = sib.previousElementSibling;
                    nth++;
                }
                if (nth !== 1) {
                    selector += ':nth-child(' + nth + ')';
                }
                path.unshift(selector);
            }
            el = el.parentNode as HTMLElement;
        }
        return path.join(' > ');
    }

    /**
     * Retrieves the next sibling element of the given element.
     *
     * @param el - The element or a string representing the element's ID.
     * @returns The next sibling element if it exists and is an HTMLElement, otherwise null.
     */
    static nextSibling(el: HTMLElement | string): HTMLElement | null {
        const element = typeof el === "string" ? DathorHelpers.get(el) : el;
        return element && element.nextElementSibling instanceof HTMLElement ? element.nextElementSibling : null;
    }

    /**
     * Retrieves the previous sibling of a given HTML element.
     *
     * @param el - The target element or a string representing the element's ID.
     * @returns The previous sibling element if it exists and is an HTMLElement, otherwise null.
     */
    static previousSibling(el: HTMLElement | string): HTMLElement | null {
        const element = typeof el === "string" ? DathorHelpers.get(el) : el;
        return element && element.previousElementSibling instanceof HTMLElement ? element.previousElementSibling as HTMLElement : null;
    }

    /**
     * Gets or sets a data attribute on an HTML element.
     *
     * @param el - The target element or a selector string to find the element.
     * @param key - The data attribute key (without the "data-" prefix).
     * @param value - The value to set for the data attribute. If undefined, the current value is returned. If null, the data attribute is removed.
     * @returns The current value of the data attribute if getting, or the set value if setting, or undefined if the element is not found.
     */
    static data(el: HTMLElement | string, key: string, value?: string | null): string | null | undefined {
        const element = typeof el === "string" ? DathorHelpers.get(el) : el;
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
     * 
     * @template T - The type of the HTMLElement.
     * @param {HTMLElement | string} el - The element or a selector string to start the search from.
     * @param {string} selector - The selector to match the ancestor against.
     * @returns {T | null} - The closest matching ancestor element, or null if no match is found.
     */
    static closest<T extends HTMLElement>(el: HTMLElement | string, selector: string): T | null {
        const element = typeof el === "string" ? DathorHelpers.get(el) : el;
        return element ? element.closest(selector) as T | null : null;
    }

    /**
     * Retrieves the parent element of the given HTML element or element identified by a selector string.
     *
     * @param el - The target element or a selector string to identify the element.
     * @returns The parent HTMLElement of the given element, or null if the element has no parent or does not exist.
     */
    static parent(el: HTMLElement | string): HTMLElement | null {
        const element = typeof el === "string" ? DathorHelpers.get(el) : el;
        return element ? element.parentElement : null;
    }
    /**
     * Inserts a new HTML element before a reference element in the DOM.
     *
     * @param newElement - The new HTML element to be inserted.
     * @param referenceElement - The reference element before which the new element will be inserted. 
     *                           This can be either an HTMLElement or a string representing the ID of the element.
     * 
     * @remarks
     * If the reference element is provided as a string, it will be resolved using `DOMUtils.get`.
     * If the reference element or its parent node is not found, the new element will not be inserted.
     */
    static insertBefore(newElement: HTMLElement, referenceElement: HTMLElement | string): void {
        const refEl = typeof referenceElement === "string" ? DathorHelpers.get(referenceElement) : referenceElement;
        if (refEl && refEl.parentNode) {
            refEl.parentNode.insertBefore(newElement, refEl);
        }
    }
    /**
     * Inserts a new HTML element immediately after a reference element in the DOM.
     *
     * @param newElement - The new HTML element to be inserted.
     * @param referenceElement - The reference element after which the new element will be inserted. 
     *                           This can be either an HTMLElement or a string representing the ID of the element.
     * 
     * @remarks
     * If the reference element is provided as a string, it will be resolved using `DOMUtils.get`.
     * If the reference element or its parent node is not found, the new element will not be inserted.
     */
    static insertAfter(newElement: HTMLElement, referenceElement: HTMLElement | string): void {
        const refEl = typeof referenceElement === "string" ? DathorHelpers.get(referenceElement) : referenceElement;
        if (refEl && refEl.parentNode) {
            refEl.parentNode.insertBefore(newElement, refEl.nextSibling);
        }
    }

    /**
     * Checks if the given HTML element has the specified class or classes.
     *
     * @param element - The HTML element or a string selector to find the element.
     * @param classNames - The class name or an array of class names to check for.
     * @returns `true` if the element has all the specified class names, otherwise `false`.
     */
    static hasClass(element: HTMLElement | string, classNames: string | string[]): boolean {
        const el = typeof element === "string" ? DathorHelpers.get(element) : element;
        if (!el) return false;

        if (typeof classNames === "string") {
            return el.classList.contains(classNames);
        } else if (Array.isArray(classNames)) {
            return classNames.every(className => el.classList.contains(className));
        }
        return false; // Handle invalid input (e.g., non-string, non-array)
    }


    /**
     * Adds one or more class names to the specified HTML element.
     *
     * @param element - The target element or a selector string to get the element.
     * @param classNames - A single class name or an array of class names to add to the element.
     *
     * @remarks
     * If the `element` parameter is a string, it will be used as a selector to find the element.
     * If the element is not found, the function will return without making any changes.
     * If the `classNames` parameter is neither a string nor an array, the function will do nothing.
     *
     * @example
     * ```typescript
     * // Add a single class to an element by selector
     * addClass("#myElement", "new-class");
     *
     * // Add multiple classes to an element by reference
     * const element = document.getElementById("myElement");
     * addClass(element, ["class1", "class2"]);
     * ```
     */
    static addClass(element: HTMLElement | string, classNames: string | string[]): void {
        const el = typeof element === "string" ? DathorHelpers.get(element) : element;
        if (!el) return;

        if (typeof classNames === "string") {
            el.classList.add(classNames);
        } else if (Array.isArray(classNames)) {
            classNames.forEach(className => el.classList.add(className));
        } // No else needed: handles invalid input gracefully (does nothing)
    }

    /**
     * Removes one or more class names from the specified HTML element.
     *
     * @param element - The target element or a selector string to identify the element.
     * @param classNames - A single class name or an array of class names to be removed from the element.
     */
    static removeClass(element: HTMLElement | string, classNames: string | string[]): void {
        const el = typeof element === "string" ? DathorHelpers.get(element) : element;
        if (!el) return;

        if (typeof classNames === "string") {
            el.classList.remove(classNames);
        } else if (Array.isArray(classNames)) {
            classNames.forEach(className => el.classList.remove(className));
        } // No else needed: handles invalid input gracefully (does nothing)
    }

    /**
     * Toggles one or more class names on the specified element.
     *
     * @param element - The target element or a selector string to find the element.
     * @param classNames - A single class name or an array of class names to toggle.
     *
     * @remarks
     * If the `element` parameter is a string, it will be used as a selector to find the element.
     * If the `classNames` parameter is a string, it will toggle that single class name.
     * If the `classNames` parameter is an array, it will toggle each class name in the array.
     *
     * @example
     * ```typescript
     * // Toggle a single class
     * toggleClass(document.getElementById('myElement'), 'active');
     *
     * // Toggle multiple classes
     * toggleClass(document.getElementById('myElement'), ['active', 'hidden']);
     *
     * // Using a selector string
     * toggleClass('#myElement', 'active');
     * ```
     */
    static toggleClass(element: Element | HTMLElement | string, classNames: string | string[]): void {
        const el = typeof element === "string" ? DathorHelpers.get(element) : element;
        if (!el) return;

        if (typeof classNames === "string") {
            el.classList.toggle(classNames);
        } else if (Array.isArray(classNames)) {
            classNames.forEach(className => el.classList.toggle(className));
        } // No else needed: handles invalid input gracefully (does nothing)
    }

    /**
     * Sets or gets the inner HTML content of a specified HTML element.
     *
     * @param el - The target HTML element or a string selector to identify the element.
     * @param htmlContent - The HTML content to set. If `undefined`, the current inner HTML is returned.
     *                      If `null`, the inner HTML is cleared.
     * @returns The current inner HTML if `htmlContent` is `undefined`, otherwise the new HTML content or `undefined` if the element is not found.
     */
    static html(el: HTMLElement | string, htmlContent?: string | null): string | null | undefined {
        const element = typeof el === "string" ? DathorHelpers.get(el) : el;
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


    /**
     * Repeats a template for each item in an array and optionally inserts the result into a container.
     *
     * @template T - The type of items in the array.
     * @param {T[]} items - The array of items to iterate over.
     * @param {(item: T, index: number) => string} itemTemplate - A function that returns a string template for each item.
     * @param {HTMLElement | string | null} [container=null] - An optional container (or selector) where the generated HTML will be inserted.
     * @param {string} [joinString=''] - A string used to join the generated templates.
     * @returns {void | string} - Returns the generated HTML string if no container is provided or if the container is not found.
     */
    static repeat<T>(
        items: T[],
        itemTemplate: (item: T, index: number) => string,
        container: HTMLElement | string | null = null,
        joinString: string = ''
    ): void | string {
        const html = items.map((item, index) => itemTemplate(item, index)).join(joinString);

        if (container) {
            const targetContainer = typeof container === "string" ? DathorHelpers.get(container) : container;
            if (targetContainer) {
                DathorHelpers.html(targetContainer, html);
                return;
            } else {
                return html;
            }
        } else {
            return html;
        }
    }

    /**
     * Generates a wrapped list of items with optional classes for the wrapper and items.
     *
     * @template T - The type of the items in the list.
     * @param {T[]} items - The array of items to be wrapped.
     * @param {(item: T, index: number) => string} itemTemplate - A function that returns the HTML string for each item.
     * @param {string} wrapperTag - The HTML tag to use for the wrapper (e.g., 'ul', 'ol', 'div').
     * @param {string} [wrapperClass] - Optional CSS class for the wrapper element.
     * @param {string} [itemClass] - Optional CSS class for each item element.
     * @returns {string} The HTML string of the wrapped list.
     */
    static wrappedList<T>(
        items: T[],
        itemTemplate: (item: T, index: number) => string,
        wrapperTag: string,
        wrapperClass?: string,
        itemClass?: string
    ): string {
        let listItems = items.map((item, index) => {
            const itemContent = itemTemplate(item, index);
            if (itemClass) {
                return `<${wrapperTag === 'ul' || wrapperTag === 'ol' ? 'li' : 'div'} class="${itemClass}">${itemContent}</${wrapperTag === 'ul' || wrapperTag === 'ol' ? 'li' : 'div'}>`;
            } else {
                return itemContent;
            }
        }).join('');

        const wrapperClasses = wrapperClass ? ` class="${wrapperClass}"` : '';
        return `<${wrapperTag}${wrapperClasses}>${listItems}</${wrapperTag}>`;
    }

    /**
     * Appends a list of items to a container element by generating HTML using a template function.
     *
     * @template T - The type of items in the list.
     * @param {T[]} items - The list of items to be appended.
     * @param {(item: T, index: number) => string} itemTemplate - A function that generates HTML for each item.
     * @param {HTMLElement | string} container - The container element or its selector where the items will be appended.
     * @param {string} [joinString=''] - A string used to join the generated HTML for each item.
     * @returns {void}
     */
    static appendToRepeat<T>(
        items: T[],
        itemTemplate: (item: T, index: number) => string,
        container: HTMLElement | string,
        joinString: string = ''
    ): void {
        const targetContainer = typeof container === "string" ? DathorHelpers.get(container) : container;
        if (!targetContainer) return;

        const html = DathorHelpers.repeat(items, itemTemplate, null, joinString);
        DathorHelpers.html(targetContainer, (targetContainer.innerHTML || '') + html);
    }

    /**
     * Appends a list of items to a specified container element, wrapping each item in a specified HTML tag.
     *
     * @template T - The type of the items in the list.
     * @param {T[]} items - The list of items to be appended.
     * @param {(item: T, index: number) => string} itemTemplate - A function that returns the HTML string for each item.
     * @param {HTMLElement | string} container - The container element or its selector where the items will be appended.
     * @param {string} wrapperTag - The HTML tag used to wrap each item.
     * @param {string} [wrapperClass] - Optional. The CSS class to be applied to the wrapper tag.
     * @param {string} [itemClass] - Optional. The CSS class to be applied to each item.
     * @returns {void}
     */
    static appendToWrappedList<T>(
        items: T[],
        itemTemplate: (item: T, index: number) => string,
        container: HTMLElement | string,
        wrapperTag: string,
        wrapperClass?: string,
        itemClass?: string
    ): void {
        const targetContainer = typeof container === "string" ? DathorHelpers.get(container) : container;
        if (!targetContainer) return;

        const html = DathorHelpers.wrappedList(items, itemTemplate, wrapperTag, wrapperClass, itemClass);
        DathorHelpers.html(targetContainer, (targetContainer.innerHTML || '') + html);
    }



    /**
     * Observes changes to an object or array and triggers a callback when changes occur.
     *
     * @template T - The type of the data to be observed, which can be an object or an array.
     * @param {T} data - The data to be observed.
     * @param {(newData: T) => void} updateCallback - The callback function to be called when the data is updated.
     * @returns {T} - A proxy object that observes changes to the original data.
     */
    static observe<T extends object | any[]>( // Allow arrays
        data: T,
        updateCallback: (newData: T) => void
    ): T {
        const handler: ProxyHandler<T> = {
            set: (target, property: string | symbol, value) => {
                (target as any)[property] = value;
                updateCallback(target);
                return true;
            },
        };

        return new Proxy(data, handler);
    }

    /**
     * Binds a property of a data object to the text content of an HTML element.
     * 
     * @param data - The data object containing the property to bind.
     * @param property - The property of the data object to bind to the element's text content.
     * @param element - The target HTML element or a string selector to find the element.
     * @param joinString - Optional string to join array elements if the property value is an array. Defaults to ', '.
     * 
     * @remarks
     * If the `element` parameter is a string, it will be used as a selector to find the target HTML element.
     * If the property value is an array, the elements will be joined using the `joinString`.
     * The function observes changes to the data object and updates the element's text content accordingly.
     */
    static bindText(
        data: any,
        property: string,
        element: HTMLElement | string,
        joinString: string = ', ' // Optional join string for arrays
    ): void {
        const targetElement = typeof element === "string" ? DathorHelpers.get(element) : element;
        if (!targetElement) return;

        const updateText = (newData: any) => {
            const value = newData[property];
            if (Array.isArray(value)) {
                targetElement.textContent = value.join(joinString);
            } else {
                targetElement.textContent = value;
            }
        };

        const observedData = DathorHelpers.observe(data, updateText);
        updateText(observedData); // Initial render
    }

    /**
     * Binds a property of a data object to an attribute of a DOM element.
     * 
     * @param data - The data object containing the property to bind.
     * @param property - The property of the data object to bind to the element's attribute.
     * @param element - The target DOM element or a string selector to find the element.
     * @param attribute - The attribute of the DOM element to bind the property to.
     * 
     * @remarks
     * This method observes changes to the specified property of the data object and updates
     * the specified attribute of the target DOM element accordingly.
     * 
     * @example
     * ```typescript
     * const data = { value: "example" };
     * bindAttribute(data, "value", "#myElement", "data-value");
     * ```
     */
    static bindAttribute(
        data: any,
        property: string,
        element: HTMLElement | string,
        attribute: string
    ): void {
        const targetElement = typeof element === "string" ? DathorHelpers.get(element) : element;
        if (!targetElement) return;

        const updateAttribute = (newData: any) => {
            targetElement.setAttribute(attribute, newData[property]);
        };

        const observedData = DathorHelpers.observe(data, updateAttribute);
        updateAttribute(observedData); // Initial render
    }


    /**
     * Binds a data object to a template and updates a target HTML element with the rendered template.
     * 
     * @template T - The type of the data object.
     * @param {T} data - The data object to bind to the template.
     * @param {string} template - The template string containing placeholders in the format {{property}}.
     * @param {HTMLElement | string} element - The target HTML element or a string selector for the element where the rendered template will be inserted.
     * @param {(newData: T) => string} [updateCallback] - An optional callback function that takes the new data and returns a string. Defaults to JSON.stringify.
     * 
     * @returns {void}
     */
    static bindTemplate<T extends object | any[]>(
        data: T,
        template: string,
        element: HTMLElement | string,
        updateCallback: (newData: T) => string = (data) => JSON.stringify(data)
    ): void {
        const targetElement = typeof element === "string" ? DathorHelpers.get(element) : element;
        if (!targetElement) return;

        const render = (newData: T) => {
            const renderedTemplate = template.replace(/{{(.*?)}}/g, (match, prop) => {
                return (newData as any)[prop.trim()];
            });
            targetElement.innerHTML = renderedTemplate;
        };

        const observedData = DathorHelpers.observe<T>(data, render);
        render(observedData); // Initial render
    }

    /**
     * Observes all properties of an object, including nested objects, and triggers a callback when any property changes.
     *
     * @template T - The type of the object to observe.
     * @param {T} data - The object to observe.
     * @param {(newData: T) => void} updateCallback - The callback function to trigger when the object or any nested object changes.
     * @returns {T} - The observed object with all properties being watched for changes.
     */
    static observeAll<T extends object>(
        data: T,
        updateCallback: (newData: T) => void
    ): T {
        const observedData = this.observe(data, updateCallback);

        const observeNested = (obj: any) => {
            if (typeof obj === 'object' && obj !== null) {
                for (const key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            obj[key] = DathorHelpers.observe(obj[key], updateCallback);
                            observeNested(obj[key]);
                        }
                    }
                }
            }
        }
        observeNested(observedData);
        return observedData;
    }

}
export const $D = DathorHelpers;
export default DathorHelpers;