
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Check for Python environment
const isPython3 = process.platform === 'win32' ? 'python' : 'python3';

// Path to the backend.py file
const backendPath = path.join(__dirname, 'backend.py');

// Ensure the backend file exists
if (!fs.existsSync(backendPath)) {
  console.error('Error: backend.py not found at:', backendPath);
  process.exit(1);
}

console.log('Starting Flask backend server...');

// Start the Flask server
const flaskProcess = spawn(isPython3, [backendPath], {
  stdio: 'pipe',
  detached: false
});

flaskProcess.stdout.on('data', (data) => {
  console.log(`[Flask]: ${data.toString().trim()}`);
});

flaskProcess.stderr.on('data', (data) => {
  console.error(`[Flask Error]: ${data.toString().trim()}`);
});

flaskProcess.on('close', (code) => {
  console.log(`Flask backend process exited with code ${code}`);
});

// Handle Node process exit
process.on('SIGINT', () => {
  console.log('Stopping Flask backend server...');
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', flaskProcess.pid, '/f', '/t']);
  } else {
    flaskProcess.kill('SIGINT');
  }
  process.exit();
});

console.log('Flask backend server started!');
