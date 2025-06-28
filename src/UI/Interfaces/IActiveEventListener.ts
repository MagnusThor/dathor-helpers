export interface IActiveEventListener {
    element: EventTarget; 
    eventName: string;
    handler: (event: Event) => void;
}