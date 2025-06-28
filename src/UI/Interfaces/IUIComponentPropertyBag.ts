import { IUIComponent } from "./IUIComponent";
export interface IUIComponentPropertyBag<TState extends object = any> {
    id: string;
    name?: string; 
    targetSelector?: string;
    dataSet?: { [key: string]: string | number | boolean } | undefined;
    eventHandlers?: { [eventName: string]: (event: Event) => void };
    state?: TState
    template?: (componentInstance: any) => string;
    componentInstance?: IUIComponent<IUIComponentPropertyBag<TState>>; // Reference to the component instance itself

}
