import { app, BrowserWindow, Tray, Menu, nativeImage } from "electron";
import path from "path";
import { initDatabase } from "./db";
import { registerIpcHandlers } from "./ipc/handlers";

let mainWin: BrowserWindow | null = null;
let splashWin: BrowserWindow | null = null;
let tray: Tray | null = null;

const isDev = process.env.NODE_ENV === "development";

function createSplash() {
  splashWin = new BrowserWindow({
    width: 420,
    height: 420,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    icon: path.join(__dirname, "../build/icon.png"),
  });
  const logoPath = isDev
    ? path.join(__dirname, "../src/assets/logo-dark.png")
    : path.join(__dirname, "../dist/assets/logo-dark.png");
  // file:// URLs require forward slashes even on Windows.
  const logoUrl = "file:///" + logoPath.replace(/\\/g, "/");
  splashWin.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
      <html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;height:100vh;">
        <img src="${logoUrl}" style="width:140px;height:140px;animation:pulse 1.4s ease-in-out infinite" />
        <style>@keyframes pulse{0%,100%{opacity:.5;transform:scale(.96)}50%{opacity:1;transform:scale(1)}}</style>
      </body></html>
    `)}`
  );
}

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: "#000000",
    icon: path.join(__dirname, "../build/icon.png"),
    title: "Yaraav To Do",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWin.loadURL("http://localhost:5173");
  } else {
    mainWin.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWin.once("ready-to-show", () => {
    setTimeout(() => {
      splashWin?.close();
      splashWin = null;
      mainWin?.show();
    }, 1200);
  });

  mainWin.on("closed", () => {
    mainWin = null;
  });
}

function createTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, "../build/icon.png"));
  tray = new Tray(icon.resize({ width: 16, height: 16 }));
  tray.setToolTip("Yaraav To Do");
  const menu = Menu.buildFromTemplate([
    { label: "باز کردن Yaraav To Do", click: () => mainWin?.show() },
    { type: "separator" },
    { label: "خروج", click: () => app.quit() },
  ]);
  tray.setContextMenu(menu);
  tray.on("click", () => mainWin?.show());
}

app.whenReady().then(() => {
  initDatabase();
  createSplash();
  createMainWindow();
  createTray();
  registerIpcHandlers(() => mainWin);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
