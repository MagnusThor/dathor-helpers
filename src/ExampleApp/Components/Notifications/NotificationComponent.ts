// src/components/Notifications/NotificationComponent.ts

import DathorHelpers from "../../../helpers/all";
import { UIObservedComponent } from "../../../UI/UIObservedComponent";
import { INotificationComponentState, INotificationComponentProperties, NOTIFICATION_EVENT_NAME, INotification } from "../../Interfaces/INotificationComponentInterfaces";


export class NotificationComponent extends UIObservedComponent<INotificationComponentState> {

    constructor(properties: INotificationComponentProperties) {
        super({
            ...properties,
            state: {
                notifications: [] // Initial state: no notifications
            },
            template: (component: NotificationComponent) => {
                const { notifications } = component.getState(); // Access current state
                // Console log for debugging
                console.log(`[${component.properties.id}] NotificationComponent template: Rendering with notifications:`, notifications);

                if (notifications.length === 0) {
                    return `<div id="${component.properties.id}-container" class="hidden"></div>  `; // Render nothing if no notifications
                }

                return /*html*/`
                    <div id="${component.properties.id}-container" class="fixed bottom-4 right-4 z-50 space-y-2 w-full max-w-sm">
                        ${notifications.map((notification:
                    { id: any; type: "success" | "error" | "info" | "warning"; message: any; dismissible: any; }) => `
                            <div id="notification-${notification.id}" 
                                class="p-4 rounded-lg shadow-lg flex items-center justify-between text-white ${NotificationComponent.getNotificationClasses(notification.type)} animate-fade-in-up"
                                data-notification-id="${notification.id}"
                                data-action="dismiss-notification"
                            >
                                <span>${notification.message}</span>
                                ${notification.dismissible ? `
                                    <button class="ml-4 text-white hover:text-gray-200 focus:outline-none" data-action="dismiss-notification">
                                        &times;
                                    </button>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                `;
            },
            eventHandlers: {
                click: (event: Event) => {
                    const target = event.target as HTMLElement;
                    const notificationElement = target.closest('[data-notification-id]') as HTMLElement;
                    if (notificationElement && target.dataset.action === 'dismiss-notification') {
                        const notificationId = notificationElement.dataset.notificationId;
                        if (notificationId) {
                            this.dismissNotification(notificationId);
                        }
                    }
                }
            }
        });
        console.log(`[${this.properties.id}] NotificationComponent initialized.`);

        // Subscribe to the global notification event
        this.subscribe(NOTIFICATION_EVENT_NAME, this.handleNewNotification.bind(this));

       // this.render();
    }

    // Helper to get Tailwind CSS classes based on notification type
    private static getNotificationClasses(type: INotification['type']): string {
        switch (type) {
            case 'success': return 'bg-green-500';
            case 'error': return 'bg-red-500';
            case 'info': return 'bg-blue-500';
            case 'warning': return 'bg-yellow-500';
            default: return 'bg-gray-700';
        }
    }

    // Method to add a new notification to the state
    private addNotification(notification: INotification): void {
        console.log(`[${this.properties.id}] Adding notification:`, notification);
        this.properties!.state!.notifications = [
            ...this.properties!.state!.notifications, notification];

        if (notification.duration && notification.duration > 0) {
            setTimeout(() => {
                this.dismissNotification(notification.id);
            }, notification.duration);
        }
    }

    // Method to remove a notification from the state
    private dismissNotification(id: string): void {
        console.log(`[${this.properties.id}] Dismissing notification: ${id}`);
        // Directly mutate the observed state
        this.properties!.state!.notifications =
            this.properties!.state!.notifications.filter(n => n.id !== id);
    }

    // Handler for global notification event
    private handleNewNotification(notificationData: INotification): void {
        console.log(`[${this.properties.id}] Received new notification event:`, notificationData);
        // Add a unique ID if not provided (for list rendering and dismissal)
        const notificationWithId = {
            ...notificationData, id: notificationData.id ||
                crypto.randomUUID()
        };
        this.addNotification(notificationWithId);
    }

    public onLeave(): void {
        super.onLeave();
        // Unsubscribe from events to prevent memory leaks
        this.unsubscribe(NOTIFICATION_EVENT_NAME, this.handleNewNotification.bind(this),
            this.properties.id
        );
        console.log(`[${this.properties.id}] NotificationComponent unsubscribed from events.`);
    }

    // You might want to adjust onStateChanged if you have specific logic based on its own state changing
    // protected onStateChanged(oldState: INotificationComponentState, newState: INotificationComponentState): void {
    //     super.onStateChanged(oldState, newState);
    //     // Any additional logic when internal state changes
    // }
}