// src/components/Search/SearchInputComponent.ts

import DathorHelpers from "../../../helpers/all";
import { UIComponentBase } from "../../../UI/UIComponent";
import { UIObservedComponent } from "../../../UI/UIObservedComponent";
import { ISearchInputState, ISearchInputProperties } from "../../Interfaces/ISearchComponentInterfaces";

export class SearchInputComponent extends UIComponentBase<ISearchInputState, ISearchInputProperties> {
    private searchTimeout: number | null = null;
    private debounceTime: number;

    constructor(properties: ISearchInputProperties) {
        super({
            ...properties,
            state: {
                currentInputValue: properties.initialValue || '',
            },
            template: (component: SearchInputComponent) => {
                const state = component.getState();
                return /*html*/`
                    <div class="flex space-x-2">
                        <input
                            type="search"
                            placeholder="Search movies..."
                            class="flex-grow p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value="${state.currentInputValue}"
                            data-action="input-search-term"
                        />
                        <button
                            class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                            data-action="perform-search"
                        >
                            Search
                        </button>
                    </div>
                `;
            },
            eventHandlers: {
                input: (event: Event) => {
                    const target = event.target as HTMLInputElement;
                    if (target.dataset.action === 'input-search-term') {
                        this.handleInputChange(target.value);
                    }
                },
                click: (event: Event) => {
                    const target = event.target as HTMLElement;
                    if (target.dataset.action === 'perform-search') {
                        const query = DathorHelpers.get<HTMLInputElement>("input",this._element)!.value
                        this.triggerSearch(query || "");
                    }
                },
                keydown: (event: Event) => {
                    const keyboardEvent = event as KeyboardEvent;
                    const target = event.target as HTMLInputElement;
                    if (target.dataset.action === 'input-search-term' && keyboardEvent.key === 'Enter') {
                        this.triggerSearch(target.value);
                    }
                }
            }
        });
        this.debounceTime = properties.debounceTime ?? 500; // Default debounce to 500ms
        console.log(`[${this.properties.name || this.properties.id}] SearchInputComponent initialized.`);
    }

    public onLeave(): void {
        super.onLeave();
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }
    }

    private handleInputChange(value: string): void {
    
        // Debounce actual search trigger if onSearch is meant for live updates
        if (this.debounceTime > 0) {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            this.searchTimeout = window.setTimeout(() => {
                // Trigger search if value length is > 2 characters OR if it's empty
                if (value.trim().length > 2 || value.trim().length === 0) {
                    console.log(`[${this.properties.id}] Debounced search triggered for: '${value}'`);
                    this.triggerSearch(value);
                } else {
                    console.log(`[${this.properties.id}] Debounced search skipped (length <= 2 and not empty). Current value: '${value}'`);
                }
                this.searchTimeout = null;
            }, this.debounceTime);
        } else {
            // If no debounce, trigger search immediately (e.g., for debounceTime = 0)
            if (value.trim().length > 2 || value.trim().length === 0) {
                console.log(`[${this.properties.id}] Immediate search triggered for: '${value}'`);
                this.triggerSearch(value);
            }
        }
    }

    private triggerSearch(value:string): void {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
            this.searchTimeout = null;
        }
        this.properties.onSearch(value);
   }

    
}