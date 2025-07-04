// Core/Router.ts

import { PageComponent } from "../Component/Core/PageComponent";
import { IPageComponentProperties } from "../Interfaces/IPageComponentProperties";
import { IRoute } from "../Interfaces/IRoute";
import { IRouter } from "../Interfaces/IRouter";

export class Router implements IRouter {
    private routes: IRoute[];
    private outletElement: HTMLElement | null = null;
    private currentComponent: PageComponent<any> | null = null; // Track current page component
    private isStarted: boolean = false; // Flag to ensure router only starts once

    constructor(routes: IRoute[], private outletSelector: string) {
        this.routes = routes;
    }

    component: (new (properties: IPageComponentProperties<any>) => PageComponent<any>) | undefined;

    defaultProps?: IPageComponentProperties<any> | undefined;

    public start(): void {
        if (this.isStarted) {
            console.warn("Router has already been started.");
            return;
        }

        this.outletElement = document.querySelector(this.outletSelector);
        if (!this.outletElement) {
            console.error(`Router outlet element not found: ${this.outletSelector}`);
            return;
        }

        // Listen for hash changes
        window.addEventListener('hashchange', this.handleHashChange.bind(this));
        // Handle the initial route load
        this.handleHashChange();
        this.isStarted = true;
        console.log("Router started successfully.");
    }

    public stop(): void {
        if (!this.isStarted) {
            console.warn("Router is not running, cannot stop.");
            return;
        }
        window.removeEventListener('hashchange', this.handleHashChange.bind(this));
        // Dispose current component if it exists
        if (this.currentComponent) {
            this.currentComponent.dispose();
            this.currentComponent = null;
        }
        this.outletElement = null;
        this.isStarted = false;
        console.log("Router stopped.");
    }

    // NEW: Method to navigate to a specific path
    public navigate(path: string): void {
        // Ensure the path starts with '#' for hash routing
        const targetPath = path.startsWith('#') ? path : `#${path}`;
        if (window.location.hash !== targetPath) {
            window.location.hash = targetPath; // This will trigger 'hashchange' event
        } else {
            // If the hash is the same, manually trigger route handling
            // This is important for navigating to the same route with different params (e.g., /products/1 -> /products/2)
            this.handleHashChange();
        }
    }

    // NEW: Method to navigate back in browser history
    public goBack(): void {
        console.log('Router: Navigating back in history.');
        window.history.back();
    }


    private async handleHashChange(): Promise<void> {
        const path = window.location.hash.slice(1) || '/';

        console.log(`Router: Handling hash change to: ${path}`);

        let matchedRoute: IRoute | undefined;
        let routeParams: { [key: string]: string } = {};

        // Find a matching route and extract parameters
        for (const route of this.routes) {
            const routeRegex = new RegExp(`^${route.path.replace(/:([a-zA-Z0-9_]+)/g, '([a-zA-Z0-9_\\-]+)')}$`);
            const match = path.match(routeRegex);

            if (match) {
                matchedRoute = route;
                const paramNames = (route.path.match(/:([a-zA-Z0-9_]+)/g) || []).map(p => p.slice(1));
                paramNames.forEach((name, index) => {
                    routeParams[name] = match![index + 1];
                });
                break;
            }
        }

        if (matchedRoute && this.outletElement) {
            if (this.currentComponent) {
                this.currentComponent.onLeave();
                this.currentComponent.dispose();
                this.currentComponent = null;
            }

            const ComponentClass = matchedRoute.component;

            const propsFromRoute: { id?: string;[key: string]: any } = matchedRoute.defaultProps || {};

            const { id = 'generated-id-' + Math.random().toString(36).substring(2, 10), ...restDefaultProps } = propsFromRoute;

            const componentProps: IPageComponentProperties<any> = {
                ...restDefaultProps, // Includes all other properties from defaultProps
                id: id,              // Assign the now guaranteed string 'id'
                path: matchedRoute.path,
                router: this,
                routeParams: routeParams
            };


            this.currentComponent = new ComponentClass(componentProps) as PageComponent<any>;

            try {
                const renderResult = await this.currentComponent.render();
                if (renderResult.result) {
                    this.outletElement.innerHTML = '';
                    this.outletElement.appendChild(renderResult.result);
                    console.log(`Router: Rendered component for path "${path}"`);
                    await this.currentComponent.onEnter();
                } else {
                    console.error(`Router: Render result for path "${path}" was empty.`);
                }
            } catch (error) {
                console.error(`Router: Error rendering component for path "${path}":`, error);
                this.navigate('/error');
            }
        } else if (this.outletElement) {
            console.warn(`Router: No route found for path: ${path}. Showing 404.`);
            if (this.currentComponent) {
                this.currentComponent.onLeave();
                this.currentComponent.dispose();
                this.currentComponent = null;
            }
            this.outletElement.innerHTML = `<div class="p-6 text-center text-red-500">
                                                <h1 class="text-4xl font-bold mb-4">404 - Not Found</h1>
                                                <p>The page <code>${path}</code> you are looking for does not exist.</p>
                                                <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded" onclick="window.location.hash = '/'">Go to Home</button>
                                            </div>`;
        }
    }


}