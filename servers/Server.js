const http = require('http');
const app = require('./app'); // Import the Express app
const server = http.createServer(app); // Create HTTP server

const { API_PORT } = process.env;
const port = process.env.PORT || API_PORT;

server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});