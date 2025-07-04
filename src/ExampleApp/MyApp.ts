import { ApplicationManager } from "../UI/Application/ApplicationManager";
import { EventBus } from "../UI/Application/EventBus";
import { RootUIComponent } from "../UI/Component/Core/RootUIComponent";
import { IRoute } from "../UI/Interfaces/IRoute";
import { Router } from "../UI/Router/Router";
import { serviceLocator } from "../UI/Service/ServiceLocator";
import { FavoritesBadgeComponent } from "./Components/Favorites/FavoritesBadgeComponent";
import { FooterComponent } from "./Components/Footer/FooterComponent";

import { HomePageComponent } from "./Pages/HomePageComponent";

import { MovieDetailComponent } from "./Pages/MovieDetailComponent";
import { NotificationComponent } from "./Components/Notifications/NotificationComponent";




import { MovieApiService } from "./Services/MovieService";
import { NotificationService } from "./Services/NotificationService";
import { MovieListComponent } from "./Pages/MovieListComponent";
import { HeaderComponent } from "./Components/Header/HeaderComponent";

function bootstrapServices() {

    const movieApiService = new MovieApiService()
    const eventBusInstance = EventBus.getInstance();
    const notificationService = new NotificationService();



    serviceLocator.register("MovieApiService", movieApiService);
    serviceLocator.register("EventBus", eventBusInstance);
    serviceLocator.register("NotificationService", notificationService);

    console.log('All core services bootstrapped and registered.');


}

export class MyApp {
    private appManager: ApplicationManager;
    private router: Router;



    constructor() {

        bootstrapServices();


        const appRoutes: IRoute[] = [
            {
                path: '/',
                component: HomePageComponent,
                defaultProps: { id: 'home-page', path: '/', router: null as any }
            },
            {
                path: '/movies/:id',
                component: MovieDetailComponent,
                defaultProps: { id: 'movies-detail-page', path: '/movies/:id', router: null as any }
            },
            {
                path: "/movies/",
                component: MovieListComponent,
                defaultProps: { id: "movie-list-page", path: "/movies/", router: null as any }
            }
        ];

        this.router = new Router(appRoutes, '#main-content');

        serviceLocator.register('Router', this.router);

        appRoutes.forEach(route => {
            if (route.defaultProps) {
                route.defaultProps.router = this.router;
            } else {
                route.defaultProps = { router: this.router, id: 'auto-id-' + Math.random().toString(36).substring(2, 9), path: route.path };
            }
        });

        const appRootComponent = new RootUIComponent({ id: 'app-root' });

        const notificationComponent = new NotificationComponent({
            id: 'global-notifications',
            name: "notification-component",
            targetSelector: "#notifications-container"
        });
        appRootComponent.addChild(notificationComponent);

        appRootComponent.addChild(new HeaderComponent({
            id: `app-root-header`,
            targetSelector: `#app-root-header-container`,
            router: this.router
        }));

        // Add FooterComponent as a child
        appRootComponent.addChild(new FooterComponent({
            id: `app-root-footer`,
            targetSelector: `#app-root-footer-container`
        }));



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