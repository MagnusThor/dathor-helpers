import { IUIComponentPropertyBag } from "../../UI/Interfaces/IUIComponentPropertyBag";
import { Router } from "../../UI/Router/Router";

export interface IHeaderComponentProperties extends IUIComponentPropertyBag {
    router?: Router; // Optional: if navigation needs to know about the router for active states etc.
}