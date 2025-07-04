// src/components/Search/SearchResultsComponent.ts

import { UIComponentBase } from "../../../UI/UIComponent";
import { UIObservedComponent } from "../../../UI/UIObservedComponent";
import { ISearchResultsState, ISearchResultsProperties } from "../../Interfaces/ISearchComponentInterfaces";

export class SearchResultsComponent extends UIComponentBase<ISearchResultsState, ISearchResultsProperties> {

    constructor(properties: ISearchResultsProperties) {
        super({
            ...properties,
              state: { results: [], isLoading: false, error: null, searchTerm: '' },
            template: (component: SearchResultsComponent) => {
                const { results, isLoading, error } = component.getState(); // Get data from properties state
                  if (isLoading) {
                    return /*html*/`<div class="text-center py-4"><div class="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 inline-block"></div> Loading...</div>`;
                }
                if (error) {
                    return /*html*/`<div class="text-center py-4 text-red-600">${error}</div>`;
                }
                if (results.length === 0 && !isLoading && !error) { 
                    return /*html*/`<div class="text-center py-4 text-gray-500">No results to display. Try searching!</div>`;
                }
                if (results.length > 0) {
                    return /*html*/`
                        <ul class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
                            ${results.map(result => `
                                <li class="bg-gray-50 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 cursor-pointer" 
                                    data-movie-id="${result.id}">
                                    <a href="#/movies/${result.id}">
                                    <img src="${result.poster}" alt="${result.title} poster" 
                                    class="w-full h-48 object-cover rounded-t-lg">
                                    <div class="p-3">
                                        <h3 class="font-bold text-gray-800 truncate">${result.title}</h3>
                                        <p class="text-sm text-gray-500">${result.year}</p>
                                    </div>
                                </li>
                            `).join('')}
                        </ul>
                    `;
                }
                return ''; 
            },
            eventHandlers: {
            
            }
        });



        console.log(`[${this.properties.name || this.properties.id}] SearchResultsComponent initialized.`);
    }

    


}