// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require('electron')

let mainWindow; // Declare mainWindow as a global variable

const createWindow = () => {
  // Create the browser window.
    mainWindow = new BrowserWindow({
        width: 1600,
        height: 1200,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation:false,
        }
  })

  mainWindow.loadFile('index.html')

  mainWindow.on('ready-to-show', () => {
    mainWindow.show();
    setupEventHandlers();
  });
}

const setupEventHandlers = () => {
    // Listen for message from renderer process
    ipcMain.on('send-message', (event, message) => {
      // Check if mainWindow is defined before accessing its webContents
      if (mainWindow) {
        // Send the message back to the renderer process to display
        mainWindow.webContents.send('display-message', message);
      } else {
        console.error('Main window is undefined');
      }
    });
  };

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
