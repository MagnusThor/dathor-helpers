/**
 * A helper class for working with ArrayBuffer, Blobs, and Data URLs.
 * These utilities are essential for handling binary data in modern web applications.
 */
export class ArrayBufferHelpers {
    /**
     * Converts a Blob object into an ArrayBuffer.
     * @param blob - The Blob object to convert.
     * @returns A Promise that resolves with the resulting ArrayBuffer.
     */
    static async toArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as ArrayBuffer);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(blob);
        });
    }
    /**
     * Creates a Blob object from an ArrayBuffer and an optional MIME type.
     * @param buffer - The ArrayBuffer containing the data.
     * @param mimeType - The MIME type of the data (e.g., 'image/png', 'application/octet-stream').
     * @returns The resulting Blob object.
     */
    static createBlob(buffer: ArrayBuffer, mimeType: string = 'application/octet-stream'): Blob {
        return new Blob([buffer], { type: mimeType });
    }
    /**
     * Converts an ArrayBuffer and its MIME type into a Base64 Data URL string.
     * @param buffer - The ArrayBuffer containing the data.
     * @param mimeType - The MIME type of the data (e.g., 'image/jpeg').
     * @returns A string representing the Data URL (e.g., 'data:image/jpeg;base64,...').
     */
    static toDataURL(buffer: ArrayBuffer, mimeType: string): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);
        return `data:${mimeType};base64,${base64}`;
    }
    /**
     * Parses a Base64 Data URL string and extracts the ArrayBuffer and MIME type.
     * @param dataUrl - The Data URL string (e.g., 'data:image/jpeg;base64,...').
     * @returns An object containing the ArrayBuffer and the MIME type.
     * @throws An error if the Data URL format is invalid.
     */
    static fromDataURL(dataUrl: string): { buffer: ArrayBuffer; mimeType: string } {
        const parts = dataUrl.split(',');
        if (parts.length !== 2) {
            throw new Error('Invalid Data URL format.');
        }

        const meta = parts[0].split(';');
        const mimeType = meta[0].replace('data:', '');
        const base64 = parts[1];

        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);

        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        return { buffer: bytes.buffer, mimeType };
    }

    /**
    * Reads the entire content of a File or Blob object into an ArrayBuffer.
    * * @param fileOrBlob - The File or Blob object to read.
    * @returns A Promise that resolves with an object containing the ArrayBuffer 
    * and the original File/Blob object reference (tf).
    * @template T - The type of the input file/blob (usually File or Blob).
    */
    static readFileOrBlob<T extends Blob>(fileOrBlob: T): Promise<{ buffer: ArrayBuffer, tf: T }> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onerror = (error) => reject(error);

            reader.onload = (function (originalFile) {
                return function (e: ProgressEvent<FileReader>) {
                    if (e.target && e.target.result) {
                        resolve({ buffer: e.target.result as ArrayBuffer, tf: originalFile });
                    } else {
                        reject(new Error("File read resulted in no data."));
                    }
                };
            })(fileOrBlob);

            reader.readAsArrayBuffer(fileOrBlob);
        });
    }

    /**
     * Reads a File or Blob in chunks of a fixed size, useful for large files 
     * or streaming processing.
     * * @param fileOrBlob - The File or Blob object to read.
     * @param callback - A function called for each chunk read.
     * @param chunkSize - Optional size of each chunk in bytes (default: 16384).
     */
    static readChunksFileOrBlob(
        fileOrBlob: Blob,
        callback: (buffer: ArrayBuffer, chunkSize: number, isFinal: boolean) => void,
        chunkSize: number = 16384
    ): void {
        let fileReader = new FileReader();
        let offset = 0;
        let remains = fileOrBlob.size;

        fileReader.addEventListener('error', error => console.error('Error reading file:', error));
        fileReader.addEventListener('abort', event => console.log('File reading aborted:', event));

        fileReader.addEventListener('load', (e: ProgressEvent<FileReader>) => {
            const currentBuffer = e.target?.result as ArrayBuffer;
            const currentChunkSize = currentBuffer.byteLength;

            remains -= currentChunkSize;

            // Check if this is the final chunk
            const isFinal = remains <= 0;

            callback(currentBuffer, currentChunkSize, isFinal);

            offset += currentChunkSize;

            if (!isFinal) {
                readSlice(offset);
            }
        });

        const readSlice = (o: number) => {
            const slice = fileOrBlob.slice(o, o + chunkSize);
            fileReader.readAsArrayBuffer(slice);
        };

        // Start reading from the beginning
        readSlice(0);
    }
}
