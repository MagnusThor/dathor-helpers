import { PageComponent } from "../../UI/Component/Core/PageComponent";
import { RepeaterComponent } from "../../UI/Component/Core/RepeaterComponent";
import { IPageComponentProperties } from "../../UI/Interfaces/IPageComponentProperties";
import { IPageState } from "../../UI/Interfaces/IPageState";
import { ComponentItemRenderer } from "../../UI/Interfaces/IRepeaterComponentInterfaces";
import { Router } from "../../UI/Router/Router";
import { serviceLocator } from "../../UI/Service/ServiceLocator";
import { UIComponentBase } from "../../UI/UIComponent";
import { MovieCardComponent } from "../Components/Movie/MovieCardComponent";
import { IMovieDetails } from "../Interfaces/IMovieDetails";
import { MovieApiService } from "../Services/MovieService";
import { pageErrorMessage, pageLoading } from "../Templates/Templates";


export interface IMovieListComponentState extends IPageState {
    movies: IMovieDetails[];
}

export class MovieListComponent extends PageComponent<IMovieListComponentState> {
    router: Router;
    movieService: MovieApiService;
    private repeaterComponent: RepeaterComponent<IMovieDetails> | null = null;

    constructor(properties: IPageComponentProperties<IMovieListComponentState>) {
        super({
            ...properties,
            state: {
                loading: false,
                error: undefined,
                movies: [] 
            },
            template: (component: MovieListComponent) => {
                const { loading, error } = component.getState();
                const pageTitle = "Movie List";

                return`
                    <div id="${component.properties.id}-container" class="movie-list-page p-4">
                        <h1 class="text-3xl font-bold text-gray-800 mb-6">${pageTitle}</h1>

                        ${loading ? pageLoading("Movie page loading...") : ''}
                        ${error ? pageErrorMessage(component.properties, error) : ''}

                        <div id="${component.properties.id}-repeater-container"></div>

                        ${!loading && !error && component.getState().movies.length === 0 ? /*html*/`
                            <div class="text-center py-8 text-gray-600">
                                <p>No movies found.</p>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        });

        this.router = serviceLocator.get<Router>("Router");
        this.movieService = serviceLocator.get<MovieApiService>("MovieApiService");

        console.log(`[${this.properties.id}] MovieListComponent initialized.`);
    }

    public async onEnter(): Promise<void> {
        await super.onEnter();
        console.log(`[${this.properties.id}] MovieListComponent onEnter: Fetching movies...`);
        await this.fetchAndRenderMovies();
    }

    /**
     * Fetches movies and then triggers the rendering of the RepeaterComponent.
     */
    private async fetchAndRenderMovies(): Promise<void> {
        try {

            const allMovies = await this.movieService.all();
            
            this.setState({ movies: allMovies, loading: false });

            console.log(`[${this.properties.id}] Movies fetched successfully:`, allMovies);

            this.renderRepeaterComponent(allMovies);

        } catch (error: any) {
            console.error(`[${this.properties.id}] Error fetching movies:`, error);
            this.disposeRepeaterComponent();
        }
    }

    /**
     * This is the crucial renderer function passed to the RepeaterComponent.
     * It defines how each individual IMovie item should be turned into a UIComponent.
     */
    private movieItemRenderer: ComponentItemRenderer<IMovieDetails> = async (
        movie: IMovieDetails,
        containerElement: HTMLElement,
        componentId: string,
        context: { router: Router }
    ): Promise<UIComponentBase | null> => {
        const movieCardComponent = new MovieCardComponent({
            id: componentId,
            movie: movie,
            router: context.router
        });

        const { result } = await movieCardComponent.render();
        if (result) {
            containerElement.appendChild(result);
            return movieCardComponent;
        } else {
            console.error(`[${this.properties.id}] Failed to render MovieCardComponent for movie ${movie.id}.`);
            return null;
        }
    };

    /**
     * Instantiates and renders the RepeaterComponent into its designated container.
     */
    private renderRepeaterComponent(movies: IMovieDetails[]): void {
        this.disposeRepeaterComponent();

        const repeaterContainerElement = this._element?.querySelector(`#${this.properties.id}-repeater-container`);
        if (repeaterContainerElement) {
            this.repeaterComponent = new RepeaterComponent<IMovieDetails>({
                id: `${this.properties.id}-repeater`,
                items: movies,
                itemComponentRenderer: this.movieItemRenderer,
                uniqueIdField: 'id',
                cssClasses: 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4',
                itemContainerTag: 'div',
                context: { router: this.router }
            });

            this.repeaterComponent.render().then(({ result }) => {
                if (result) {
                    repeaterContainerElement.appendChild(result);
                    this.repeaterComponent?.onEnter(); 
                } else {
                    console.error(`[${this.properties.id}] Failed to render RepeaterComponent.`);
                }
            });
        }
    }

    /**
     * Disposes of the RepeaterComponent instance and clears its reference.
     */
    private disposeRepeaterComponent(): void {
        if (this.repeaterComponent) {
            this.repeaterComponent.dispose();
            this.repeaterComponent = null;
        }
    }

    /**
     * Overrides the PageComponent's onLeave to ensure proper cleanup of the repeater.
     */
    public onLeave(): void {
        super.onLeave();
        this.disposeRepeaterComponent();
        console.log(`[${this.properties.id}] MovieListComponent left, repeater disposed.`);
    }
}