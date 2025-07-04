export type ServiceInstance = any;

export class ServiceLocator {
    private services: Map<string, ServiceInstance> = new Map();

    /**
     * Registers a service instance with a unique name.
     * This is typically done during your application's bootstrapping phase.
     * @param name The unique name (identifier) for the service.
     * @param serviceInstance The actual instance of the service to register.
     * @template T The type of the service instance, for type safety.
     */
    register<T extends ServiceInstance>(name: string, serviceInstance: T): void {
        if (this.services.has(name)) {
            console.warn(`[ServiceLocator] Service "${name}" already registered. Overwriting.`);
        }
        this.services.set(name, serviceInstance);
        console.log(`[ServiceLocator] Service "${name}" registered.`);
    }

    /**
     * Retrieves a registered service instance by its name.
     * Components will call this method when they need a service.
     * @param name The name of the service to retrieve.
     * @returns The registered service instance.
     * @template T The expected type of the service instance, for type safety.
     * @throws {Error} If the service with the given name is not found.
     */
    get<T extends ServiceInstance>(name: string): T {
        const service = this.services.get(name);
        if (!service) {
            // It's crucial to handle cases where a service isn't found.
            // Throwing an error here prevents silent failures.
            throw new Error(`[ServiceLocator] Service "${name}" not found.`);
        }
        return service as T;
    }

    /**
     * Checks if a service is already registered.
     * Useful for conditional logic or preventing re-registration warnings.
     * @param name The name of the service.
     * @returns `true` if registered, `false` otherwise.
     */
    has(name: string): boolean {
        return this.services.has(name);
    }
}

// Export a singleton instance. This ensures only one ServiceLocator exists.
export const serviceLocator = new ServiceLocator();