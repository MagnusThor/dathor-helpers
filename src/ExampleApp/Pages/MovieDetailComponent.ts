import { PageComponent } from "../../UI/Component/Core/PageComponent";
import { IPageComponentProperties } from "../../UI/Interfaces/IPageComponentProperties";
import { Router } from "../../UI/Router/Router";
import { AddToFavoritesAction } from "../Actions/AddToFavoritesAction";
import { IMovieDetailState } from "../Interfaces/IMovieDetailState";
import { IMovieDetails } from "../Interfaces/IMovieDetails";
import { serviceLocator } from "../../UI/Service/ServiceLocator";
import { MovieApiService } from "../Services/MovieService";

export class MovieDetailComponent extends PageComponent<IMovieDetailState> {

    // Declare a private property to hold the instance of the AddToCartAction component
    private _addToCartComponent: AddToFavoritesAction | null = null;

    constructor(properties: IPageComponentProperties<IMovieDetailState>) {
        super({
            ...properties, // Inherit base properties like id, path, router, routeParams
            // Provide the template function directly in properties
            template: (component: MovieDetailComponent) => {
                // Safely access state properties using non-null assertion as state is initialized
                const { movieId: movieId, title: title, plot: plot,year:year, loading, error } = 
                component.properties!.state!;
                const router: Router = component.properties!.router;

                if (loading) {
                    return /*html*/`
                        <div class="product-detail-page p-6 bg-white shadow rounded-lg text-center">
                            <p class="text-gray-600 text-lg">Loading product details for ID: ${movieId}...</p>
                            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div>
                        </div>
                    `;
                }

                if (error) {
                    return /*html*/`
                        <div class="product-detail-page p-6 bg-white shadow rounded-lg text-center text-red-600">
                            <h1 class="text-2xl font-bold mb-4">Error Loading Product</h1>
                            <p>${error}</p>
                            <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                                    data-event-click="goBack">
                                Go Back
                            </button>
                        </div>
                    `;
                }

                if (!movieId) {
                    return /*html*/`
                        <div class="product-detail-page p-6 bg-white shadow rounded-lg text-center">
                            <h1 class="text-2xl font-bold text-gray-900 mb-4">Movie Not Found</h1>
                            <p class="text-gray-700">No ID was provided or found in the URL.</p>
                            <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                                    data-event-click="goBack">
                                Go Back
                            </button>
                        </div>
                    `;
                }

                return /*html*/`
                    <div id="${component.properties.id}" class="product-detail-page p-6 bg-white shadow rounded-lg mb-6">
                        <h1 class="text-3xl font-bold text-gray-900 mb-4">Product Details for ID: ${movieId}</h1>
                        <h2 class="text-2xl font-semibold text-gray-800 mb-2">${title}</h2>
                        <p class="text-gray-700 mb-4">${plot}</p>

                        <div id="add-to-cart-container-${movieId}" class="my-6">
                            </div>
                        
                        <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors duration-200"
                                data-event-click="goBack">
                            Go Back
                        </button>
                    </div>
                `;
            },
            state: { // Set initial state
                movieId: null,
                title: '',
                plot: '',
                loading: true, // Start in a loading state
                error: undefined
            } as IMovieDetailState, // Assert initial state type
            // Define event handlers for elements within this component's template
            eventHandlers: {
                click: (event: Event) => {
                    const target = event.target as HTMLElement;
                    if (target.dataset.eventClick === 'goBack') {
                        (this as MovieDetailComponent).goBack();
                    }
                }
            }
        });

    


    }

    // Lifecycle method called when the page component is entered
    public async onEnter(prevProps?: IPageComponentProperties<IMovieDetailState>): Promise<void> {
        await super.onEnter(prevProps); // Call base class onEnter
        console.log(`[MovieDetailComponent] onEnter: current path is ${this.properties?.path}`);

        const movieId = this.properties!.routeParams!.id || null;
        console.log(`[MovieDetailComponent] Product ID from URL parameters: ${movieId}`);

        this.updateState({ movieId: movieId, loading: true, error: undefined });

        if (movieId) {
            try {
                const movieData = await this.fetchMovieData(movieId);
                this.updateState({
                    title: movieData.title,
                    plot: movieData.plot,
                    loading: false,
                    error: undefined
                });
                
                this.createAddToCartComponent(movieId);

            } catch (err) {
                console.error("Failed to fetch product data:", err);
                this.updateState({
                    error: `Could not load product with ID: ${movieId}. ${err instanceof Error ? err.message : String(err)}`,
                    loading: false
                });
            }
        } else {
            this.updateState({ loading: false, error: "No product ID found in URL for details." });
        }
    }

    // Lifecycle method called when the page component is left
    public onLeave(): void {
        super.onLeave();
        console.log(`[MovieDetailComponent] onLeave: path was ${this.properties?.path}`);
        // --- CRITICAL STEP: Dispose of the child component when the parent leaves ---
        if (this._addToCartComponent) {
            this._addToCartComponent.dispose();
            this._addToCartComponent = null; // Clear reference
        }
    }

    private async fetchMovieData(id: string): Promise<IMovieDetails> {
        return new Promise(async(resolve, reject) => {
            setTimeout(async () => {


                const service = serviceLocator.get<MovieApiService>("MovieApiService");

                const movieDetails = await service.getMovieDetails(id);
                if (movieDetails === null) {
                    reject(new Error(`Movie with ID ${id} not found.`));
                } else {
                    resolve(movieDetails);
                }
             
            }, 700); // 700ms delay
        });
    }

    /**
     * Creates, adds, and renders the AddToCartAction component.
     * @param id The ID of the product to associate with the AddToCart button.
     */
    private async createAddToCartComponent(id: string): Promise<void> {
        // Ensure the main component's element exists and is rendered
        if (!this._element) {
            console.error(`[MovieDetailComponent] Cannot create AddToCartAction: Main component element not found.`);
            return;
        }

        // Find the specific container div within this component's rendered HTML
        const containerElement = this._element.querySelector(`#add-to-cart-container-${id}`);

        if (containerElement) {
            // Dispose of any existing AddToCartComponent instance if this is a re-render
            if (this._addToCartComponent) {
                this._addToCartComponent.dispose();
            }

            this._addToCartComponent = new AddToFavoritesAction({
                id: `add-to-favorites-button-${id}`, // Unique ID for the button instance
                movieId: id,
                rating: 1, // Default quantity
                label: `Add ${id} to Favorites`,
                componentInstance: this // Pass current component for context in event handlers
            });

            // Add the AddToCartAction as a child component of MovieDetailComponent.
            // This ensures it benefits from the parent's lifecycle management (e.g., disposal).
            this.addChild(this._addToCartComponent);

            // Render the AddToCartAction component and append its result to the container
            const renderResult = await this._addToCartComponent.render();
            if (renderResult.result) {
                // Clear the container before appending, just in case
                containerElement.innerHTML = '';
                containerElement.appendChild(renderResult.result);
                console.log(`[MovieDetailComponent] AddToCartAction component mounted for product ${id}.`);
            } else {
                console.warn(`[MovieDetailComponent] AddToCartAction render resulted in no element.`);
            }
        } else {
            console.error(`[MovieDetailComponent] Container #add-to-cart-container-${id} not found for AddToCartAction.`);
        }
    }

    // Method to navigate back using the router
    goBack(): void {
        this.properties!.router.goBack(); // Assumes your Router class has a `goBack` method
    }
}