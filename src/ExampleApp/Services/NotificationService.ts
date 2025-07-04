import DathorHelpers from "../../helpers/all";
import { EventBus } from "../../UI/Application/EventBus";
import { serviceLocator } from "../../UI/Service/ServiceLocator";
import { INotification, NOTIFICATION_EVENT_NAME } from "../Interfaces/INotificationComponentInterfaces";


export class NotificationService {
    constructor() {
             
        console.log("[NotificationService] initialized.");
    }

    /**
     * Shows a new notification/toast message.
     * @param message The message to display.
     * @param type The type of notification ('success', 'error', 'info', 'warning'). Defaults to 'info'.
     * @param duration How long the notification should stay visible in milliseconds. Defaults to 5000ms.
     * @param dismissible Whether the user can dismiss the notification manually. Defaults to true.
     * @param id An optional unique ID for the notification. If not provided, one will be generated.
     */
    public showNotification(
        message: string,
        type: INotification['type'] = 'info',
        duration: number = 5000,
        dismissible: boolean = true,
        id?: string
    ): void {
        const notification: INotification = {
            id: id || crypto.randomUUID(),
            message,
            type,
            duration,
            dismissible
        };
        console.log("[NotificationService] Publishing new notification:", notification);
        serviceLocator.get<EventBus>("EventBus").publish(NOTIFICATION_EVENT_NAME, notification);
    }

    // You can add more specific helper methods if desired
    public showSuccess(message: string, duration?: number, dismissible?: boolean): void {
        this.showNotification(message, 'success', duration, dismissible);
    }

    public showError(message: string, duration?: number, dismissible?: boolean): void {
        this.showNotification(message, 'error', duration, dismissible);
    }

    public showInfo(message: string, duration?: number, dismissible?: boolean): void {
        this.showNotification(message, 'info', duration, dismissible);
    }

       public showWarning(message: string, duration?: number, dismissible?: boolean): void {
        this.showNotification(message, 'warning', duration, dismissible);
    }
}
