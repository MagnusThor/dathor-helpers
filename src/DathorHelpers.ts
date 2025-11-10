import { DOMHelpers } from './dom/DOMHelpers';
import { Utils } from './misc/Utils';
import { StringHelpers } from './string/StringHelpers';
import { MathHelper } from './math/MathHelpers';
import { ArrayBufferHelpers } from './arraybuffers/ArrayBufferHelpers';
import { TaskFactory } from './task/TaskFactory';
import { FetchHelperFactory } from './network/FetchHelpers';


export type IDathorHelpers = typeof DOMHelpers & typeof Utils & typeof StringHelpers & typeof MathHelper & typeof ArrayBufferHelpers
& typeof TaskFactory & typeof FetchHelperFactory


/**
 * Aggregator object for all static helper methods.
 * This structure allows all methods from the helper files to be called
 * directly as static methods of DathorHelpers (e.g., DathorHelpers.get()).
 */
export const DathorHelpers = {
    // DOM-related methods
    ...DOMHelpers,

    // General Utilities, Forms, Performance, and Binding methods
    ...Utils,

    // String manipulation methods
    ...StringHelpers,

    // Math helper
    ...MathHelper,

    // ArrayBuffer Helpers
    ...ArrayBufferHelpers,


    // TaskFactory
    ...TaskFactory,


    // FetchHelperFactory
    ...FetchHelperFactory

} as IDathorHelpers;


// Export the aggregated object as $D as requested
export const $D = DathorHelpers;
export default DathorHelpers;



