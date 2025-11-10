dathor-helpers is a lightweight collection of pure JavaScript tools that I have created and refined during my day-to-day work as a web developer. It provides tools for DOM manipulation, data observation, form serialization, event management, and general-purpose functions.

## Introduction

This library is designed for developers who prefer a minimal, framework-agnostic approach to web development. It focuses on providing essential helper functions without adding unnecessary bloat. Perfect for projects that prioritize simplicity and performance. dathor-helpers provides direct access to standard JavaScript APIs, avoiding unnecessary abstractions for maximum simplicity and performance.

## Features

* **Tiny Footprint:** Lightweight and designed to minimize impact on your project's size.
* **Pure JavaScript:** No dependencies on external frameworks or libraries.
* **DOM Utilities:** Efficient functions for common DOM manipulation tasks.
* **Data Observation:** Simple data observation using JavaScript Proxies.
* **Form Serialization:** Easily serialize form data into JavaScript objects.
* **Event Handling:** Streamlined event management functions.
* **HTTP Fetch Helper:** Flexible wrapper around the native Fetch API with support for base URLs, JSON and FormData handling, query parameters, interceptors, and full control over requests and responses.
* **General Helpers:** Various utility functions for common JavaScript tasks.
* **Minimal Abstraction:** Designed for a straightforward approach, dathor-helpers minimizes abstraction layers to keep your code clean and efficient.
* **Task Scheduler & Factory** : High-precision, requestAnimationFrame-based scheduler for time-critical, I/O-bound tasks (Task.Delay, Task.WhenAll). Provides true CPU parallelism using secure Web Worker management (TaskFactory.RunWebWorkerTask) and built-in cancellation support (CancellationTokenSource) for robust asynchronous control flow (Task.ContinueWith, TaskFactory.ForAsync).

## Installation

   
        npm install dathor-helpers


