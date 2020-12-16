'use strict'

import {app, BrowserWindow, ipcMain} from 'electron'
import * as path from 'path'
import {format as formatUrl} from 'url'
import fetch from "electron-fetch";
import FormData from 'form-data'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
    const window = new BrowserWindow(
        {
            webPreferences: {nodeIntegration: true},
            icon: __dirname + '/icon.ico'
        })
    window.setTitle("PakPos")
    window.setMenu(null)
    if (isDevelopment) {
        window.webContents.openDevTools()
    }

    if (isDevelopment) {
        window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
    } else {
        window.loadURL(formatUrl({
            pathname: path.join(__dirname, 'index.html'),
            protocol: 'file',
            slashes: true
        }))
    }

    window.on('closed', () => {
        mainWindow = null
    })

    window.webContents.on('devtools-opened', () => {
        window.focus()
        setImmediate(() => {
            window.focus()
        })
    })

    return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
    // on macOS it is common for applications to stay open until the user explicitly quits
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    // on macOS it is common to re-create a window even after all windows have been closed
    if (mainWindow === null) {
        mainWindow = createMainWindow()
    }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
    mainWindow = createMainWindow()
})
ipcMain.on('send-request', (event, arg) => {
    let body_field = arg.Body
    let header_field = arg.Header
    const form = new FormData()
    let header = {};
    for (let i = 0; i < body_field.length; i++) {
        if (body_field[i].key !== '')
            form.append(body_field[i].key, body_field[i].value)
    }
    var mapped = header_field.map(item => ({[item.key]: item.value}));
    header = Object.assign({}, ...mapped);
    delete header['']
    if(arg.Method==="POST"){
        fetch(arg.Url, {method: arg.Method, body: form, headers: header})
            .then(res => res.text())
            .then(body => event.reply('response-request', body))
            .catch(err => event.reply("response-request", "Error " + err))
    }else{
        fetch(arg.Url, {method: arg.Method, headers: header})
            .then(res => res.text())
            .then(body => event.reply('response-request', body))
            .catch(err => event.reply("response-request", "Error " + err))
    }

})
