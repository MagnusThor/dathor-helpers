import { IPageState } from "../../UI/Interfaces/IPageState";


export interface IMovieDetailState extends IPageState {

    movieId: string | null; // IMDb ID (e.g., 'tt0133093')
    title: string;
    year: string;
    plot: string;


    loading: boolean;
    error: string | undefined;
}
