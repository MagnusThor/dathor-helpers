import { UIComponentBase } from "../../../UI/UIComponent";
import { IHeaderComponentProperties } from "../../Interfaces/IHeaderComponentProperties";

export class HeaderComponent extends UIComponentBase {
    constructor(properties: IHeaderComponentProperties) {
     
        super({
            ...properties,
            template: (component: HeaderComponent) => /*html*/`
                <header class="bg-gray-800 text-white p-4 shadow-md">
                    <nav class="container mx-auto flex justify-between items-center">
                        <a href="#/" class="text-2xl font-bold hover:text-blue-300 transition-colors">My App</a>
                        <div class="space-x-4">
                            <a href="#/" class="hover:text-blue-300 transition-colors">Home</a>
                            <a href="#/movies/" class="hover:text-blue-300 transition-colors">Movies</a>
                            <a href="#/search" class="hover:text-blue-300 transition-colors">Search</a>
                            <a href="#/about" class="hover:text-blue-300 transition-colors">About</a>
                        </div>
                    </nav>
                </header>
            `
        });

       
        

        console.log(`[${this.properties.id || 'HeaderComponent'}] Initialized.`);
    }

    // public async onEnter(): Promise<void> {
    //     await super.onEnter();
    //     console.log(`[${this.properties.id || 'HeaderComponent'}] onEnter.`);
    //     if (this.properties.router) {
    //         this.properties.router.onRouteChanged((path: string) => {
    //             this.updateActiveLink(path);
    //         });
    //         this.updateActiveLink(this.properties.router.getCurrentPath());
    //     }
    // }

    // private updateActiveLink(currentPath: string): void {
    //     this._element?.querySelectorAll('nav a').forEach(link => {
    //         if (link.getAttribute('href') === `#${currentPath}`) {
    //             link.classList.add('font-bold', 'text-blue-400');
    //         } else {
    //             link.classList.remove('font-bold', 'text-blue-400');
    //         }
    //     });
    // }
}