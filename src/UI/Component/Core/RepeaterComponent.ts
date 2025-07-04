
import { IRepeaterComponentProperties, IRepeaterComponentState } from "../../Interfaces/IRepeaterComponentInterfaces";
import { UIComponentBase } from "../../UIComponent";

/**
 * A generic component that renders a list of items using a provided component renderer for each item.
 * It manages the lifecycle (onEnter, onLeave, dispose) of its dynamically created child components.
 *
 * @template T The type of the items in the list.
 */
export class RepeaterComponent<T> extends UIComponentBase<IRepeaterComponentState, IRepeaterComponentProperties<T>> {

    private renderedChildComponents: Map<string | number, UIComponentBase> = new Map();

    constructor(properties: IRepeaterComponentProperties<T>) {
        super({
            ...properties,
            state: {},
            template: (component: RepeaterComponent<T>) => {
                const { cssClasses = '', itemContainerTag = 'div' } = component.properties;

                console.log("Hitting the itemContainerTag")

                return`
                    <${itemContainerTag} id="${component.properties.id}-items-container" class="${cssClasses}">
                        </${itemContainerTag}>
                `;
            }
        });
        console.log(`[${this.properties.id || 'RepeaterComponent'}] Initialized with ${properties.items.length} items.`);
    }

    /**
     * Called when the RepeaterComponent is mounted to the DOM.
     * This is where it initiates the rendering of its child item components.
     */
    public async onEnter(): Promise<void> {
        await super.onEnter();
        console.log(`[${this.properties.id || 'RepeaterComponent'}] onEnter: Rendering items as child components.`);
        await this.renderItemsAsComponents();
    }

    /**
     * Handles the dynamic creation and rendering of each item as a child component.
     * It also manages the disposal of child components that are no longer present in the items list.
     */
    private async renderItemsAsComponents(): Promise<void> {
        const itemsContainer = this._element;
        if (!itemsContainer) {
            console.error(`[${this.properties.id || 'RepeaterComponent'}] Items container not found for rendering children!`);
            return;
        }

        const currentItemIds = new Set<string | number>();

        for (const item of this.properties.items) {
            const itemId = item[this.properties.uniqueIdField] as string | number;
            currentItemIds.add(itemId);

            if (!this.renderedChildComponents.has(itemId)) {
                const itemWrapper = document.createElement(this.properties.itemContainerTag || 'div');
                itemWrapper.id = `${this.properties.id}-item-wrapper-${itemId}`;
                itemsContainer.appendChild(itemWrapper);

                try {
                    const childComponent = await this.properties.itemComponentRenderer(
                        item,
                        itemWrapper,
                        `${this.properties.id}-child-${itemId}`,
                        this.properties.context
                    );

                    if (childComponent) {
                        this.renderedChildComponents.set(itemId, childComponent);
                        childComponent.onEnter();
                    }
                } catch (error) {
                    console.error(`[${this.properties.id || 'RepeaterComponent'}] Error rendering child for item ${itemId}:`, error);
                }
            } else {
            }
        }

        for (const [existingItemId, childComponent] of this.renderedChildComponents.entries()) {
            if (!currentItemIds.has(existingItemId)) {
                console.log(`[${this.properties.id || 'RepeaterComponent'}] Disposing orphaned child component for item ID: ${existingItemId}.`);
                childComponent.dispose();
                this.renderedChildComponents.delete(existingItemId);
            }
        }
    }

    /**
     * Called when the RepeaterComponent is removed from the DOM or disposed.
     * Ensures all managed child components are properly disposed of to prevent memory leaks.
     */
    public onLeave(): void {
        super.onLeave();
        console.log(`[${this.properties.id || 'RepeaterComponent'}] onLeave: Disposing all managed child components.`);
        for (const childComponent of this.renderedChildComponents.values()) {
            childComponent.dispose();
        }
        this.renderedChildComponents.clear();
    }

    /**
     * The dispose method should also ensure onLeave is called for proper cleanup.
     */
    public dispose(): void {
        this.onLeave();
        super.dispose();
        console.log(`[${this.properties.id || 'RepeaterComponent'}] Disposed.`);
    }
}