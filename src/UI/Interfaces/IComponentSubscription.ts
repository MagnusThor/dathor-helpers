export interface IComponentSubscription {
    topic: string;
    action: (...args: any[]) => void;
}
