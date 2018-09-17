const remote = require('electron').remote;
let HID = require('node-hid');
let cmdReset = 0x08;

let hidWrite = (bootloader, data) => {
  if(process.platform === 'win32') {
    data.unshift(0);
  }

  bootloader.write(data);
};

let bootLoaderConnect = () => {
  let bootloader = new HID.HID(1240, 60);
  let w = remote.getCurrentWindow();

  bootloader.on("error", () => {
    bootloader.close();
  });

  document.getElementById("close-upd-window").onclick = (e) => {
    e.preventDefault();
    w.close();
    hidWrite(bootloader, [cmdReset]);
  };
};

bootLoaderConnect();