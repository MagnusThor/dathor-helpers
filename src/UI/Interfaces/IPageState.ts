// Core/Interfaces/IPageState.ts

// IPageState can be an empty interface if all page components just need 'state' to be an object.
// Or, it can include common properties that all page states might have (e.g., 'loading', 'error').
// For now, let's keep it simple as a marker interface.
export interface IPageState extends Object {
    // You can add common state properties here that all pages would share, e.g.:
    loading?: boolean;
    error?: string;
}