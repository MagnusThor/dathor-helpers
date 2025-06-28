export interface IRouteComponentProps {
    params?: { [key: string]: string };        // Path parameters (e.g., { id: '123' })
    queryParams?: { [key: string]: string };   // Query string parameters (e.g., { sort: 'price' })
    path?: string; // Add the current path to props, helpful for components
}
