const remote = require('electron').remote;
let MemoryMap = require('nrf-intel-hex');
let HID = require('node-hid');
let fs = require('fs');
let cmdReset = 0x08;
let cmdErase = 0x04;
let cmdProgram = 0x05;
let cmdProgramComplete = 0x06;
let cmdSignFlash = 0x09;

let hidWrite = (bootloader, data) => {
  if(process.platform === 'win32') {
    data.unshift(0);
  }

  bootloader.write(data);
};

let updateFirmware = (bootloader) => {
  fs.readFile('./palitra.X.production.hex', 'utf8', function(err, data) {
    if (err) throw err;
    let fw = MemoryMap.fromHex(data).slice(0x1000, 0x4000).paginate(32);

    hidWrite(bootloader, [cmdErase]);

    for (let entry of fw.entries()) {
        let buf = new ArrayBuffer(64);
        let dataView = new DataView(buf);
        dataView.setUint8(0, cmdProgram);
        dataView.setUint32(1, entry[0], true);
        dataView.setUint8(5, entry[1].length);
        let cmd = new Uint8Array(buf);
        cmd.set(entry[1], 64 - entry[1].length);
        hidWrite(bootloader, Array.from(cmd));
    }

    hidWrite(bootloader, [cmdProgramComplete]);
    //TODO: verify fw
    hidWrite(bootloader, [cmdSignFlash]);
  });
};

let bootLoaderConnect = () => {
  let bootloader = new HID.HID(4617, 2988);
  let w = remote.getCurrentWindow();

  bootloader.on("error", () => {
    bootloader.close();
  });

  document.getElementById("close-upd-window").onclick = (e) => {
    e.preventDefault();
    w.close();
    hidWrite(bootloader, [cmdReset]);
  };

  document.getElementById("start-upd").onclick = (e) => {
    e.preventDefault();
    updateFirmware(bootloader);
  }
};


bootLoaderConnect();