const { app, BrowserWindow } = require('electron')


function createWindow () {
  // Cree la fenetre du navigateur.
  let win = new BrowserWindow({
    width: 900,
    height: 600,
    webPreferences: {
      nodeIntegration: true
    },
    autoHideMenuBar: true,
    resizable: false,
  })

  // and load the index.html of the app.
  win.loadFile('index.html')
}

app.whenReady().then(createWindow)

