import DathorHelpers from "../../helpers/all";
import { eventBus } from "./ApplicationManager";
import { IGlobalAppState } from "../Interfaces/IGlobalAppState";


export class GlobalStateStore {
    private _state: IGlobalAppState;
    public observedState: IGlobalAppState;

    constructor(initialState: IGlobalAppState) {
        this._state = initialState;
        // Make the entire global state object observable
        this.observedState = DathorHelpers.observeAll(this._state, this.handleStateChange.bind(this));
    }

    private handleStateChange(): void {
        console.log("Global State Changed:", this._state);
        eventBus.publish('globalStateChanged', this._state);
    }
}
