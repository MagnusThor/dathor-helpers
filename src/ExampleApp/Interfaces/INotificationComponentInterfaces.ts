// src/components/Interfaces/INotificationComponentInterfaces.ts

import { IUIComponentPropertyBag } from "../../UI/Interfaces/IUIComponentPropertyBag";

export interface INotification {
    id: string; // Unique ID for the notification
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number; // How long it should display in milliseconds (optional)
    dismissible?: boolean; // Can the user close it? (optional)
}

export interface INotificationComponentState {
    notifications: INotification[];
}

export interface INotificationComponentProperties extends IUIComponentPropertyBag<INotificationComponentState> {
    id: string;
    name: string
    // No specific properties needed beyond the base IUIComponentPropertyBag for this example
}

// Define an event name for the NotificationService
export const NOTIFICATION_EVENT_NAME = 'newNotification';