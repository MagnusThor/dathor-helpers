
import { Router } from "../../../UI/Router/Router";
import { serviceLocator } from "../../../UI/Service/ServiceLocator";
import { UIComponentBase } from "../../../UI/UIComponent";
import { UIObservedComponent } from "../../../UI/UIObservedComponent"; // Corrected path
import { ISearchContainerState, ISearchContainerProperties } from "../../Interfaces/ISearchComponentInterfaces"; // Corrected path
import { MovieApiService } from "../../Services/MovieService"; // Corrected path
import { SearchInputComponent } from "./SearchInputComponent";
import { SearchResultsComponent } from "./SearchResultCompoent";


export class SearchContainerComponent extends UIComponentBase<ISearchContainerState, ISearchContainerProperties> {

    private router: Router;
    private searchInputComponent: SearchInputComponent | null = null;
    private searchResultsComponent: SearchResultsComponent | null = null;

    constructor(
        properties: ISearchContainerProperties,
        router: Router
    ) {
        super({
            ...properties,
            state: {
            },
            template: (component: SearchContainerComponent) => /*html*/`
                <div id="${component.properties.id}" class="search-container-component p-4 bg-white shadow-md rounded-lg">
                    <div id="${component.properties.id}-input-container" class="mb-4">
                    </div>
                    <div id="${component.properties.id}-results-container">
                    </div>
                </div>
            `
        });
        this.router = router;

        console.log(`[${this.properties.name || this.properties.id}] SearchContainerComponent initialized.`);
    }

    public async onEnter(): Promise<void> {
        await super.onEnter();
        console.log(`[${this.properties.id}] SearchContainerComponent onEnter.`);
        if (!this._element) {
            console.error(`[${this.properties.id}] Main element not available for child component rendering.`);
            return;
        }
        // Instantiate and render SearchInputComponent
        if (!this.searchInputComponent) {
            this.searchInputComponent = new SearchInputComponent({
                id: `${this.properties.id}-input`,
                name: 'Search Input',
                onSearch: (term) => this.handleSearch(term)

            });
            this.addChild(this.searchInputComponent);

            const inputContainer = this._element.querySelector(`#${this.properties.id}-input-container`);
            if (inputContainer) {
                const renderResult = await this.searchInputComponent.render();
                if (renderResult.result) {
                    inputContainer.innerHTML = '';
                    inputContainer.appendChild(renderResult.result);
                    await this.searchInputComponent.onEnter();
                    console.log(`[${this.properties.id}] SearchInputComponent mounted.`);
                }
            }
        }
        // Instantiate and render SearchResultsComponent
        if (!this.searchResultsComponent) {
            this.searchResultsComponent = new SearchResultsComponent({
                id: `${this.properties.id}-results`,
                name: 'Search Results'
            }
            );
            this.addChild(this.searchResultsComponent);

            const resultsContainer = this._element.querySelector(`#${this.properties.id}-results-container`);
            if (resultsContainer) {
                const renderResult = await this.searchResultsComponent.render();
                if (renderResult.result) {
                    resultsContainer.innerHTML = '';
                    resultsContainer.appendChild(renderResult.result);
                    await this.searchResultsComponent.onEnter();
                    console.log(`[${this.properties.id}] SearchResultsComponent mounted.`);
                }
            }
        }
    }

    public onLeave(): void {
        super.onLeave();
        console.log(`[${this.properties.id}] SearchContainerComponent onLeave.`);
    }


    private async handleSearch(query: string): Promise<void> {

        if (query.length > 2 && query != "") {
            const movieApiService = serviceLocator.get<MovieApiService>("MovieApiService");

            this.searchResultsComponent?.setState({
                results: await movieApiService.searchMovies(query)
            })

        }else{
            this.searchResultsComponent?.setState({
                results: []
            })
        }

    }


}