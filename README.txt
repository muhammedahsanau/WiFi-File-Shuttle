# Directory Explorer

Directory Explorer is a simple Node.js server application that hosts an HTML page for browsing and downloading files from a directory on your local machine. It allows users on the same WiFi network to access and download files from the directory and its subdirectories. The application includes a basic authentication system with user roles (admin and non-admin).

## Features

- Lists files and directories in a specified directory.
- Displays the creation date of files and directories.
- Allows users to navigate into subdirectories.
- Allows users to download files (admin only).
- Displays the current directory path.
- Accessible from any device on the same WiFi network.
- User authentication with admin and non-admin roles.
- Login page with authentication error handling.

## Prerequisites

- Node.js installed on your machine.

## Installation

1. Clone the repository or download the source code.
2. Open a terminal or command prompt and navigate to the directory where the source code is located.
3. Run `npm install` to install the required dependencies.

## Configuration

1. Open the `server.js` file in a text editor.
2. Replace `'your-directory-path'` with the path to the directory you want to serve.
3. Update `private/users.json` with your own usernames, passwords, and user types.

## Usage

1. Open a terminal or command prompt.
2. Navigate to the directory where the source code is located.
3. Run `node server.js` to start the server.
4. The server will log the local IP address and port it is running on. For example:
5. On another device connected to the same WiFi network, open a web browser and navigate to the IP address and port logged by the server (e.g., `http://192.168.1.10:3000`).
6. You will be prompted to log in. Use the credentials from `private/users.json`.

## File Structure

- `server.js`: The main server file.
- `index.html`: The HTML file served by the server.
- `public/login.html`: The login page.
- `public/styles.css`: The CSS file for styling the HTML pages.
- `private/users.json`: The JSON file storing user credentials and user types.

## Troubleshooting

### Error: `Error [ERR_HTTP_HEADERS_SENT]: Cannot set headers after they are sent to the client`

This error occurs when the server tries to send multiple responses for a single request. Ensure that no additional headers are set after the `res.download` call. Proper error handling should prevent this issue.

### Error: `Error: write EPIPE`

This error occurs when the client terminates the connection before the server has finished writing to the response. Ensure proper error handling in the `res.download` function to avoid this issue.

## License

This project is licensed under the MIT License.

## Acknowledgements

This project was created with the help of Node.js and the Express framework.
