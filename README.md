# Language Guessr 3D

Language Guessr 3D is an interactive web-based game that challenges players to identify languages based on audio snippets. The game utilizes Three.js for rendering a 3D globe, providing an immersive experience as players guess the origin of various languages.

## Project Structure

The project is divided into two main parts: the client and the server.

### Client

- **src/assets/models**: Contains 3D models used in the game, such as the globe and other interactive elements.
- **src/assets/textures**: Holds texture files for the 3D models to enhance their visual appearance.
- **src/components**: Includes React components for the game:
  - **Globe.js**: Renders a 3D globe using Three.js.
  - **AudioPlayer.js**: Plays the language audio snippets.
  - **GuessForm.js**: Allows users to submit their guesses about the language's origin.
- **src/scenes**: Contains different scenes for the game, such as the main game scene.
- **src/utils**: Includes utility functions for audio playback and other reusable logic.
- **src/services**: Manages API calls to the backend for fetching audio snippets and submitting guesses.
- **App.js**: The main application component that sets up the game.
- **index.js**: The entry point for the React application.

### Server

- **src/controllers**: Handles incoming requests and responses for the backend.
- **src/models**: Defines data models for audio snippets and user guesses.
- **src/routes**: Defines API routes connecting requests to the appropriate controllers.
- **src/services**: Contains business logic for fetching audio snippets from the database.
- **src/utils**: Includes utility functions for error handling and other backend tasks.
- **src/db**: Manages database connections and queries to PostgreSQL.
- **index.js**: The entry point for the backend application.

### Database

- **schema.sql**: Defines the SQL schema for the PostgreSQL database, including tables for audio snippets and user guesses.

### Docker

- **docker-compose.yml**: Defines the services and configurations needed to run the application in Docker containers.

## Setup Instructions

1. **Clone the repository**: 
   ```
   git clone <repository-url>
   cd language-guessr-3d
   ```

2. **Install dependencies**:
   - For the client:
     ```
     cd client
     npm install
     ```
   - For the server:
     ```
     cd server
     npm install
     ```

3. **Set up the database**:
   - Create a PostgreSQL database and run the `schema.sql` file to set up the necessary tables.

4. **Run the application**:
   - Start the server:
     ```
     cd server
     npm start
     ```
   - Start the client:
     ```
     cd client
     npm start
     ```

5. **Access the game**: Open your browser and navigate to `http://localhost:3000` to start playing.

## Contributing

Contributions are welcome! Please feel free to submit a pull request or open an issue for any suggestions or improvements.

## License

This project is licensed under the MIT License. See the LICENSE file for details.