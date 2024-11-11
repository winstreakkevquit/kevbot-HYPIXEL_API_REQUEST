const express = require('express');
const { spawn } = require('child_process');
const app = express();

// Define a route for the home page
app.get('/', (req, res) => {
  res.send('Bot is running.');
});

const port = process.env.PORT || 10000;
app.listen(port, () => {
  console.log(`Web server running on port ${port}`);
});

// Keep the bot alive
function keepAlive() {
  spawn('node', [process.argv[1]], {
    detached: true,
    stdio: 'ignore'
  }).unref();
}

keepAlive();
