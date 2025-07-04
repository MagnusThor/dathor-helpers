import { $D } from "../helpers/all";
import { EventBus } from "./Application/EventBus";

import { IActiveEventListener } from "./Interfaces/IActiveEventListener";
import { IComponentSubscription } from "./Interfaces/IComponentSubscription";
import { IUIComponentPropertyBag } from "./Interfaces/IUIComponentPropertyBag";
import { IUIComponentRenderResult } from "./Interfaces/IUIComponentRenderResult";
import { serviceLocator } from "./Service/ServiceLocator";

export abstract class UIComponentBase<
    TState extends object = any,
    TProperties extends IUIComponentPropertyBag<TState> = IUIComponentPropertyBag<TState>
> {
    protected _element: HTMLElement | null = null;
    protected _state: TState;
    public properties: TProperties;
    public childComponents: UIComponentBase<any, any>[] = [];
    protected _isMounted: boolean = false;
    private _activeSubscriptions: IComponentSubscription[] = [];
    private _activeEventListeners: IActiveEventListener[] = [];

    protected eventBus: EventBus; 

    constructor(properties: TProperties) {
        this.properties = properties;
        this._state = properties.state || ({} as TState);
        console.log(
            `[${this.properties.name || this.properties.id}] Component initialized.`
        );
        this.eventBus = serviceLocator.get<EventBus>('EventBus');
    }


    public addChild(child: UIComponentBase<any, any>): void {
        if (this.childComponents.includes(child)) {
            console.warn(
                `[${this.properties.name || this.properties.id}] Child ${child.properties.name || child.properties.id
                } already added.`
            );

            return;
        }

        this.childComponents.push(child);

        console.log(
            `[${this.properties.name || this.properties.id}] Added child: ${child.properties.name || child.properties.id
            }`
        );
    }


    public async render(): Promise<IUIComponentRenderResult> {
        console.log(
            `[${this.properties.name || this.properties.id}] Starting render process.`
        );


        let htmlString = this.properties.template
            ? this.properties.template(this as any)
            : "";

        if (!htmlString) {
            console.warn(
                `[${this.properties.name || this.properties.id
                }] No template provided. Cannot render self.`
            );

            return { result: undefined };
        }


        const tempContainer = document.createElement("div");

        tempContainer.innerHTML = htmlString.trim();



        if (tempContainer.children.length > 1) {
            const fragment = document.createDocumentFragment();

            while (tempContainer.firstChild) {
                fragment.appendChild(tempContainer.firstChild);
            }

            this._element = fragment as any;

            console.warn(
                `[${this.properties.name || this.properties.id
                }] Template has multiple root elements. Using DocumentFragment. Child appending might be affected for direct element queries.`
            );
        } else if (tempContainer.firstElementChild) {
            this._element = tempContainer.firstElementChild as HTMLElement;
        } else {
            console.error(
                `[${this.properties.name || this.properties.id
                }] Failed to create HTMLElement from template. Template might be empty or invalid.`
            );

            return { result: undefined };
        }

        if (!this._element) {
            console.error(
                `[${this.properties.name || this.properties.id
                }] Render process failed: _element is null.`
            );

            return { result: undefined };
        }




        if (this._element instanceof HTMLElement) {
            if (this.properties.id) {
                this._element.id = this.properties.id;
            }

            console.log(
                `[${this.properties.name || this.properties.id
                }] Applying common properties to component's root HTMLElement:`,
                this._element
            );

            this._applyCommonElementProperties(this._element);
        }

        await this._renderAndAppendChildren(this._element);

        console.log(
            `[${this.properties.name || this.properties.id
            }] Render process completed. Element:`,
            this._element
        );

        
        return { result: this._element };
    }

    protected async _renderAndAppendChildren(
        parentRenderedElement: HTMLElement | DocumentFragment
    ): Promise<void> {
        console.log(
            `[${this.properties.name || this.properties.id
            }] Rendering and appending children.`
        );

        const childRenderPromises = this.childComponents

            .filter((child) => child.render)

            .map((child) => child.render!());

        const childRenderResults = await Promise.all(childRenderPromises);

        childRenderResults.forEach(async (childResult, index) => {
            const childComponent = this.childComponents[index];

            if (childResult?.result) {
                this._appendChildToParentDom(
                    parentRenderedElement,
                    childComponent,
                    childResult.result
                );

                 await childComponent.onEnter();


            } else {
                console.warn(
                    `[${this.properties.name || this.properties.id}] Child ${childComponent.properties.name || childComponent.properties.id
                    } render returned no element.`
                );
            }
        });

        console.log(
            `[${this.properties.name || this.properties.id
            }] All children rendered and appended.`
        );
    }


    protected _appendChildToParentDom(
        parentRenderedElement: HTMLElement | DocumentFragment,

        childComponent: UIComponentBase<any, any>,

        childRenderedElement: HTMLElement | DocumentFragment
    ): void {
        let targetElementForChild: HTMLElement | DocumentFragment | Element =
            parentRenderedElement;


        const targetSelector = childComponent.properties.targetSelector;

        if (targetSelector && typeof targetSelector === "string") {

            if (parentRenderedElement instanceof HTMLElement) {


                const queryResult = parentRenderedElement.querySelector(targetSelector);

                if (queryResult) {
                    targetElementForChild = queryResult;
                } else {
                    console.warn(
                        `[${this.properties.name || this.properties.id
                        }] Target element '${targetSelector}' not found within parent for child ${childComponent.properties.name || childComponent.properties.id
                        }. Appending to parent's root element.`
                    );
                }
            } else {
                console.warn(
                    `[${this.properties.name || this.properties.id
                    }] Cannot query by selector within a DocumentFragment parent for child ${childComponent.properties.name || childComponent.properties.id
                    }. Appending directly to fragment.`
                );
            }
        }

        targetElementForChild.appendChild(childRenderedElement);

        console.log(
            `[${this.properties.name || this.properties.id}] Appended child ${childComponent.properties.name || childComponent.properties.id
            }.`
        );
    }

    public async onEnter(): Promise<void> {
        console.log(`[${this.properties.name || this.properties.id}] entered.`);

        this._isMounted = true;



    }

    public onLeave(): void {
        console.log(`[${this.properties.name || this.properties.id}] left.`);

        this._isMounted = false;

    }

    public dispose(): void {
        console.log(
            `[${this.properties.name || this.properties.id}] Disposing component.`
        );

        if (this._isMounted) {
            this.onLeave();
        }

        this.childComponents.forEach((child) => child.dispose());

        this.childComponents = [];

        if (this._element && this._element.parentNode) {
            this._element.parentNode.removeChild(this._element);

            this._element = null;
        }

        console.log(`[${this.properties.name || this.properties.id}] Disposed.`);
    }

    public setState(newState: Partial<TState>): void {
        this._state = { ...this._state, ...newState };

        console.log(
            `[${this.properties.name || this.properties.id}] State updated:`,
            this._state
        );

        this.reRender();

    }

    public getState(): TState {
        return this._state;
    }

    unsubscribe(topic:string,action: (...args: any[]) => void,subscriberId:string): void{
        this.eventBus.unsubscribe(topic,action,subscriberId)
    }

    subscribe(topic: string, action: (...args: any[]) => void): void {
        if (!this.properties?.id) {
            console.warn(
                `[${this.constructor.name}] Cannot subscribe to topic "${topic}" without an ID. Subscription ignored.`
            );

            return;
        }

        const boundAction = action.bind(this);

        this.eventBus.subscribe(topic, boundAction, this.properties.id);

        this._activeSubscriptions.push({ topic, action: boundAction });
    }


    publish<T>(topic: string, data?: T): void {
        this.eventBus.publish(topic, data);
    }


    publishTo<T>(targetComponentId: string, topic: string, data?: T): void {
        this.eventBus.publishTo(targetComponentId, topic, data);
    }


    toHTMLElement(html: string) {
        return $D.toDOM(html);
    }


    querySelector<T extends HTMLElement = HTMLElement>(
        selector: string
    ): T | null {
        if (!this.properties?.id) {
            console.warn(
                `[${this.constructor.name}] querySelector: Cannot query without a component ID. Selector: "${selector}"`
            );

            return null;
        }



        const componentRootElement = $D.get<HTMLElement>(`#${this.properties.id}`);

        if (componentRootElement) {

            return $D.get<T>(selector, componentRootElement);
        }

        console.warn(
            `[${this.constructor.name}] querySelector: Component root element (ID: "${this.properties.id}") not found in DOM. Cannot query. Selector: "${selector}"`
        );

        return null;
    }


    querySelectorAll<T extends HTMLElement = HTMLElement>(selector: string): T[] {
        if (!this.properties?.id) {
            console.warn(
                `[${this.constructor.name}] querySelectorAll: Cannot query without a component ID. Selector: "${selector}"`
            );

            return [];
        }

        const componentRootElement = $D.get<HTMLElement>(`#${this.properties.id}`);

        if (componentRootElement) {
            return $D.getAll(selector, componentRootElement) as T[];
        }

        console.warn(
            `[${this.constructor.name}] querySelectorAll: Component root element (ID: "${this.properties.id}") not found in DOM. Cannot query. Selector: "${selector}"`
        );

        return [];
    }


    protected _applyCommonElementProperties(element: HTMLElement): void {
        if (this.properties?.state) {
            for (const key in this.properties.state) {
                if (Object.prototype.hasOwnProperty.call(this.properties.state, key)) {
                    element.setAttribute(
                        `data-${key}`,
                        String(this.properties.state[key])
                    );
                }
            }
        }

        if (this.properties?.eventHandlers) {
            for (const eventName in this.properties.eventHandlers) {
                if (
                    Object.prototype.hasOwnProperty.call(
                        this.properties.eventHandlers,
                        eventName
                    )
                ) {
                    const handler = this.properties.eventHandlers[eventName];

                    this._addTrackedEventListener(element, eventName, handler);
                }
            }
        }
    }


    protected _addTrackedEventListener(
        element: EventTarget,
        eventName: string,
        handler: (event: Event) => void
    ): void {
        element.addEventListener(eventName, handler);

        this._activeEventListeners.push({ element, eventName, handler });
    }

    protected updateState(newState: Partial<TState>): void {


        this.properties!.state = {
            ...this.properties!.state,
            ...newState,
        } as TState;

        console.log(
            `[${this.properties!.id || this.constructor.name}] State updated:`,
            this.properties!.state
        );


        this.reRender();
    }

    protected async reRender(): Promise<void> {


        if (this._element && this._element.parentNode) {
            const oldElement = this._element;

            const parent = oldElement.parentNode;

            try {

                const renderResult = await this.render();

                const newElement = renderResult.result;

                if (newElement && parent) {

                    parent.replaceChild(newElement, oldElement);

                    if (newElement instanceof HTMLElement) {
                        this._element = newElement;
                    } else {
                        this._element = null;

                        console.warn(
                            `[${this.properties?.id || this.constructor.name
                            }] New element is not an HTMLElement. Internal _element set to null.`
                        );
                    }

                    console.log(
                        `[${this.properties?.id || this.constructor.name
                        }] Component re-rendered and DOM updated.`
                    );
                } else if (!newElement) {
                    console.warn(
                        `[${this.properties?.id || this.constructor.name
                        }] Re-render failed: New element was not generated.`
                    );
                } else {

                    console.warn(
                        `[${this.properties?.id || this.constructor.name
                        }] Re-render aborted: Old element was detached from DOM.`
                    );
                }
            } catch (error) {
                console.error(
                    `[${this.properties?.id || this.constructor.name
                    }] Error during re-render:`,
                    error
                );
            }
        } else if (this._element) {


            console.warn(
                `[${this.properties!.id || this.constructor.name
                }] Re-render called but component is not currently in the DOM. Updating internal element only.`
            );

            await this.render();
        } else {
            console.warn(
                `[${this.properties!.id || this.constructor.name
                }] Re-render called before initial render or after dispose. No action taken.`
            );
        }
    }
}
