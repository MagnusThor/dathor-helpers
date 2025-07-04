import { IMovieDetails } from "./IMovieDetails";

export interface ISearchResult extends IMovieDetails {
    // If search results have specific additional properties, add them here.
    // Otherwise, it can simply extend IMovieDetails.
}