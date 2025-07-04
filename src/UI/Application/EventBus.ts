// core/EventBus.ts (Your Updated Code)

// Interface to store subscriber information, including their ID
export interface ISubscriberInfo {
    id: string; // The ID of the component/entity subscribing
    callback: (...args: any[]) => void;
}

export class EventBus {
    // A map where the key is the topic name (string)
    // and the value is an array of SubscriberInfo objects for that topic.
    private subscribers = new Map<string, ISubscriberInfo[]>();

    // Singleton instance
    private static instance: EventBus;

    // Private constructor to enforce singleton pattern
    private constructor() {
        console.log("[EventBus] Initialized (Singleton)");
    }

    // Static method to get the singleton instance
    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Subscribes a callback function to a specific topic.
     * The `subscriberId` is now required to enable targeted messages and proper unsubscription.
     * @param topic The name of the event topic.
     * @param callback The function to be called when the event is published.
     * @param subscriberId The ID of the component/entity that is subscribing.
     */
    subscribe(topic: string, callback: (...args: any[]) => void, subscriberId: string): void {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }

        // Check if this specific subscriber/callback combination already exists for this topic
        const existingSubscribers = this.subscribers.get(topic);
        if (existingSubscribers?.some(sub => sub.id === subscriberId && sub.callback === callback)) {
            console.warn(`[EventBus] Subscriber "${subscriberId}" already has this callback subscribed to topic: "${topic}". Skipping.`);
            return; // Prevent duplicate subscriptions
        }

        // Add the subscriber with their ID to the list for this topic
        existingSubscribers?.push({ id: subscriberId, callback });
        console.log(`[EventBus] Component "${subscriberId}" subscribed to topic: "${topic}"`);
    }

    /**
     * Unsubscribes a specific callback from a topic for a given subscriber ID.
     * @param topic The name of the event topic.
     * @param callback The original callback function to remove.
     * @param subscriberId The ID of the component/entity that subscribed.
     */
    unsubscribe(topic: string, callback: (...args: any[]) => void, subscriberId: string): void {
        const topicSubscribers = this.subscribers.get(topic);
        if (topicSubscribers) {
            const initialLength = topicSubscribers.length;
            // Filter out the specific subscription by matching both callback and ID
            const newSubscribers = topicSubscribers.filter(sub => !(sub.callback === callback && sub.id === subscriberId));
            
            if (newSubscribers.length < initialLength) {
                this.subscribers.set(topic, newSubscribers);
                console.log(`[EventBus] Component "${subscriberId}" unsubscribed from topic: "${topic}".`);
            } else {
                 console.warn(`[EventBus] No matching subscription found for ID "${subscriberId}" and topic "${topic}" to unsubscribe.`);
            }
        } else {
            console.warn(`[EventBus] No subscribers found for topic "${topic}" to unsubscribe from.`);
        }
    }

    /**
     * Unsubscribes ALL callbacks for a given subscriber ID from a specific topic.
     * This is useful for components to clean up all their subscriptions on a topic when they leave.
     * @param topic The name of the event topic.
     * @param subscriberId The ID of the component/entity to unsubscribe.
     */
    unsubscribeAllForId(topic: string, subscriberId: string): void {
        const topicSubscribers = this.subscribers.get(topic);
        if (topicSubscribers) {
            const initialLength = topicSubscribers.length;
            const newSubscribers = topicSubscribers.filter(sub => sub.id !== subscriberId);
            if (newSubscribers.length < initialLength) {
                this.subscribers.set(topic, newSubscribers);
                console.log(`[EventBus] Unsubscribed all callbacks for component "${subscriberId}" from topic: "${topic}".`);
            } else {
                console.warn(`[EventBus] No subscriptions found for ID "${subscriberId}" on topic "${topic}" to unsubscribe.`);
            }
        }
    }

    /**
     * Publishes data to a specific topic for ALL subscribers of that topic.
     * This is your existing broadcast functionality.
     * @param topic The name of the event topic.
     * @param data The data to be passed to the subscribers.
     */
    publish<T>(topic: string, data?: T): void {
        const topicSubscribers = this.subscribers.get(topic);
        if (topicSubscribers) {
            console.log(`[EventBus] Publishing (broadcast) to topic: "${topic}"`, data);
            // Iterate over a copy to prevent issues if subscribers unsubscribe themselves during iteration
            [...topicSubscribers].forEach(sub => {
                try {
                    sub.callback(data);
                } catch (e) {
                    console.error(`[EventBus] Error in subscriber for topic "${topic}" (ID: ${sub.id}):`, e);
                }
            });
        } else {
            console.warn(`[EventBus] No subscribers for topic "${topic}". Broadcast ignored.`);
        }
    }

    /**
     * Publishes data to a specific topic, targeting ONLY a component with the given ID.
     * @param targetComponentId The ID of the component that should receive the message.
     * @param topic The name of the event topic.
     * @param data The data to be passed to the target component's subscriber.
     */
    publishTo<T>(targetComponentId: string, topic: string, data?: T): void {
        const topicSubscribers = this.subscribers.get(topic);
        if (topicSubscribers) {
            console.log(`[EventBus] Publishing (targeted) to topic: "${topic}" for component: "${targetComponentId}"`, data);
            // Filter subscribers to find only those matching the targetComponentId
            const targetSubscribers = topicSubscribers.filter(sub => sub.id === targetComponentId);

            if (targetSubscribers.length === 0) {
                console.warn(`[EventBus] No subscriber found for topic "${topic}" with target ID "${targetComponentId}". Targeted publish ignored.`);
            }

            // Execute callbacks for the targeted subscribers
            [...targetSubscribers].forEach(sub => {
                try {
                    sub.callback(data);
                } catch (e) {
                    console.error(`[EventBus] Error in targeted subscriber for topic "${topic}" (ID: ${sub.id}):`, e);
                }
            });
        } else {
            console.warn(`[EventBus] Topic "${topic}" has no subscribers at all. Targeted publish ignored.`);
        }
    }
}

