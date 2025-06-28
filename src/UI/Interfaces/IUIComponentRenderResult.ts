/**
 * Represents the result of rendering a UI component.
 *
 * @property result - The rendered output, which can be an `HTMLElement`, a `DocumentFragment`, or `undefined` if rendering did not produce a result.
 */
export interface IUIComponentRenderResult {
    result: HTMLElement | DocumentFragment | undefined;
}
