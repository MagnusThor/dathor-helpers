import { PageComponent } from "../../UI/Components/Core/PageComponent";
import { IPageComponentProperties } from "../../UI/Interfaces/IPageComponentProperties";
import { IPageState } from "../../UI/Interfaces/IPageState";
import { Router } from "../../UI/Router/Router";
import { AddToCartAction } from "./Actions/AddToCartAction";

export interface IProductDetailState extends IPageState {
    productId: string | null;
    productName: string;
    productDescription: string;
    loading: boolean;
    error: string | undefined;
}

export class ProductDetailComponent extends PageComponent<IProductDetailState> {

    // Declare a private property to hold the instance of the AddToCartAction component
    private _addToCartComponent: AddToCartAction | null = null;

    constructor(properties: IPageComponentProperties<IProductDetailState>) {
        super({
            ...properties, // Inherit base properties like id, path, router, routeParams
            // Provide the template function directly in properties
            template: (component: ProductDetailComponent) => {
                // Safely access state properties using non-null assertion as state is initialized
                const { productId, productName, productDescription, loading, error } = component.properties!.state!;
                const router: Router = component.properties!.router;

                if (loading) {
                    return /*html*/`
                        <div class="product-detail-page p-6 bg-white shadow rounded-lg text-center">
                            <p class="text-gray-600 text-lg">Loading product details for ID: ${productId}...</p>
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

                if (!productId) {
                    return /*html*/`
                        <div class="product-detail-page p-6 bg-white shadow rounded-lg text-center">
                            <h1 class="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
                            <p class="text-gray-700">No product ID was provided or found in the URL.</p>
                            <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                                    data-event-click="goBack">
                                Go Back
                            </button>
                        </div>
                    `;
                }

                return /*html*/`
                    <div id="${component.properties.id}" class="product-detail-page p-6 bg-white shadow rounded-lg mb-6">
                        <h1 class="text-3xl font-bold text-gray-900 mb-4">Product Details for ID: ${productId}</h1>
                        <h2 class="text-2xl font-semibold text-gray-800 mb-2">${productName}</h2>
                        <p class="text-gray-700 mb-4">${productDescription}</p>

                        <div id="add-to-cart-container-${productId}" class="my-6">
                            </div>
                        
                        <button class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded transition-colors duration-200"
                                data-event-click="goBack">
                            Go Back
                        </button>
                    </div>
                `;
            },
            state: { // Set initial state
                productId: null,
                productName: '',
                productDescription: '',
                loading: true, // Start in a loading state
                error: undefined
            } as IProductDetailState, // Assert initial state type
            // Define event handlers for elements within this component's template
            eventHandlers: {
                click: (event: Event) => {
                    const target = event.target as HTMLElement;
                    if (target.dataset.eventClick === 'goBack') {
                        (this as ProductDetailComponent).goBack();
                    }
                }
            }
        });
    }

    // Lifecycle method called when the page component is entered
    public async onEnter(prevProps?: IPageComponentProperties<IProductDetailState>): Promise<void> {
        await super.onEnter(prevProps); // Call base class onEnter
        console.log(`[ProductDetailComponent] onEnter: current path is ${this.properties?.path}`);

        const productId = this.properties!.routeParams!.id || null;
        console.log(`[ProductDetailComponent] Product ID from URL parameters: ${productId}`);

        this.updateState({ productId, loading: true, error: undefined });

        if (productId) {
            try {
                const productData = await this.fetchProductData(productId);
                this.updateState({
                    productName: productData.name,
                    productDescription: productData.description,
                    loading: false,
                    error: undefined
                });
                
                // --- CRITICAL STEP: Create and render the AddToCartAction after product data is loaded ---
                this.createAddToCartComponent(productId);

            } catch (err) {
                console.error("Failed to fetch product data:", err);
                this.updateState({
                    error: `Could not load product with ID: ${productId}. ${err instanceof Error ? err.message : String(err)}`,
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
        console.log(`[ProductDetailComponent] onLeave: path was ${this.properties?.path}`);
        // --- CRITICAL STEP: Dispose of the child component when the parent leaves ---
        if (this._addToCartComponent) {
            this._addToCartComponent.dispose();
            this._addToCartComponent = null; // Clear reference
        }
    }

    // --- Private Helper Methods ---

    // Simulates an asynchronous API call to fetch product data
    private async fetchProductData(id: string): Promise<{ name: string; description: string }> {
        return new Promise((resolve, reject) => {
            setTimeout(() => { // Simulate network delay
                if (id === '123') {
                    resolve({ name: 'Awesome Gadget 123', description: 'A highly advanced and essential gadget for modern life. It does everything!' });
                } else if (id === '456') {
                    resolve({ name: 'Super Widget 456', description: 'This is the super widget 456, known for its incredible durability and efficiency.' });
                } else if (id === 'abc') {
                    resolve({ name: 'Mystery Item ABC', description: 'An enigmatic item with unknown properties and a mysterious past. Buyer beware!' });
                } else {
                    reject(new Error('Product not found for this ID.')); // Simulate 404 or other error
                }
            }, 700); // 700ms delay
        });
    }

    /**
     * Creates, adds, and renders the AddToCartAction component.
     * @param productId The ID of the product to associate with the AddToCart button.
     */
    private async createAddToCartComponent(productId: string): Promise<void> {
        // Ensure the main component's element exists and is rendered
        if (!this._element) {
            console.error(`[ProductDetailComponent] Cannot create AddToCartAction: Main component element not found.`);
            return;
        }

        // Find the specific container div within this component's rendered HTML
        const containerElement = this._element.querySelector(`#add-to-cart-container-${productId}`);

        if (containerElement) {
            // Dispose of any existing AddToCartComponent instance if this is a re-render
            if (this._addToCartComponent) {
                this._addToCartComponent.dispose();
            }

            this._addToCartComponent = new AddToCartAction({
                id: `add-to-cart-button-${productId}`, // Unique ID for the button instance
                productId: productId,
                quantity: 1, // Default quantity
                label: `Add ${productId} to Cart`,
                componentInstance: this // Pass current component for context in event handlers
            });

            // Add the AddToCartAction as a child component of ProductDetailComponent.
            // This ensures it benefits from the parent's lifecycle management (e.g., disposal).
            this.addChild(this._addToCartComponent);

            // Render the AddToCartAction component and append its result to the container
            const renderResult = await this._addToCartComponent.render();
            if (renderResult.result) {
                // Clear the container before appending, just in case
                containerElement.innerHTML = '';
                containerElement.appendChild(renderResult.result);
                console.log(`[ProductDetailComponent] AddToCartAction component mounted for product ${productId}.`);
            } else {
                console.warn(`[ProductDetailComponent] AddToCartAction render resulted in no element.`);
            }
        } else {
            console.error(`[ProductDetailComponent] Container #add-to-cart-container-${productId} not found for AddToCartAction.`);
        }
    }

    // Method to navigate back using the router
    goBack(): void {
        this.properties!.router.goBack(); // Assumes your Router class has a `goBack` method
    }
}