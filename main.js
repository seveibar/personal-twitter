// Modules to control application life and create native browser window
const { app, BrowserWindow, ipcMain } = require("electron")

const sqlite3 = require("sqlite3").verbose()
const db = new sqlite3.Database(
  `${require("os").homedir()}/.personal-twitter.db`
)

db.run(
  `
CREATE TABLE IF NOT EXISTS tweet (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
`.trim()
)

ipcMain.on("getTweets", async (event, startFromId) => {
  console.log("getting tweets...")
  const tweets = await new Promise(resolve => {
    // TODO SQL Injection, I don't care for now
    db.all(
      `SELECT * FROM tweet ${
        startFromId ? `WHERE id < ${startFromId}` : ""
      } ORDER BY id DESC LIMIT 200`,
      (err, rows) => {
        resolve(rows)
      }
    )
  })
  event.sender.send("tweets", { tweets })
})

ipcMain.on("addTweet", async (event, text) => {
  console.log(`tweeting "${text}"...`)
  db.run(
    `INSERT INTO tweet (content, created_at) VALUES (?, ?)`,
    [text, Date.now()],
    err => {
      if (err) console.log("ERROR", err.toString())
    }
  )
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({ width: 400, height: 600 })

  // and load the index.html of the app.
  mainWindow.loadFile("index.html")
  mainWindow.setMenu(null)

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()

  // Emitted when the window is closed.
  mainWindow.on("closed", function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", createWindow)

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", function() {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
