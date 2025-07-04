// services/MovieApiService.ts
import { QueryableArray } from "../../helpers/QueryableArray";
import { IMovieDetails } from "../Interfaces/IMovieDetails"; // Adjust path
import { ISearchResult } from "../Interfaces/ISearchResult"; // Adjust path
import { globalSeededMovies, SeedMovies } from "../SeedMovies";

export class MovieApiService {

    private movies: IMovieDetails[] = globalSeededMovies;

    constructor() {
        console.log(`[MovieApiService] Initialized with ${this.movies.length} seeded movies.`);
    }

    /**
     * Retrieves movie details by its ID from the seeded data.
     * @param movieIdString The ID of the movie as a string (will be parsed to number).
     * @returns A Promise resolving to IMovieDetails or null if not found.
     */
    async getMovieDetails(movieIdString: string): Promise<IMovieDetails | null> {
        console.log(`[MovieApiService] Retrieving details for movie ID: ${movieIdString}...`);
        const movieId = parseInt(movieIdString, 10);

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        const movie = this.movies.find(m => m.id === movieId);
        if (movie) {
            console.log(`[MovieApiService] Found movie: "${movie.title}" (ID: ${movie.id})`);
            return movie;
        } else {
            console.warn(`[MovieApiService] Movie with ID: ${movieIdString} not found.`);
            return null;
        }
    }

    /**
     * Searches for movies by title from the seeded data.
     * @param query The search query string.
     * @returns A Promise resolving to an array of ISearchResult.
     */
    async searchMovies(query: string): Promise<ISearchResult[]> {
        console.log(`[MovieApiService] Searching for movies with query: "${query}"...`);
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        const lowerCaseQuery = query.toLowerCase();
        const results = this.movies.filter(movie =>
            movie.title.toLowerCase().includes(lowerCaseQuery)
        ).map(movie => ({
            id: movie.id,
            title: movie.title,
            year: movie.year,
            poster: "https://place-hold.it/300x450",
            plot: movie.plot // Include plot for search results if desired
        } as ISearchResult)); // Cast to ISearchResult

        console.log(`[MovieApiService] Found ${results.length} search results for "${query}".`);
        return results;
    }

    all(): Promise<Array<IMovieDetails>> {
        return new Promise<Array<IMovieDetails>>((resolve, reject) => {
            resolve(this.movies);
        });     
    }

    take(skip:number,take:number): Promise<QueryableArray<IMovieDetails>> {
        return new Promise<QueryableArray<IMovieDetails>>((resolve, reject) => {
            const result = QueryableArray.from(this.movies).skip(skip).take(take);
            resolve(result);
        });     
    }
}