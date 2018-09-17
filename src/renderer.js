let keyboard = require('./keyboard.json');
let js_keyboard = require('./js_keyboard.json');
let usbDetect = require('usb-detection');
let electron = require('electron');
let BrowserWindow = electron.remote.BrowserWindow;

let HID = require('node-hid');
let pageLinks = document.getElementsByClassName('app__page-link');
let buttonLinks = document.getElementsByClassName("app__keyboard-button-link");
let activePage = 0;
const reportID = 0x02;
const cmdRead = 0x00;
const cmdWrite = 0x01;
const cmdVersion = 0x03;
const cmdBoot = 0x02;
const buttonCount = 9;
const reportLength = 11;
let body = document.querySelector('body');
let shortcut;
let position;
let updateWindow;

let handleBootLoaderConnection = () => {
   updateWindow = new BrowserWindow({
     width: 450,
     height: 300,
     rame: false,
     parent: electron.remote.getCurrentWindow(),
     modal: true
  });
  updateWindow.loadFile('update.html');
};

let jumpBootLoader = (device) => {
  device.write([reportID, cmdBoot, 0xb0, 0x07]);
};

let handleConnection = () => {
  let devices = HID.devices(0x1209, 0x0BAB);
  let deviceInfo = devices.find((d) => (process.platform !== "win32" || d.usagePage === 0xFF00));
  handleLayout(deviceInfo);
  handleDevice(deviceInfo);
};

let handleLayout = (device) => {
  if(device) {
    document.getElementById("device-plugged-layout").style.display = "inherit";
    document.getElementById("device-unplugged-layout").style.display = "none";
  } else {
    document.getElementById("device-plugged-layout").style.display = "none";
    document.getElementById("device-unplugged-layout").style.display = "inherit";
  }
};

let readButton = (pageNumber, buttonNumber, device) => {
  device.write([reportID, cmdRead, pageNumber, buttonNumber]);
};

let readPage = (pageNumber, device) => {
  for (let i = 0; i < buttonCount; i++) {
    readButton(pageNumber, i, device);
  }
};

let readVersion = (device) => {
  device.write([reportID, cmdVersion]);
};

let writeButton = (pageNumber, buttonNumber, device, shortcut) => {
  let cmd = new Uint8Array(4 + shortcut.length);
  cmd[0] = reportID;
  cmd[1] = cmdWrite;
  cmd[2] = pageNumber;
  cmd[3] = buttonNumber;
  cmd.set(shortcut, 4);
  device.write(Array.from(cmd));
};

let hasKey = (shortcut, code) => {
  for (let i = 1; i < 7; i++) {
    if (shortcut[i] === code) return true;
  }

  return false;
};

let clearShortcut = () => {
  shortcut = new Uint8Array(7);
  position = 1;
  document.getElementById("popup-content").innerHTML = "";
};

let closeShortcutInput = () => {
  document.getElementById("popup").classList.remove("app__popup-overlay-targeted");
  body.onkeydown = null;
};

let handleDevice = (deviceInfo) => {
  let device = new HID.HID(deviceInfo.path);
  device.on("data", (data) => {
    if (data[0] === reportID) {
      if (data[1] === cmdVersion) {
        let version = `${data[2] + (data[3]/100)}`;
        console.log(data);
        console.log(version);
      }
      let shortcut = "";
      for (let i = 5; i < reportLength; i++) {
        if (data[i] === 0x00) break;
        shortcut += `${keyboard[data[i]]} \n`;
      }
      document.getElementById(`btn-${data[3]}`).innerText = shortcut;
    }
  });

  device.on("error", () => {
    device.close();
    handleLayout();
  });

  document.getElementById("update-link").onclick = () => {
    document.getElementById("update-message").style.display = "none";
    jumpBootLoader(device);
  };

  readVersion(device);

  readPage(activePage, device);

  for (let i = 0; i < pageLinks.length; i++) {
    pageLinks[i].addEventListener("click", (e) => {
      document.getElementById(`page-${activePage}`).classList.remove("active-page");
      pageLinks[i].classList.add("active-page");
      activePage = Number(pageLinks[i].dataset.page);
      readPage(activePage, device);
      e.preventDefault();
    })
  };

  for (let i = 0; i < buttonLinks.length; i++) {
    buttonLinks[i].addEventListener("click", (e) => {
      document.getElementById("popup").classList.add("app__popup-overlay-targeted");
      clearShortcut();

      body.onkeydown = function (e) {
        e.preventDefault();
        let code = js_keyboard[e.code];

        if (position < 7 && !hasKey(shortcut, code)) {
          document.getElementById("popup-content").innerHTML += `<span class="shortcut-cmd">${keyboard[code]}</span>`;
          shortcut[position++] = code;
          switch (code) {
            case 0xe0:
              shortcut[0] |= 0x01;
              break;
            case 0xe1:
              shortcut[0] |= 0x02;
              break;
            case 0xe2:
              shortcut[0] |= 0x04;
              break;
            case 0xe3:
              shortcut[0] |= 0x08;
              break;
            case 0xe4:
              shortcut[0] |= 0x10;
              break;
            case 0xe5:
              shortcut[0] |= 0x20;
              break;
            case 0xe6:
              shortcut[0] |= 0x40;
              break;
            case 0xe7:
              shortcut[0] |= 0x80;
              break;
          }
        }
      };

      document.getElementById("button-ok").onclick = () => {
        let buttonNumber = Number(buttonLinks[i].dataset.button);
        writeButton(activePage, buttonNumber, device, shortcut);
        readButton(activePage, buttonNumber, device);
        closeShortcutInput();
      };
    })
  }

  document.getElementById("button-cancel").addEventListener("click", closeShortcutInput);
  document.getElementById("button-clear").addEventListener("click", clearShortcut);
};

handleLayout();
usbDetect.startMonitoring();
usbDetect.on("add:4617:2987", handleConnection);
usbDetect.on("add:1240:60", handleBootLoaderConnection);
usbDetect.find(0x1209, 0x0BAB, (err, devices) => {
  if (devices.length > 0) {
    handleConnection();
  }
});
