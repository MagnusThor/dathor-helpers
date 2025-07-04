
import { PageComponent } from "../../UI/Component/Core/PageComponent";
import { IPageComponentProperties } from "../../UI/Interfaces/IPageComponentProperties";
import { IPageState } from "../../UI/Interfaces/IPageState";
import { Router } from "../../UI/Router/Router";
import { serviceLocator } from "../../UI/Service/ServiceLocator";
import { INotification, NOTIFICATION_EVENT_NAME } from "../Interfaces/INotificationComponentInterfaces";
import { MovieApiService } from "../Services/MovieService";
import { SearchContainerComponent } from "../Components/Search/SearchContainerComponent";

export interface IHomePageState extends IPageState {
    welcomeMessage: string;
    clickCount: number;
}

export class HomePageComponent extends PageComponent<IHomePageState> {
    private searchContainerComponent: SearchContainerComponent | null = null;
    constructor(properties: IPageComponentProperties<IHomePageState>) {
        super({
            ...properties,
            template: (component: HomePageComponent) => {
                const state = component.getState();
                return /*html*/ `
                    <div id="${component.properties.id}" class="home-page p-6 bg-white shadow rounded-lg mb-6">
                        <h1 class="text-3xl font-bold text-gray-900 mb-4">${state.welcomeMessage}</h1>
                        <p class="text-gray-700 mb-4">
                            Welcome to your single-page application built with a custom framework!
                            This is the home page.
                        </p>
                        <p class="text-gray-700 mb-4">
                            You have clicked the button <span class="font-bold text-blue-600">${state.clickCount}</span> times.
                        </p>
                        <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                                data-event-click="handleClick">
                            Click Me!
                        </button>
                         <button class="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                                data-event-click="sendNotification">
                            Send message
                        </button>
                        <div class="mt-8">
                            <h2 class="text-xl font-semibold mb-3 text-gray-800">Explore Further:</h2>
                            <ul class="list-disc list-inside text-blue-600 space-y-2">
                                <li>
                                    <a href="#/movies/123" class="hover:underline">Go to Movie 123 (via hash link)</a>
                                </li>
                                <li>
                                    <button class="text-blue-600 hover:underline cursor-pointer focus:outline-none" 
                                            data-event-click="goToMoviePage">
                                        Go to Movie 100 (programmatic)
                                    </button>
                                </li>
                                <li>
                                    <a href="#/about" class="hover:underline">Go to About Us (will show 404 if not defined)</a>
                                </li>
                            </ul>
                        </div>
                          <div id="movie-search-container" class="max-w-3xl mx-auto bg-white p-6 rounded-lg shadow-lg">
                            </div>
                    </div>
                `;
            },
            state: {
                welcomeMessage: properties.state?.welcomeMessage || "Imdb Favorites Example App!",
                clickCount: properties.state?.clickCount || 0
            },
            eventHandlers: {
                click: (event: Event) => {
                    const target = event.target as HTMLElement;
                    if (target.dataset.eventClick === 'handleClick') {
                        (this as HomePageComponent).handleClick(event);
                    } else if (target.dataset.eventClick === 'goToMoviePage') {
                        (this as HomePageComponent).goToMoviePage(event);
                    }else if(target.dataset.eventClick === "sendNotification"){
                          (this as HomePageComponent).sendNotication(event);
                    }
                    
                }
            }
        });
        console.log(`[${this.properties.name || this.properties.id}] HomePageComponent initialized.`);    }

    public handleClick(event: Event): void {
        console.log('Home Page Button clicked!', event);
        this.setState({ clickCount: (this.getState().clickCount || 0) + 1 });
    }

    public sendNotication(event:Event):void{
        const messageTypes = ['info', 'success', 'warning', 'error'];
        const randomType = messageTypes[Math.floor(Math.random() * messageTypes.length)] as 'info' | 'success' | 'warning' | 'error';
    
        const notification:INotification = {
            id: crypto.randomUUID(),
            message: `This is a message - ${Date.now().toString()}`,
            type: randomType,
            dismissible: true,
            duration:5000
        };

        this.eventBus.publish<INotification>(NOTIFICATION_EVENT_NAME,notification)

    }

    public goToMoviePage(event: Event): void {
        event.preventDefault();
        console.log('Navigating programmatically to Movies 100...');
        this.properties!.router.navigate('/movies/100');
    }

    public async onEnter(prevProps?: IPageComponentProperties<IHomePageState>): Promise<void> {
        await super.onEnter(prevProps);
        console.log(`[HomePageComponent] onEnter: current path is ${this.properties!.path}`);

        if (!this.searchContainerComponent) {
            const movieApiService = serviceLocator.get<MovieApiService>("MovieApiService");
            const router = serviceLocator.get<Router>('Router');

            this.searchContainerComponent = new SearchContainerComponent(
                {
                    id: `${this.properties.id}-search-container`,
                    name: 'Movie Search Container',

                },
                router
            );

            this.addChild(this.searchContainerComponent);
        }

        if (this._element) {
            const container = this._element.querySelector('#movie-search-container');
            if (container) {
                const renderResult = await this.searchContainerComponent.render();
                if (renderResult.result) {
                    container.innerHTML = '';
                    container.appendChild(renderResult.result);
                    await this.searchContainerComponent.onEnter();
                    console.log(`[${this.properties.id}] SearchContainerComponent mounted.`);
                }
            } else {
                console.error(`[${this.properties.id}] #movie-search-container not found in template.`);
            }
        }
    }

    public onLeave(): void {
        super.onLeave();
        console.log(`[HomePageComponent] onLeave: path was ${this.properties!.path}`);
    }
}