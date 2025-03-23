# Language Guessr 3D - Client Documentation

## Overview
Language Guessr 3D is an interactive web application that challenges users to identify languages based on audio snippets. The game features a 3D globe where users can explore different regions and make guesses about the languages spoken in those areas.

## Project Structure
The client-side of the project is organized as follows:

- **assets/**: Contains 3D models and textures used in the game.
  - **models/**: 3D models such as the globe and other interactive elements.
  - **textures/**: Texture files that enhance the visual appearance of the 3D models.

- **components/**: React components that make up the user interface.
  - **Globe.js**: Renders a 3D globe using Three.js for user interaction.
  - **AudioPlayer.js**: Plays audio snippets of languages for the user.
  - **GuessForm.js**: A form for users to submit their guesses about the language's origin.

- **scenes/**: Contains different scenes for the game, including the main game scene.

- **utils/**: Utility functions that can be reused throughout the application, such as audio playback handling.

- **services/**: Manages API calls to the backend, including fetching audio snippets and submitting user guesses.

- **App.js**: The main application component that sets up the game, rendering the globe and managing state.

- **index.js**: The entry point for the React application, rendering the App component into the DOM.

## Getting Started
To get started with the client-side of the project, follow these steps:

1. **Clone the repository**: 
   ```
   git clone <repository-url>
   ```

2. **Navigate to the client directory**:
   ```
   cd language-guessr-3d/client
   ```

3. **Install dependencies**:
   ```
   npm install
   ```

4. **Run the application**:
   ```
   npm start
   ```

The application will be available at `http://localhost:3000`.

## Future Enhancements
- Implement additional features such as hints or lifelines for users.
- Expand the audio snippet library to include more languages and dialects.
- Enhance the visual aspects of the globe and user interface for a more immersive experience.

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any suggestions or improvements.

## License
This project is licensed under the MIT License. See the LICENSE file for details.