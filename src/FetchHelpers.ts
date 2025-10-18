export type RequestInterceptor = (input: RequestInfo, init: RequestInit) => Promise<[RequestInfo, RequestInit]> | [RequestInfo, RequestInit];
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;

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
 * A helper class for making HTTP requests using the Fetch API.
 * * Provides convenient methods for GET, POST, PUT, DELETE, and custom actions,
 * automatically handling URL construction, query parameters, request bodies,
 * and response parsing.
 * * @example
 * ```typescript
 * const api = new FetchHelper("[https://api.example.com](https://api.example.com)", { 
 * defaultHeaders: { Authorization: "Bearer token" } 
 * });
 * // Result is an IFetchHelperResponse<User[]>, inheriting properties like .status
 * const result = await api.get<User[]>("/users", { page: 1 });
 * * console.log(result.data.length); // Accesses the parsed body
 * console.log(result.status);     // Accesses the inherited Response status
 * ```
 * * @remarks
 * - All public methods now return an **IFetchHelperResponse<T>** which extends the native `Response` object and includes the parsed `.data`.
 * - **Interceptors** are still supported and work on the raw request/response objects.
 * - Supports setting `defaultHeaders` in the constructor for automatic inclusion in every request.
 * - Automatically sets `Content-Type: application/json` for JSON bodies.
 * * @param baseUrl - The base URL for all requests. Trailing slashes are removed.
 */
export class FetchHelper {
    private baseUrl: string;
    private requestInterceptor?: RequestInterceptor;
    private responseInterceptor?: ResponseInterceptor;
    private defaultHeaders: HeadersInit;

    /**
     * Initialize a FetchHelpers instance.
     *
     * @param baseUrl - Optional base URL to prepend to all request paths. Trailing slashes are removed from the provided value. Defaults to an empty string.
     * @param options - Optional configuration object for interceptors and global headers.
     * @param options.requestInterceptor - Optional callback to intercept or modify requests before they are sent.
     * @param options.responseInterceptor - Optional callback to intercept or modify responses after they are received.
     * @param options.defaultHeaders - Optional headers that will be merged into every request (e.g., Authorization).
     */
    constructor(baseUrl: string = "", options?: {
        requestInterceptor?: RequestInterceptor;
        responseInterceptor?: ResponseInterceptor;
        defaultHeaders?: HeadersInit;
    }) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
        this.requestInterceptor = options?.requestInterceptor;
        this.responseInterceptor = options?.responseInterceptor;
        this.defaultHeaders = options?.defaultHeaders ?? {};
    }

    /**
     * Constructs a complete URL by combining the base URL with a path and optional query parameters.
     * * @param path - The path to append to the base URL. If it starts with 'http', it will be used as is.
     * @param params - Optional key-value pairs to be added as query parameters.
     * @returns A complete URL string with the path and query parameters (if provided).
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
     * Execute an HTTP request using fetch, parse the response, and augment the Response object.
     *
     * @typeParam T - The expected shape of the parsed response data.
     *
     * @param url - The URL to request.
     * @param options - Fetch options extended with an optional `responseType` hint.
     *
     * @returns A Promise that resolves to an **IFetchHelperResponse<T>**, which extends the raw Response.
     *
     * @throws {Error} When the HTTP response is not ok (status outside the 200–299 range).
     */
    private async request<T>(
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
            throw new Error(`HTTP ${response.status} ${response.statusText}: ${message}`);
        }

        let data: T;
        // Clone the response before reading the body, as the body can only be read once.
        const responseClone = response.clone(); 

        // Read and parse the response body based on responseType
        switch (options.responseType) {
            case "text":
                data = (await responseClone.text()) as unknown as T;
                break;
            case "blob":
                data = (await responseClone.blob()) as unknown as T;
                break;
            case "arrayBuffer":
                data = (await responseClone.arrayBuffer()) as unknown as T;
                break;
            default:
                data = (await responseClone.json()) as T;
        }

        // Augment the original Response object with the parsed data
        // We cast the merged object to the required type IFetchHelperResponse<T>
        return Object.assign(response, { data }) as IFetchHelperResponse<T>;
    }

    // --- Public HTTP Methods ---

    /**
     * Perform an HTTP GET request to a constructed URL and return the augmented response.
     *
     * @typeParam T - The expected type of the parsed response data.
     * @param path - Endpoint path to append to the base URL. Defaults to an empty string.
     * @param params - Optional query parameters to serialize and include in the URL.
     * @param options - Additional fetch options merged with { method: "GET" }.
     * @returns A Promise that resolves to an **IFetchHelperResponse<T>** (Response object with the `.data` property).
     */
    async get<T>(
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
     * Send a POST request and return the augmented response.
     *
     * @typeParam T - Expected shape of the parsed response data.
     * @typeParam ReqBody - Optional type of the outgoing JSON request body (defaults to Record<string, any>).
     * @param path - Relative path to POST to.
     * @param body - Request payload (FormData or plain object, which is JSON-stringified).
     * @param options - Additional fetch options.
     * @returns A promise that resolves with an **IFetchHelperResponse<T>**.
     */
    async post<T, ReqBody = Record<string, any>>(
        path: string = "",
        body?: ReqBody | FormData,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<IFetchHelperResponse<T>> {
        const isFormData = body instanceof FormData;
        const headers = new Headers(options?.headers);
        let requestBody: BodyInit | undefined;

        if (isFormData) {
            requestBody = body;
        } else if (body && typeof body === "object") {
            headers.set("Content-Type", "application/json");
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
     * Perform an HTTP PUT request and return the augmented response.
     *
     * @typeParam T - Expected shape of the parsed response data.
     * @typeParam ReqBody - Optional type of the outgoing JSON request body (defaults to Record<string, any>).
     * @param path - Path appended to the instance base URL.
     * @param body - Request payload (FormData or plain object).
     * @param options - Additional fetch options.
     * @returns A Promise that resolves to an **IFetchHelperResponse<T>**.
     */
    async put<T, ReqBody = Record<string, any>>(
        path: string = "",
        body?: ReqBody | FormData,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<IFetchHelperResponse<T>> {
        const isFormData = body instanceof FormData;
        const headers = new Headers(options?.headers);
        let requestBody: BodyInit | undefined;

        if (isFormData) {
            requestBody = body;
        } else if (body && typeof body === "object") {
            headers.set("Content-Type", "application/json");
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
     * Sends an HTTP DELETE request and returns the augmented response.
     *
     * @typeParam T - The expected shape of the parsed response data (defaults to `void` for 204 No Content).
     * @param path - The request path.
     * @param params - Optional record of query parameters.
     * @param options - Optional fetch options.
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
        // Note: DELETE requests here do not support a body, only query params, aligning with REST best practices.
        return this.request<T>(fullUrl, { method: "DELETE", ...options });
    }

    /**
     * Perform a custom HTTP action (GET, POST, PUT, DELETE, etc.) and return the augmented response.
     *
     * @template T - Expected shape/type of the resolved response data.
     * @template ReqBody - Optional type of the outgoing JSON request body (defaults to Record<string, any>).
     * @param actionPath - Relative endpoint path.
     * @param body - Optional request payload.
     * @param options - Optional fetch options including `method` and `responseType`.
     * @returns Promise<IFetchHelperResponse<T>> - Resolves with the augmented Response.
     */
    async action<T, ReqBody = Record<string, any>>(
        actionPath: string,
        body?: ReqBody | FormData,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
            method?: "GET" | "POST" | "PUT" | "DELETE" | string; // Allow custom methods
        }
    ): Promise<IFetchHelperResponse<T>> {
        const method = options?.method ?? (body ? "POST" : "GET");
        const isFormData = body instanceof FormData;
        const headers = new Headers(options?.headers);
        let requestBody: BodyInit | undefined;

        if (isFormData) {
            requestBody = body;
        } else if (body && typeof body === "object") {
            headers.set("Content-Type", "application/json");
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