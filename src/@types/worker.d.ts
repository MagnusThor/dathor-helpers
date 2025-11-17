// worker.d.ts

/**
 * Declare the Webpack-specific import pattern for Web Workers.
 * This tells TypeScript that importing a file ending with '?worker' is valid
 * and resolves to a constructor/path that can be used to create a Worker instance.
 */
declare module '*.ts?worker' {
  // Assuming Webpack is configured to emit an ES Module worker, 
  // the import resolves to the default export, which is the Worker URL string.
  const workerUrl: string;
  export default workerUrl;
}