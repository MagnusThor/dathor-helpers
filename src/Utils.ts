
import { IDathorHelpers } from "./DathorHelpers";
import { FetchHelper, IFetchHelperOptions } from "./FetchHelpers";
import { QueryableArray } from "./QueryableArray";
import { TaskScheduler } from "./TaskScheduler"; // Required for createTaskScheduler

const DathorHelpers = {} as IDathorHelpers;

/**
 * A collection of static utility methods for general tasks, data manipulation,
 * timing, and templating.
 */
export class Utils {

    /**
     * Converts a standard array into a QueryableArray instance, enabling LINQ-like methods.
     * @template T - The type of the elements in the array.
     * @param source - The array to convert.
     * @returns A new QueryableArray instance.
     */
    static toQueryableArray<T>(source: T[]): QueryableArray<T> {
        return QueryableArray.from(source);
    }

    /**
     * Creates a new, configurable FetchHelper instance for making HTTP requests.
     * @param baseUrl - Optional base URL for API endpoints.
     * @param options - Configuration options for the FetchHelper (headers, interceptors, error listener).
     * @returns A new FetchHelper instance.
     */
    static createFetchHelper(
        baseUrl?: string,
        options?: IFetchHelperOptions
    ): FetchHelper {
        return new FetchHelper(baseUrl, options);
    }

    /**
     * Creates and returns a new instance of `TaskScheduler`.
     * @returns {TaskScheduler} A new `TaskScheduler` instance.
     */
    static createTaskScheduler(): TaskScheduler {
        return new TaskScheduler();
    }

    /**
     * Retrieves the FormData object from a given HTML form element.
     * @param form - The HTML form element or a string selector to identify the form.
     * @returns The FormData object, or null if the form element is not found.
     */
    static getFormData(form: HTMLFormElement | string): FormData | null {
        const formElement = typeof form === "string" ? DathorHelpers.get(form) as HTMLFormElement : form;
        if (!formElement) return null;
        return new FormData(formElement);
    }

    /**
     * Creates a debounced version of a function that delays its execution.
     * @template T - The type of the function to debounce.
     * @param {T} func - The function to debounce.
     * @param {number} [delay=300] - The number of milliseconds to delay the function call.
     * @returns {T} A debounced version of the provided function.
     */
    static debounce<T extends (...args: any[]) => void>(func: T, delay = 300): T {
        let timer: number | undefined;
        return ((...args: any[]) => {
            clearTimeout(timer);
            timer = window.setTimeout(() => func(...args), delay);
        }) as T;
    }

    /**
     * Serializes an HTML form into an object, with optional keys to omit or pick.
     * @template T - The type of the resulting object.
     * @template K - The keys of T to omit.
     * @param {HTMLFormElement} form - The form element to serialize.
     * @param {K[]} [omit] - An optional array of keys to omit.
     * @param {(keyof T)[]} [pick] - An optional array of keys to pick.
     * @returns {Omit<T, K> | Pick<T, keyof Pick<T, keyof T>>} - The serialized form data as an object.
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
     * Creates a throttled version of the provided function that limits its execution rate.
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
     * Executes an array of synchronous or asynchronous tasks and returns a promise that resolves when all tasks have completed.
     * @param tasks - An array of functions that return either a value or a promise.
     * @returns A promise that resolves to an array of results.
     */
    static awaitAll(tasks: (() => any | Promise<any>)[]): Promise<any[]> {
        const promises = tasks.map(task => {
            try {
                const result = task();
                if (result instanceof Promise) {
                    return result;
                } else {
                    return Promise.resolve(result);
                }
            } catch (error) {
                return Promise.reject(error);
            }
        });

        return Promise.all(promises);
    }

    /**
     * Repeats a template for each item in an array and optionally inserts the result into a container.
     * @template T - The type of items in the array.
     * @param {T[]} items - The array of items to iterate over.
     * @param {(item: T, index: number) => string} itemTemplate - A function that returns a string template for each item.
     * @param {HTMLElement | string | null} [container=null] - An optional container (or selector) where the generated HTML will be inserted.
     * @param {string} [joinString=''] - A string used to join the generated templates.
     * @returns {void | string} - Returns the generated HTML string if no container is provided.
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
     * @template T - The type of the items in the list.
     * @param {T[]} items - The array of items to be wrapped.
     * @param {(item: T, index: number) => string} itemTemplate - A function that returns the HTML string for each item.
     * @param {string} wrapperTag - The HTML tag to use for the wrapper (e.g., 'ul', 'div').
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
            // Default to 'li' for ul/ol, 'div' otherwise for the item wrapper
            const itemWrapperTag = wrapperTag === 'ul' || wrapperTag === 'ol' ? 'li' : 'div';
            if (itemClass) {
                return `<${itemWrapperTag} class="${itemClass}">${itemContent}</${itemWrapperTag}>`;
            } else {
                return itemContent;
            }
        }).join('');

        const wrapperClasses = wrapperClass ? ` class="${wrapperClass}"` : '';
        return `<${wrapperTag}${wrapperClasses}>${listItems}</${wrapperTag}>`;
    }

    /**
     * Appends a list of items to a container element by generating HTML using a template function.
     * @template T - The type of items in the list.
     * @param {T[]} items - The list of items to be appended.
     * @param {(item: T, index: number) => string} itemTemplate - A function that generates HTML for each item.
     * @param {HTMLElement | string} container - The container element or its selector.
     * @param {string} [joinString=''] - A string used to join the generated HTML.
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
     * @template T - The type of the items in the list.
     * @param {T[]} items - The list of items to be appended.
     * @param {(item: T, index: number) => string} itemTemplate - A function that returns the HTML string for each item.
     * @param {HTMLElement | string} container - The container element or its selector.
     * @param {string} wrapperTag - The HTML tag used to wrap the list (e.g., 'ul').
     * @param {string} [wrapperClass] - Optional. The CSS class for the wrapper tag.
     * @param {string} [itemClass] - Optional. The CSS class for each item.
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
     * @template T - The type of the data to be observed.
     * @param {T} data - The data to be observed.
     * @param {(newData: T) => void} updateCallback - The callback function to be called when the data is updated.
     * @returns {T} - A proxy object that observes changes to the original data.
     */
    static observe<T extends object | any[]>(
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
     * @param data - The data object.
     * @param property - The property to bind.
     * @param element - The target HTML element or a string selector.
     * @param joinString - Optional string to join array elements.
     */
    static bindText(
        data: any,
        property: string,
        element: HTMLElement | string,
        joinString: string = ', '
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

        DathorHelpers.observe(data, updateText); // Initial render happens inside observe's logic in some cases, but explicitly calling here is safer
        updateText(data); // Initial render
    }

    /**
     * Binds a property of a data object to an attribute of a DOM element.
     * @param data - The data object.
     * @param property - The property to bind.
     * @param element - The target DOM element or a string selector.
     * @param attribute - The attribute of the DOM element to bind the property to.
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

        DathorHelpers.observe(data, updateAttribute);
        updateAttribute(data); // Initial render
    }

    /**
     * Binds a data object to a template and updates a target HTML element with the rendered template.
     * @template T - The type of the data object.
     * @param {T} data - The data object to bind to the template.
     * @param {string} template - The template string with placeholders (e.g., {{property}}).
     * @param {HTMLElement | string} element - The target HTML element or a string selector.
     * @param {(newData: T) => string} [updateCallback] - An optional callback function for custom rendering.
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

        DathorHelpers.observe<T>(data, render);
        render(data); // Initial render
    }

    /**
     * Observes all properties of an object, including nested objects, and triggers a callback when any property changes.
     * @template T - The type of the object to observe.
     * @param {T} data - The object to observe.
     * @param {(newData: T) => void} updateCallback - The callback function to trigger when the object or any nested object changes.
     * @returns {T} - The observed object.
     */
    static observeAll<T extends object>(
        data: T,
        updateCallback: (newData: T) => void
    ): T {
        const observedData = DathorHelpers.observe(data, updateCallback);

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