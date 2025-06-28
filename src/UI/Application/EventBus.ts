// eventBus.ts (Updated)

// Interface to store subscriber information, including their ID
export interface ISubscriberInfo {
    id: string; // The ID of the component/entity subscribing
    callback: (...args: any[]) => void;
}

export class EventBus {
    // A map where the key is the topic name (string)
    // and the value is an array of SubscriberInfo objects for that topic.
    private subscribers = new Map<string, ISubscriberInfo[]>();

    private static instance: EventBus;

    private constructor() { }

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Subscribes a callback function to a specific topic.
     * The `subscriberId` is now required to enable targeted messages.
     * @param topic The name of the event topic.
     * @param callback The function to be called when the event is published.
     * @param subscriberId The ID of the component/entity that is subscribing.
     */
    subscribe(topic: string, callback: (...args: any[]) => void, subscriberId: string): void {
        if (!this.subscribers.has(topic)) {
            this.subscribers.set(topic, []);
        }
        // Add the subscriber with their ID to the list for this topic
        this.subscribers.get(topic)?.push({ id: subscriberId, callback });
        console.log(`[EventBus] Component "${subscriberId}" subscribed to topic: "${topic}"`);
    }

    /**
     * Unsubscribes a specific callback from a topic.
     * The `subscriberId` is now required to correctly identify the subscription to remove.
     * @param topic The name of the event topic.
     * @param callback The original callback function to remove.
     * @param subscriberId The ID of the component/entity that subscribed.
     */
    unsubscribe(topic: string, callback: (...args: any[]) => void, subscriberId: string): void {
        const topicSubscribers = this.subscribers.get(topic);
        if (topicSubscribers) {
            // Filter out the specific subscription by matching both callback and ID
            this.subscribers.set(
                topic,
                topicSubscribers.filter(sub => !(sub.callback === callback && sub.id === subscriberId))
            );
            console.log(`[EventBus] Component "${subscriberId}" unsubscribed from topic: "${topic}"`);
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
export const eventBus = EventBus.getInstance();