export type RequestInterceptor = (input: RequestInfo, init: RequestInit) => Promise<[RequestInfo, RequestInit]> | [RequestInfo, RequestInit];
export type ResponseInterceptor = (response: Response) => Promise<Response> | Response;


/**
 * A helper class for making HTTP requests using the Fetch API.
 * 
 * Provides convenient methods for GET, POST, PUT, DELETE, and custom actions,
 * automatically handling URL construction, query parameters, request bodies,
 * and response parsing.
 * 
 * @example
 * ```typescript
 * const api = new FetchHelper("https://api.example.com");
 * const data = await api.get("/users", { page: 1 });
 * ```
 * 
 * @remarks
 * - Automatically sets `Content-Type: application/json` for JSON bodies.
 * - Supports sending `FormData` for file uploads.
 * - Allows specifying response type: `"json"`, `"text"`, `"blob"`, or `"arrayBuffer"`.
 * - Handles errors by throwing with HTTP status and message.
 * 
 * @param baseUrl - The base URL for all requests. Trailing slashes are removed.
 */
export class FetchHelper {
    private baseUrl: string;
    private requestInterceptor?: RequestInterceptor;
    private responseInterceptor?: ResponseInterceptor;    
    /**
     * Initialize a FetchHelpers instance.
     *
     * @param baseUrl - Optional base URL to prepend to all request paths. Trailing slashes are removed from the provided value. Defaults to an empty string.
     * @param options - Optional configuration object for interceptors.
     * @param options.requestInterceptor - Optional callback to intercept or modify requests before they are sent.
     * @param options.responseInterceptor - Optional callback to intercept or modify responses after they are received.
     */
    constructor(baseUrl: string = "", options?: {
        requestInterceptor?: RequestInterceptor;
        responseInterceptor?: ResponseInterceptor;
    }) {
        this.baseUrl = baseUrl.replace(/\/+$/, "");
        this.requestInterceptor = options?.requestInterceptor;
        this.responseInterceptor = options?.responseInterceptor;
    }

    /**
     * Constructs a complete URL by combining the base URL with a path and optional query parameters.
     * 
     * @param path - The path to append to the base URL. If it starts with 'http', it will be used as is.
     * @param params - Optional key-value pairs to be added as query parameters.
     * @returns A complete URL string with the path and query parameters (if provided).
     * 
     * @example
     * // With base URL "https://api.example.com"
     * buildUrl("users", { id: 1 }) // Returns "https://api.example.com/users?id=1"
     * buildUrl("https://other.com/path") // Returns "https://other.com/path"
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
     * Execute an HTTP request using fetch and parse the response into the requested type.
     *
     * @typeParam T - The expected shape of the parsed response.
     *
     * @param url - The URL to request.
     * @param options - Fetch options extended with an optional `responseType` hint that controls how the response body is parsed.
     * @param options.responseType - How to parse the response body:
     *   - "json" (default) — calls `response.json()` and returns the parsed value as T.
     *   - "text" — calls `response.text()` and returns the result as T.
     *   - "blob" — calls `response.blob()` and returns the result as T.
     *   - "arrayBuffer" — calls `response.arrayBuffer()` and returns the result as T.
     *
     * @returns A Promise that resolves to the parsed response of type T.
     *
     * @throws {Error} When the HTTP response is not ok (status outside the 200–299 range).
     *   The thrown error message includes the status, statusText and any available response text body (if reading it succeeds).
     *
     * @remarks
     * - If `options.responseType` is not provided, the method defaults to treating the response as JSON.
     * - The method does not inspect Content-Type headers; it relies solely on the `responseType` option to determine parsing.
     *
     * @example
     * // Expect JSON object
     * const data = await request<MyDataType>('https://api.example.com/data');
     *
     * @example
     * // Expect plain text
     * const text = await request<string>('https://example.com/readme', { responseType: 'text' });
     */
    private async request<T>(
        url: string,
        options: RequestInit & { responseType?: "json" | "text" | "blob" | "arrayBuffer" } = {}
    ): Promise<T> {
        let [finalUrl, finalOptions]: [RequestInfo, RequestInit] = [url, options];

        // Apply request interceptor if available
        if (this.requestInterceptor) {
            [finalUrl, finalOptions] = await this.requestInterceptor(url, options);
        }

        let response = await fetch(finalUrl, finalOptions);

        // Apply response interceptor if available
        if (this.responseInterceptor) {
            response = await this.responseInterceptor(response);
        }

        if (!response.ok) {
            const message = await response.text().catch(() => "");
            throw new Error(`HTTP ${response.status} ${response.statusText}: ${message}`);
        }

        switch (options.responseType) {
            case "text": return (await response.text()) as unknown as T;
            case "blob": return (await response.blob()) as unknown as T;
            case "arrayBuffer": return (await response.arrayBuffer()) as unknown as T;
            default: return (await response.json()) as T;
        }
    }
    /**
     * Perform an HTTP GET request to a constructed URL and return the parsed response.
     *
     * Uses this.buildUrl(path, params) to construct the full URL and this.request to perform the fetch.
     *
     * @typeParam T - The expected type of the parsed response body.
     * @param path - Endpoint path to append to the base URL. Defaults to an empty string.
     * @param params - Optional query parameters to serialize and include in the URL.
     * @param options - Additional fetch options merged with { method: "GET" }.
     *                  May include a responseType hint which controls how the response body is parsed:
     *                  - "json" (default): parses response as JSON and returns the result as T.
     *                  - "text": returns response as string.
     *                  - "blob": returns response as Blob.
     *                  - "arrayBuffer": returns response as ArrayBuffer.
     *                  Other standard RequestInit fields (headers, credentials, etc.) are forwarded.
     * @returns A Promise that resolves to the parsed response of type T.
     * @throws Throws if the network request fails, the response has an error status, or if parsing fails
     *         according to the specified responseType.
     *
     * @example
     * const items = await client.get<MyItem[]>('/items', { page: 1 }, { responseType: 'json' });
     */
    async get<T>(
        path: string = "",
        params?: Record<string, any>,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<T> {
        const fullUrl = this.buildUrl(path, params);
        return this.request<T>(fullUrl, { method: "GET", ...options });
    }

    /**
     * Send a POST request to the service and return the parsed response as type T.
     *
     * The method accepts a relative path (appended to the instance base URL), an optional
     * request body (either a FormData instance or a plain object), and additional
     * fetch options. Plain objects are serialized to JSON and will have the
     * "Content-Type: application/json" header set; FormData bodies are sent as-is.
     *
     * Note: headers from `options` are used to initialize the request headers, but any
     * properties included in `options` (including `headers` or `body`) will override
     * the values constructed by this method when `options` is spread into the final
     * request. Errors thrown by the underlying request implementation are propagated.
     *
     * @typeParam T - Expected shape of the parsed response.
     * @param path - Relative path to POST to (default: "").
     * @param body - Request payload. If a FormData instance is provided it is sent directly;
     *               if a plain object is provided it will be JSON-stringified.
     * @param options - Additional fetch options (extends RequestInit) with an optional
     *                  `responseType` hint: "json" | "text" | "blob" | "arrayBuffer".
     * @returns A promise that resolves with the parsed response of type T.
     */
    async post<T>(
        path: string = "",
        body?: Record<string, any> | FormData,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<T> {
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
     * Perform an HTTP PUT request to the built URL and return the parsed response.
     *
     * The method accepts either a plain object (which will be JSON-stringified and
     * sent with Content-Type: application/json) or a FormData instance (sent as-is,
     * letting the browser set the appropriate multipart content type).
     *
     * Headers passed in via options are used as the base for the request and the
     * JSON Content-Type header will be added when a plain object body is provided.
     * A custom headers value present on options may affect/replace the final headers
     * used for the request.
     *
     * The request is sent via this.request(...) with the URL produced by this.buildUrl(path).
     *
     * @typeParam T - Expected shape of the parsed response.
     * @param path - Path appended to the instance base URL (defaults to an empty string).
     * @param body - Request payload: either a plain object (sent as JSON) or FormData (sent as multipart).
     * @param options - Additional fetch RequestInit options. Also supports a non-standard
     *                  responseType field ("json" | "text" | "blob" | "arrayBuffer") which
     *                  controls how the response is parsed by this.request.
     * @returns A Promise that resolves to the parsed response of type T.
     * @throws May reject for network errors or if this.request rejects (for example on non-OK HTTP responses).
     *
     * @example
     * // Send JSON
     * const updated = await api.put<User>("/users/123", { name: "Alice" });
     *
     * @example
     * // Send multipart form data
     * const form = new FormData();
     * form.append("avatar", fileInput.files[0]);
     * await api.put("/users/123/avatar", form);
     */
    async put<T>(
        path: string = "",
        body?: Record<string, any> | FormData,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<T> {
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
     * Sends an HTTP DELETE request to a URL constructed from the given path and query parameters,
     * and returns the parsed response typed as T.
     *
     * @typeParam T - Expected shape of the parsed response.
     *
     * @param path - The request path (appended to the instance base URL). Defaults to an empty string.
     * @param params - Optional record of query parameters to be serialized into the request URL.
     * @param options - Optional fetch options (extends RequestInit). Includes an additional
     *                  `responseType` hint which can be one of "json", "text", "blob", or "arrayBuffer"
     *                  to control how the response is parsed.
     *
     * @returns A Promise that resolves to the response parsed as T.
     *
     * @throws Will reject if the underlying request fails (network error) or if the request
     *         implementation rejects on non-successful HTTP responses.
     */
    async delete<T>(
        path: string = "",
        params?: Record<string, any>,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
        }
    ): Promise<T> {
        const fullUrl = this.buildUrl(path, params);
        return this.request<T>(fullUrl, { method: "DELETE", ...options });
    }
    /**
     * Perform an HTTP action against a given action path and return the parsed response.
     *
     * The method will:
     * - Build a full URL using this.buildUrl(actionPath).
     * - Infer the HTTP method as "POST" when a body is provided, otherwise "GET", unless overridden by options.method.
     * - Treat a FormData body as-is (no JSON conversion) and avoid setting "Content-Type".
     * - Serialize plain object bodies to JSON and set "Content-Type: application/json".
     * - Initialize headers from options.headers (merged into a Headers instance) and forward all options to this.request.
     * - Forward a responseType option ("json" | "text" | "blob" | "arrayBuffer") to this.request for response parsing.
     *
     * @template T - Expected shape/type of the resolved response.
     * @param actionPath - Relative endpoint path to append to the instance base URL.
     * @param body - Optional request payload; either a FormData (sent as-is) or a plain object (JSON-serialized).
     * @param options - Optional fetch options; may include headers, method (overrides inferred method), and responseType.
     * @returns Promise<T> - Resolves with the response parsed according to the configured responseType (as handled by this.request).
     * @throws Any errors thrown by this.request (network errors, non-OK responses if this.request rejects, or parsing errors).
     *
     * @example
     * // POST JSON and expect a typed response
     * const user = await api.action<User>('users/create', { name: 'Alice' });
     *
     * @example
     * // Upload FormData
     * const fd = new FormData();
     * fd.append('file', fileInput.files[0]);
     * await api.action('/upload', fd, { method: 'POST' });
     */
    async action<T>(
        actionPath: string,
        body?: Record<string, any> | FormData,
        options?: RequestInit & {
            responseType?: "json" | "text" | "blob" | "arrayBuffer";
            method?: "GET" | "POST" | "PUT" | "DELETE";
        }
    ): Promise<T> {
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
