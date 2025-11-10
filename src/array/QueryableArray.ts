/**
 * A custom array class that provides additional query-like methods for filtering, mapping, and manipulating arrays.
 * @template T - The type of elements in the array.
 */
export class QueryableArray<T> extends Array<T> {
    /**
     * Skips the specified number of elements and returns the remaining elements.
     * @param count - The number of elements to skip.
     * @returns A new QueryableArray containing the remaining elements.
     */
    skip(count: number): QueryableArray<T> {
        const result = QueryableArray.from(this.slice(count));
        return result;
    }

    /**
     * Takes the specified number of elements from the start of the array.
     * @param count - The number of elements to take.
     * @returns A new QueryableArray containing the taken elements.
     */
    take(count: number): QueryableArray<T> {
        const result = QueryableArray.from(this.slice(0, count));
        return result;
    }

    /**
     * Filters the array based on a predicate function.
     * @param predicate - A function to test each element.
     * @returns A new QueryableArray containing the elements that satisfy the predicate.
     */
    where(predicate: (item: T) => boolean): QueryableArray<T> {
        const result = QueryableArray.from(this.filter(predicate));
        return result;
    }

    /**
     * Projects each element of the array into a new form.
     * @template U - The type of the projected elements.
     * @param selector - A function to transform each element.
     * @returns A new QueryableArray containing the transformed elements.
     */
    select<U>(selector: (item: T) => U): QueryableArray<U> {
        const result = QueryableArray.from(this.map(selector));
        return result;
    }

    /**
     * Returns the first element that satisfies the predicate or the first element if no predicate is provided.
     * @param predicate - A function to test each element (optional).
     * @returns The first matching element.
     * @throws An error if no matching element is found.
     */
    first(predicate?: (item: T) => boolean): T {
        const item = predicate ? this.find(predicate) : this[0];
        if (item === undefined) {
            throw new Error('Sequence contains no matching element');
        }
        return item;
    }

    /**
     * Returns the first element that satisfies the predicate or undefined if no matching element is found.
     * @param predicate - A function to test each element (optional).
     * @returns The first matching element or undefined.
     */
    firstOrDefault(predicate?: (item: T) => boolean): T | undefined {
        return predicate ? this.find(predicate) : this[0];
    }

    /**
     * Returns the last element that satisfies the predicate or the last element if no predicate is provided.
     * @param predicate - A function to test each element (optional).
     * @returns The last matching element.
     * @throws An error if no matching element is found.
     */
    last(predicate?: (item: T) => boolean): T {
        const items = predicate ? this.filter(predicate) : this;
        if (items.length === 0) {
            throw new Error('Sequence contains no matching element');
        }
        return items[items.length - 1];
    }

    /**
     * Returns the last element that satisfies the predicate or undefined if no matching element is found.
     * @param predicate - A function to test each element (optional).
     * @returns The last matching element or undefined.
     */
    lastOrDefault(predicate?: (item: T) => boolean): T | undefined {
        const items = predicate ? this.filter(predicate) : this;
        return items.length > 0 ? items[items.length - 1] : undefined;
    }

    /**
     * Returns the only element that satisfies the predicate or the only element if no predicate is provided.
     * @param predicate - A function to test each element (optional).
     * @returns The single matching element.
     * @throws An error if there is not exactly one matching element.
     */
    single(predicate?: (item: T) => boolean): T {
        const items = predicate ? this.filter(predicate) : this;
        if (items.length !== 1) {
            throw new Error('Sequence contains more than one matching element');
        }
        return items[0];
    }

    /**
     * Returns the only element that satisfies the predicate or undefined if no matching element is found.
     * @param predicate - A function to test each element (optional).
     * @returns The single matching element or undefined.
     */
    singleOrDefault(predicate?: (item: T) => boolean): T | undefined {
        const items = predicate ? this.filter(predicate) : this;
        return items.length === 1 ? items[0] : undefined;
    }

    /**
     * Determines whether any elements satisfy the predicate or whether the array contains any elements if no predicate is provided.
     * @param predicate - A function to test each element (optional).
     * @returns True if any elements satisfy the predicate or if the array contains any elements.
     */
    any(predicate?: (item: T) => boolean): boolean {
        return predicate ? this.some(predicate) : this.length > 0;
    }

    /**
     * Determines whether all elements satisfy the predicate.
     * @param predicate - A function to test each element.
     * @returns True if all elements satisfy the predicate.
     */
    all(predicate: (item: T) => boolean): boolean {
        return this.every(predicate);
    }

    /**
     * Counts the number of elements that satisfy the predicate or the total number of elements if no predicate is provided.
     * @param predicate - A function to test each element (optional).
     * @returns The count of matching elements.
     */
    count(predicate?: (item: T) => boolean): number {
        return predicate ? this.filter(predicate).length : this.length;
    }

    /**
     * Sorts the elements in ascending order based on a key.
     * @template K - The type of the key.
     * @param keySelector - A function to extract the key for each element.
     * @returns A new QueryableArray containing the sorted elements.
     */
    orderBy<K extends keyof T>(keySelector: (item: T) => T[K]): QueryableArray<T> {
        const result = new QueryableArray(...this.sort((a, b) => {
            if (keySelector(a) < keySelector(b)) return -1;
            if (keySelector(a) > keySelector(b)) return 1;
            return 0;
        }));
        return result;
    }

    /**
     * Sorts the elements in descending order based on a key.
     * @template K - The type of the key.
     * @param keySelector - A function to extract the key for each element.
     * @returns A new QueryableArray containing the sorted elements.
     */
    orderByDescending<K extends keyof T>(keySelector: (item: T) => T[K]): QueryableArray<T> {
        const result = new QueryableArray(...this.sort((a, b) => {
            if (keySelector(a) > keySelector(b)) return -1;
            if (keySelector(a) < keySelector(b)) return 1;
            return 0;
        }));
        return result;
    }

    /**
     * Groups the elements of the array based on a key.
     * @template K - The type of the key.
     * @param keySelector - A function to extract the key for each element.
     * @returns A Map where the keys are the group keys and the values are QueryableArrays of grouped elements.
     */
    groupBy<K>(keySelector: (item: T) => K): Map<K, QueryableArray<T>> {
        const map = new Map<K, QueryableArray<T>>();
        this.forEach(item => {
            const key = keySelector(item);
            if (!map.has(key)) {
                map.set(key, new QueryableArray<T>());
            }
            map.get(key)!.push(item);
        });
        return map;
    }

    /**
     * Removes duplicate elements from the array.
     * @returns A new QueryableArray containing only distinct elements.
     */
    distinct(): QueryableArray<T> {
        const set = new Set(this);
        return new QueryableArray(...set);
    }

    orderByAsc<K>(keySelector: (item: T) => K): QueryableArray<T> {
        const result = new QueryableArray(...this.sort((a, b) => {
            const keyA = keySelector(a);
            const keyB = keySelector(b);

            if (keyA < keyB) return -1;
            if (keyA > keyB) return 1;
            return 0;
        }));
        return result;
    }

    /**
     * Sorts the elements in descending order based on a key.
     * @template K - The type of the key.
     * @param keySelector - A function to extract the key for each element.
     * @returns A new QueryableArray containing the sorted elements.
     */
    orderByDesc<K>(keySelector: (item: T) => K): QueryableArray<T> {
        const result = new QueryableArray(...this.sort((a, b) => {
            const keyA = keySelector(a);
            const keyB = keySelector(b);

            if (keyA > keyB) return -1;
            if (keyA < keyB) return 1;
            return 0;
        }));
        return result;
    }

    /**
    * Creates a new QueryableArray instance from an array-like or iterable object.
    * @template T - The type of the elements in the source array.
    * @param arrayLike - An array-like or iterable object to convert to a QueryableArray.
    * @returns A new QueryableArray instance.
    */
    static from<T>(arrayLike: ArrayLike<T> | Iterable<T>): QueryableArray<T> {
        return new QueryableArray<T>(...Array.from(arrayLike));
    }
}