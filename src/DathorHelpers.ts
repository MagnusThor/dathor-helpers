import { DOMHelpers } from './DOMHelpers';
import { Utils } from './Utils';
import { StringHelpers } from './StringHelpers';
import { MathHelper } from './MathHelpers';
import { ArrayBufferHelpers } from './ArrayBufferHelpers';



export type IDathorHelpers = typeof DOMHelpers & typeof Utils & typeof StringHelpers & typeof MathHelper & typeof ArrayBufferHelpers;


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
    ...ArrayBufferHelpers

} as IDathorHelpers;


// Export the aggregated object as $D as requested
export const $D = DathorHelpers;
export default DathorHelpers;



