import { PageComponent } from "../../UI/Components/Core/PageComponent";
import { IPageComponentProperties } from "../../UI/Interfaces/IPageComponentProperties";
import { IPageState } from "../../UI/Interfaces/IPageState";
import { Router } from "../../UI/Router/Router";

// Define specific state for HomePageComponent
export interface IHomePageState extends IPageState {
    welcomeMessage: string;
    clickCount: number;
}

export class HomePageComponent extends PageComponent<IHomePageState> {
    constructor(properties: IPageComponentProperties<IHomePageState>) {
        super({
            ...properties, // Inherit base properties like id, path, router
            // Provide the template function directly in properties
            template: (component: HomePageComponent) => { 
                // 'component' here is the HomePageComponent instance
                const { welcomeMessage, clickCount } = component.properties!.state!; 
                // Access state
                const router: Router = component.properties!.router; // Access router from properties

                return /*html*/`
                    <div class="home-page p-6 bg-white shadow rounded-lg mb-6">
                        <h1 class="text-3xl font-bold text-gray-900 mb-4">${welcomeMessage}</h1>
                        <p class="text-gray-700 mb-4">
                            Welcome to your single-page application built with a custom framework!
                            This is the home page.
                        </p>
                        <p class="text-gray-700 mb-4">
                            You have clicked the button <span class="font-bold text-blue-600">${clickCount}</span> times.
                        </p>
                        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                                data-event-click="handleClick">
                            Click Me!
                        </button>
                        
                        <div class="mt-8">
                            <h2 class="text-xl font-semibold mb-3 text-gray-800">Explore Further:</h2>
                            <ul class="list-disc list-inside text-blue-600 space-y-2">
                                <li>
                                    <a href="#/products/123" class="hover:underline">Go to Product 123 (via hash link)</a>
                                </li>
                                <li>
                                    <button class="text-blue-600 hover:underline cursor-pointer focus:outline-none" 
                                            data-event-click="goToProductPage">
                                        Go to Product 456 (programmatic)
                                    </button>
                                </li>
                                <li>
                                    <a href="#/about" class="hover:underline">Go to About Us (will show 404 if not defined)</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                `;
            },
            state: { // Set initial state for HomePageComponent
                welcomeMessage: properties.state?.welcomeMessage || "Hello from Home Page!",
                clickCount: properties.state?.clickCount || 0
            },
            // Define event handlers for elements within this component's template
            eventHandlers: {
                // 'click' is the DOM event name. This handler will be applied to the component's root.
                // We assume _applyEventHandlers is smart enough to delegate based on data-event-click
                // or you apply listeners directly in render for specific elements.
                // For simplicity here, we'll map a generic click to a method.
                // In a real app, you might parse data-event-click to find the method name.
                // For now, we'll assume a delegated click that checks event.target.
                click: (event: Event) => {
                    const target = event.target as HTMLElement;
                    if (target.dataset.eventClick === 'handleClick') {
                        (this as HomePageComponent).handleClick(event);
                    } else if (target.dataset.eventClick === 'goToProductPage') {
                        (this as HomePageComponent).goToProductPage(event);
                    }
                }
            }
        });
    }

    // Event handler method for the button click
    public handleClick(event: Event): void {
        console.log('Home Page Button clicked!', event);
        // Update the component's state, which will trigger a re-render if observed.
        this.updateState({ clickCount: (this.properties?.state!.clickCount || 0) + 1 });
    }

    // Event handler for programmatic navigation
    public goToProductPage(event: Event): void {
        
        event.preventDefault(); // Prevent default link behavior if applicable
        console.log('Navigating programmatically to Product 456...');
        // Use the router instance passed in properties to navigate
        this.properties!.router.navigate('/products/456');
    }

    // Lifecycle method called when the page component is entered
    public async onEnter(prevProps?: IPageComponentProperties<IHomePageState>): Promise<void> {
        await super.onEnter(prevProps); // Call base class onEnter
        console.log(`[HomePageComponent] onEnter: current path is ${this.properties!.path}`);
        // You could fetch initial data here, for example
        // this.updateState({ isLoading: true });
        // const data = await fetchDataForHome();
        // this.updateState({ isLoading: false, data: data });
    }

    // Lifecycle method called when the page component is left
    public onLeave(): void {
        super.onLeave(); // Call base class onLeave
        console.log(`[HomePageComponent] onLeave: path was ${this.properties!.path}`);
        // Clean up subscriptions or resources here
    }
}