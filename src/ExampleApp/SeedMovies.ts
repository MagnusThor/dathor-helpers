import { IMovieDetails } from "./Interfaces/IMovieDetails";

import {
  uniqueNamesGenerator,
  Config,
  adjectives,
  names,
  languages,
  animals,
  colors
} from "unique-names-generator";


export class SeedMovies {

    static seed(numberOfMovies: number): Array<IMovieDetails> {

        const config= {
            dictionaries: [adjectives, colors,animals],
            separator: " ",
            length: 2, 
        };


        let result = new Array<IMovieDetails>();
        for (let i = 0; i < numberOfMovies; i++) {
         
            const movieName: string = uniqueNamesGenerator(config);
            const year = Math.floor(Math.random() * (2025 - 1930 + 1) + 1930);

            result.push({
                id: i + 1, // Start IDs from 1 for better simulation
                title: movieName,
                year: year,
                plot: `A captivating story about a ${uniqueNamesGenerator({ dictionaries: [adjectives] })} ${uniqueNamesGenerator({ dictionaries: [animals] })} in a ${uniqueNamesGenerator({ dictionaries: [colors] })} world set in ${year}.`,
                poster: `https://place-hold.it/300x450?text=${encodeURIComponent(movieName)}` // Placeholder image
            });
        }
        console.log(`[SeedMovies] Seeded ${numberOfMovies} movies.`);
        return result;


    }

}

export const globalSeededMovies: IMovieDetails[] = SeedMovies.seed(200);

console.log(`[Global Data] Generated ${globalSeededMovies.length} movies into globalSeededMovies.`);
