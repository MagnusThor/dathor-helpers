import { ApplicationManager } from "../UI/Application/ApplicationManager";
import { RootUIComponent } from "../UI/Components/Core/RootUIComponent";
import { IRoute } from "../UI/Interfaces/IRoute";
import { Router } from "../UI/Router/Router";
import { CartBadgeComponent } from "./Components/CartBadgeComponent";
import { FooterComponent } from "./Components/FooterComponent";

import { HomePageComponent } from "./Components/HomePageComponent";
import { ProductDetailComponent } from "./Components/ProductDetailsComponent";



export class MyApp {
    private appManager: ApplicationManager;
    private router: Router;

    constructor() {
        const appRoutes: IRoute[] = [
            {
                path: '/',
                component: HomePageComponent,
                defaultProps: { id: 'home-page', path: '/', router: null as any }
            },
            {
                path: '/products/:id',
                component: ProductDetailComponent,
                defaultProps: { id: 'product-detail-page', path: '/products/:id', router: null as any }
            },
        ];

        this.router = new Router(appRoutes, '#main-content');


         


        appRoutes.forEach(route => {
            if (route.defaultProps) {
                route.defaultProps.router = this.router;
            } else {
                route.defaultProps = { router: this.router, id: 'auto-id-' + Math.random().toString(36).substring(2, 9), path: route.path };
            }
        });

        const appRootComponent = new RootUIComponent({ id: 'app-root' });


        // this.rootComponent = new RootUIComponent({ id: 'app-root-component', router: this.router });
        // this.footerComponent = new FooterComponent({ id: 'app-footer-top-level' });

        const footerComponent = new FooterComponent({ id: 'app-footer'});
        
        appRootComponent.addChild(footerComponent);
        
        const cartBadgeComponent = new CartBadgeComponent({ id:"cart-badge"});

        footerComponent.addChild(cartBadgeComponent);


      


        
 



        this.appManager = new ApplicationManager(appRootComponent, this.router, 'body');
    }

    /**
     * Runs the application by starting the ApplicationManager.
     * The ApplicationManager will handle rendering the root component and starting the router.
     */
    async run(): Promise<void> {
        await this.appManager.start();
        console.log("Application is fully started.");
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    console.log("DOM Content Loaded. Initializing MyApp...");
    const app = new MyApp();
    await app.run();
});