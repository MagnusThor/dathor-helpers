import { IUIComponentPropertyBag } from "../../../UI/Interfaces/IUIComponentPropertyBag";
import { Router } from "../../../UI/Router/Router";
import { UIComponentBase } from "../../../UI/UIComponent";
import { IMovieDetails } from "../../Interfaces/IMovieDetails";

// NEW: Properties for a single Movie Card Component
export interface IMovieCardComponentProperties extends IUIComponentPropertyBag {
    movie: IMovieDetails;
    router: Router; // Pass router for navigation
}

export class MovieCardComponent extends UIComponentBase {

    constructor(properties: IMovieCardComponentProperties) {
        super({
            ...properties,
            template: (component: MovieCardComponent) => {
                const { movie } = component.properties as IMovieCardComponentProperties;

                return /*html*/`
                    <div class="bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer"
                        data-movie-id="${movie.id}"
                        data-action="view-detail">
                        <a href="#/movies/${movie.id}">
                            <img src="${movie.poster}" alt="${movie.title} poster"
                                class="w-full h-64 object-cover rounded-t-lg">
                            <div class="p-3">
                                <h3 class="font-bold text-gray-800 truncate">${movie.title}</h3>
                                <p class="text-sm text-gray-500">${movie.year}</p>
                            </div>
                        </a>
            </div>
                `;
            },
            eventHandlers: {
                click: (event: Event) => {
                    const target = event.target as HTMLElement;
                    let currentElement: HTMLElement | null = target;
                    // Traverse up the DOM tree until we find the <li> with data-action or the component's root element
                    // This ensures we catch clicks on children of the <li>, like img, h3, p.
                    while (currentElement && currentElement !== this._element) {
                        if (currentElement.dataset.action === 'view-detail' && currentElement.dataset.movieId) {
                            event.preventDefault(); // Prevent the <a> tag's default browser navigation
                            const movieId = parseInt(currentElement.dataset.movieId, 10);
                            // Navigate using the router instance passed in properties
                            (this.properties as IMovieCardComponentProperties).router.navigate(`/movies/${movieId}`);
                            break;
                        }
                        currentElement = currentElement.parentElement;
                    }
                }
            }
        });
        console.log(`[${this.properties.id || 'MovieCardComponent'}] Initialized for movie: ${properties.movie.title}`);

    }

    public async onEnter(): Promise<void> {
        await super.onEnter();
    }


}