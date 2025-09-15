# Chess Backend

This project is the backend for a chess application, providing AI capabilities.

## Demo

A live demo of the project is available here: [https://chesstra.vercel.app/](https://chesstra.vercel.app/)


## Technologies

*   **Node.js:** JavaScript runtime environment.
*   **Express.js:** Web application framework for Node.js.
*   **CORS:** Middleware for enabling Cross-Origin Resource Sharing.
*   **Stockfish:** Chess engine for AI move generation.
*   **Child Process (spawn):** Node.js module for spawning child processes to interact with Stockfish.

## Methodologies

*   **RESTful API:** Provides a `/api/bestmove` endpoint for AI move requests.
*   **Inter-process Communication:** Uses `child_process` to communicate with the Stockfish engine via UCI protocol.
*   **Environment Variables:** Configuration management for server port.
*   **Modular Design:** Separation of concerns between API handling and Stockfish interaction.
