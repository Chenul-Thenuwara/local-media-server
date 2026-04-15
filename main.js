const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const crypto = require('crypto');
const localtunnel = require('localtunnel');

let mainWindow;
let backendProcess;
let tunnelInstance;

function getDeviceId() {
  const userDataPath = app.getPath('userData');
  const deviceIdPath = path.join(userDataPath, 'device_id.txt');
  
  if (fs.existsSync(deviceIdPath)) {
    return fs.readFileSync(deviceIdPath, 'utf8').trim();
  } else {
    const newId = crypto.randomUUID();
    fs.writeFileSync(deviceIdPath, newId);
    return newId;
  }
}

async function startTunnel() {
  console.log('Starting localtunnel...');
  try {
    tunnelInstance = await localtunnel({ port: 3000 });
    console.log('Tunnel URL:', tunnelInstance.url);
    
    tunnelInstance.on('close', () => {
      console.log('Tunnel closed');
    });

    return tunnelInstance.url;
  } catch (e) {
    console.error('Tunnel error:', e);
    return null;
  }
}

function startBackend(deviceId, tunnelUrl) {
  const isDev = !app.isPackaged;
  
  const env = { 
    ...process.env, 
    DEVICE_ID: deviceId,
    TUNNEL_URL: tunnelUrl || '',
    PORT: '3000' 
  };
  
  const backendPath = isDev 
    ? path.join(__dirname, 'backend', 'src', 'index.ts')
    : path.join(__dirname, 'backend', 'dist', 'index.js');
    
  const backendCommand = isDev 
    ? (process.platform === 'win32' ? 'npx.cmd' : 'npx') 
    : 'node';
    
  const backendArgs = isDev 
    ? ['ts-node', backendPath] 
    : [backendPath];

  backendProcess = spawn(
    backendCommand, 
    backendArgs, 
    {
      cwd: path.join(__dirname, 'backend'),
      env: env,
      stdio: 'pipe',
      shell: process.platform === 'win32'
    }
  );

  backendProcess.stdout.on('data', (data) => console.log(`[Backend]: ${data}`));
  backendProcess.stderr.on('data', (data) => console.error(`[Backend Area]: ${data}`));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = !app.isPackaged;

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL('http://localhost:3000');
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  const deviceId = getDeviceId();
  console.log('App started with Device ID:', deviceId);
  
  // 1. Establish secure tunnel first
  const tunnelUrl = await startTunnel();
  
  // 2. Start backend and pass the tunnel URL via ENV
  startBackend(deviceId, tunnelUrl);
  
  // Wait a moment for the backend to start
  setTimeout(createWindow, 2000);
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
  if (tunnelInstance) {
    tunnelInstance.close();
  }
});
