import { IPageComponentProperties } from "../../UI/Interfaces/IPageComponentProperties";

export const pageErrorMessage = (properties: IPageComponentProperties, error: string) => {

    return /*html*/`
            <div class="product-detail-page p-6 bg-white shadow rounded-lg text-center text-red-600">
                <h1 class="text-2xl font-bold mb-4">Error Loading ${properties.name!}</h1>
                <p>${error}</p>
                <button class="mt-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors duration-200"
                        data-event-click="goBack">
                    Go Back
                </button>
            </div>`;
}

export const pageLoading = (message:string) =>{
    return /*html*/`
    <div class="product-detail-page p-6 bg-white shadow rounded-lg text-center">
        <p class="text-gray-600 text-lg">${message}</p>
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mt-4"></div>
    </div>`;
} 

