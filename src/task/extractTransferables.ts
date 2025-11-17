export const extractTransferables = (obj: any): Transferable[] => {
    const transfers: Transferable[] = [];

    const recurse = (value: any) => {
        if (!value) return;

        if (ArrayBuffer.isView(value)) {
            transfers.push(value.buffer); // typed array
        } else if (value instanceof ArrayBuffer) {
            transfers.push(value); // raw ArrayBuffer
        } else if (Array.isArray(value)) {
            value.forEach(recurse);
        } else if (typeof value === "object") {
            Object.values(value).forEach(recurse);
        }
    };

    recurse(obj);
    return transfers;
};
