export type RequestInterceptor = (input: RequestInfo, init: RequestInit) => Promise<[RequestInfo, RequestInit]> | [RequestInfo, RequestInit];
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;
/**
 * Type definition for a global error handler.
 */
export type ErrorListener = (error: Error) => void;

/**
 * Interface representing the successful result of a FetchHelper request.
 * It extends the native Response interface and adds the parsed response body.
 * * @template T - The type of the parsed response data.
 */
export interface IFetchHelperResponse<T> extends Response {
    /** The parsed response body according to the specified responseType. */
    data: T;
}

/**
 * Interface representing the configuration options for the *FetchHelper CLIENT*.
 * These options are set once in the constructor and apply to all subsequent requests.
 */
export interface IFetchHelperOptions {
    requestInterceptor?: RequestInterceptor;
    responseInterceptor?: ResponseInterceptor;
    defaultHeaders?: HeadersInit;
    onError?: ErrorListener;    
}

/**
 * A helper class for making HTTP requests using the Fetch API.
 * * Provides centralized configuration, interception, and unified error handling
 * for all HTTP requests (GET, POST, PUT, DELETE, and custom actions).
 * * @example
 * ```typescript
 * const api = new FetchHelper("[https://api.example.com](https://api.example.com)", { 
 * defaultHeaders: { 'Authorization': 'Bearer token' },
 * onError: (error) => console.error("Global API Error:", error.message)
 * });
 * // T defaults to 'unknown' and responseType defaults to 'json'.
 * const result = await api.get<{ id: number }>("/status"); 
 * * console.log(result.data.id, result.status);
 * ```
 * * @remarks
 * - **Return Type:** All public methods return an **IFetchHelperResponse<T>**, extending `Response` with the parsed `.data`.
 * - **Error Handling:** Features a global `onError` listener that triggers for *any* request failure (network error or non-2xx HTTP status) before the error is re-thrown.
 * - **Interceptors:** `requestInterceptor` and `responseInterceptor` allow for request lifecycle management (e.g., loading states).
 * - **Body Handling:** Correctly handles JSON objects (default), `FormData`, and `URLSearchParams`.
 * * @param baseUrl - The base URL for all requests. Trailing slashes are removed.
 */
export class FetchHelper {
    private baseUrl: string;
    private requestInterceptor?: RequestInterceptor;
    private responseInterceptor?: ResponseInterceptor;
    private defaultHeaders: HeadersInit;
    private onErrorListener?: ErrorListener; // New property

    /**
     * Initialize a FetchHelpers instance.
     *
     * @param baseUrl - Optional base URL to prepend to all request paths. Trailing slashes are removed from the provided value. Defaults to an empty string.
     * @param options - Optional configuration object for interceptors, global headers, and error handling.
     * @param options.requestInterceptor - Optional callback to intercept or modify requests before they are sent.
     * @param options.responseInterceptor - Optional callback to intercept or modify responses after they are received.
     * @param options.defaultHeaders - Optional headers that will be merged into every request (e.g., Authorization).
     * @param options.onError - Optional callback executed for any request failure (network or non-2xx HTTP status) before the error is re-thrown.
     */
    constructor(baseUrl: string = "", options?: IFetchHelperOptions) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
        this.requestInterceptor = options?.requestInterceptor;
        this.responseInterceptor = options?.responseInterceptor;
        this.defaultHeaders = options?.defaultHeaders ?? {};
        this.onErrorListener = options?.onError; // Assign the new listener
    }

    /**
     * Constructs a complete URL by combining the base URL with a path and optional query parameters.
     * * @param path - The path to append to the base URL.
     * @param params - Optional key-value pairs to be added as query parameters.
     * @returns A complete URL string.
     */
    private buildUrl(path: string = "", params?: Record<string, any>): string {
        let url = path.startsWith("http")
            ? path
            : `${this.baseUrl}/${path.replace(/^\/+/, "")}`;

        if (params && Object.keys(params).length > 0) {
            const query = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined && value !== null)
                    query.append(key, String(value));
            }
            url += `?${query.toString()}`;
        }

        return url;
    }

    /**
     * Execute an HTTP request using fetch, parse the response, augment the Response object,
     * and handle all errors centrally.
     *
     * @typeParam T - The expected shape of the parsed response data (defaults to `unknown`).
     * @returns A Promise that resolves to an **IFetchHelperResponse<T>**.
     * @throws {Error} Throws the original error after potentially calling the `onError` listener.
     */
    private async request<T = unknown>(
        url: string,
        options: RequestInit & { responseType?: "json" | "text" | "blob" | "arrayBuffer" } = {}
    ): Promise<IFetchHelperResponse<T>> {
        // Merge default headers with method-specific headers
        const finalHeaders = new Headers(this.defaultHeaders);
        const requestHeaders = new Headers(options.headers);
        requestHeaders.forEach((value, key) => finalHeaders.set(key, value));

        const finalOptions: RequestInit = {
            ...options,
            headers: finalHeaders,
        };

        let [finalUrl, requestInit]: [RequestInfo, RequestInit] = [url, finalOptions];

        try {
            // Apply request interceptor
            if (this.requestInterceptor) {
                [finalUrl, requestInit] = await this.requestInterceptor(url, finalOptions);
            }

            let response = await fetch(finalUrl, requestInit);

            // Apply response interceptor
            if (this.responseInterceptor) {
                response = await this.responseInterceptor(response);
            }

            if (!response.ok) {
                const message = await response.text().catch(() => "");
                const error = new Error(`HTTP ${response.status} ${response.statusText}: ${message}`);
                
                // --- Global Error Hook (HTTP Status Error) ---
                if (this.onErrorListener) {
                    this.onErrorListener(error);
                }
                // --- End Hook ---
                
                throw error; // Re-throw the error
            }

            let data: T;
            // Clone the response before reading the body, as the body can only be read once.
            const responseClone = response.clone(); 
            
            // Default responseType to "json" if not specified
            const responseType = options.responseType ?? "json";

            // Read and parse the response body based on responseType
            switch (responseType) {
                case "text":
                    data = (await responseClone.text()) as unknown as T;
                    break;
                case "blob":
                    data = (await responseClone.blob()) as unknown as T;
                    break;
                case "arrayBuffer":
                    data = (await responseClone.arrayBuffer()) as unknown as T;
                    break;
                case "json":
                default:
                    data = (await responseClone.json()) as T;
                    break;
            }

            // Augment the original Response object with the parsed data
            return Object.assign(response, { data }) as IFetchHelperResponse<T>;

        } catch (error) {
            // --- Global Error Hook (Network/Parsing Error) ---
            if (this.onErrorListener && error instanceof Error) {
                this.onErrorListener(error);
            }
            // --- End Hook ---

            throw error; // Essential: Re-throw the error so the consumer can catch it
        }
    }

    // --- Public HTTP Methods ---

    /**
     * Perform an HTTP GET request.
     *
     * @typeParam T - The expected type of the parsed response data (defaults to `unknown`).
     * @returns A Promise that resolves to an **IFetchHelperResponse<T>**.
     */
    async get<T = unknown>(
        path: string = "",
        params?: Record<string, any>,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<IFetchHelperResponse<T>> {
        const fullUrl = this.buildUrl(path, params);
        return this.request<T>(fullUrl, { method: "GET", ...options });
    }

    /**
     * Send a POST request.
     *
     * @typeParam T - Expected shape of the parsed response data (defaults to `unknown`).
     * @typeParam ReqBody - Optional type of the outgoing JSON request body (defaults to Record<string, any>).
     * @param body - Request payload (FormData, URLSearchParams, or plain object).
     * @returns A promise that resolves with an **IFetchHelperResponse<T>**.
     */
    async post<T = unknown, ReqBody = Record<string, any>>(
        path: string = "",
        body?: ReqBody | FormData | URLSearchParams,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<IFetchHelperResponse<T>> {
        const headers = new Headers(options?.headers);
        let requestBody: BodyInit | undefined;

        if (body instanceof FormData) {
            requestBody = body;
        } else if (body instanceof URLSearchParams) {
            requestBody = body.toString();
        } else if (body && typeof body === "object") {
            // Only set Content-Type if it hasn't been explicitly set by the user
            if (!headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }
            requestBody = JSON.stringify(body);
        }

        return this.request<T>(this.buildUrl(path), {
            method: "POST",
            headers,
            body: requestBody,
            ...options,
        });
    }

    /**
     * Perform an HTTP PUT request.
     *
     * @typeParam T - Expected shape of the parsed response data (defaults to `unknown`).
     * @typeParam ReqBody - Optional type of the outgoing JSON request body (defaults to Record<string, any>).
     * @param body - Request payload (FormData, URLSearchParams, or plain object).
     * @returns A Promise that resolves to an **IFetchHelperResponse<T>**.
     */
    async put<T = unknown, ReqBody = Record<string, any>>(
        path: string = "",
        body?: ReqBody | FormData | URLSearchParams,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<IFetchHelperResponse<T>> {
        const headers = new Headers(options?.headers);
        let requestBody: BodyInit | undefined;

        if (body instanceof FormData) {
            requestBody = body;
        } else if (body instanceof URLSearchParams) {
            requestBody = body.toString();
        } else if (body && typeof body === "object") {
            if (!headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }
            requestBody = JSON.stringify(body);
        }

        return this.request<T>(this.buildUrl(path), {
            method: "PUT",
            headers,
            body: requestBody,
            ...options,
        });
    }

    /**
     * Sends an HTTP DELETE request.
     *
     * @typeParam T - The expected shape of the parsed response data (defaults to `void` for 204 No Content).
     * @returns A Promise that resolves to an **IFetchHelperResponse<T>**.
     */
    async delete<T = void>(
        path: string = "",
        params?: Record<string, any>,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<IFetchHelperResponse<T>> {
        const fullUrl = this.buildUrl(path, params);
        return this.request<T>(fullUrl, { method: "DELETE", ...options });
    }

    /**
     * Perform a custom HTTP action (GET, POST, PUT, DELETE, etc.).
     *
     * @template T - Expected shape/type of the resolved response data (defaults to `unknown`).
     * @template ReqBody - Optional type of the outgoing JSON request body (defaults to Record<string, any>).
     * @param actionPath - Relative endpoint path.
     * @param body - Optional request payload.
     * @returns Promise<IFetchHelperResponse<T>> - Resolves with the augmented Response.
     */
    async action<T = unknown, ReqBody = Record<string, any>>(
        actionPath: string,
        body?: ReqBody | FormData | URLSearchParams,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
            method?: "GET" | "POST" | "PUT" | "DELETE" | string;
        }
    ): Promise<IFetchHelperResponse<T>> {
        const method = options?.method ?? (body ? "POST" : "GET");
        const headers = new Headers(options?.headers);
        let requestBody: BodyInit | undefined;

        if (body instanceof FormData) {
            requestBody = body;
        } else if (body instanceof URLSearchParams) {
            requestBody = body.toString();
        } else if (body && typeof body === "object") {
            if (!headers.has("Content-Type")) {
                headers.set("Content-Type", "application/json");
            }
            requestBody = JSON.stringify(body);
        }

        return this.request<T>(this.buildUrl(actionPath), {
            method,
            headers,
            body: requestBody,
            ...options,
        });
    }
}


/**
 * Factory class for creating FetchHelper instances.
 * Provides a static method to instantiate FetchHelper objects with specified configurations.
 */
export class FetchHelperFactory {
    static getFetchHelper(baseUrl: string = "", options?: IFetchHelperOptions): FetchHelper {
        return new FetchHelper(baseUrl,options);
    }
}