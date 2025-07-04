import { IObservableProperties } from "../../UI/Interfaces/IObservableProperties";

import { ISearchResult } from "./ISearchResult";


export interface ISearchContainerState {
}

export interface ISearchContainerProperties extends IObservableProperties<ISearchContainerState> {


}

export interface ISearchInputState {
    currentInputValue: string;
}

export interface ISearchInputProperties extends IObservableProperties<ISearchInputState> {
    onSearch: (searchTerm: string) => void;
    initialValue?: string;
    debounceTime?: number;
}
export interface ISearchResultsState {
    results: ISearchResult[];
    isLoading: boolean;
    error: string | null;
    searchTerm: string,
} // Can be empty or minimal if all data is from props

export interface ISearchResultsProperties extends IObservableProperties<ISearchResultsState> {
 
   
}