import { IUIComponentPropertyBag } from "../../UI/Interfaces/IUIComponentPropertyBag";
import { UIComponentBase } from "../../UI/UIComponent";

export interface IFooterComponentProperties extends IUIComponentPropertyBag<any> {
    // No specific properties needed for the footer itself.
}

export class FooterComponent extends UIComponentBase<any, IFooterComponentProperties> {


    constructor(properties: IFooterComponentProperties) {
        super({
            ...properties,
            id: properties.id || 'app-footer',
            name: properties.name || 'FooterComponent',
            template: (component: FooterComponent) => /*html*/`
                <footer id="${component.properties.id}" class="bg-gray-800 text-white p-4 mt-8 flex justify-between items-center">
                    <p>&copy; 2025 Your App. All rights reserved.</p>
                    <div id="cart-badge-container">
                    </div>
         </footer>
            `
        });
    }

  
}