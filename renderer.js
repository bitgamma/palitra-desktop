let keyboard = require('./keyboard.json');
let HID = require('node-hid');
let devices = HID.devices();
let pageLinks = document.getElementsByClassName('app__page-link');
let activePage = 0;
const reportID = 0x01;
const cmdRead = 0x00;
const cmdWrite = 0x01;
const buttonCount = 9;
const reportLength = 11;

let deviceInfo = devices.find((d) => {
  return (d.vendorId === 0x1209) && (d.productId === 0x0BAB) && (d.usagePage === 0xFF00);
});

let readPage = (pageNumber, device) => {
  for (let i = 0; i < buttonCount; i++) {
    device.write([reportID, cmdRead, pageNumber, i]);
  }
};

if (deviceInfo) {
  let device = new HID.HID(deviceInfo.path);
  device.on("data", (data) => {
    if (data[0] === reportID) {
      let shortcut = "";
      for (let i = 5; i < reportLength; i++) {
        if (data[i] === 0x00) break;
        shortcut += `${keyboard[data[i]]} \n`;
      }
      document.getElementById(`btn-${data[3]}`).innerText = shortcut;
    }
  });

  readPage(activePage, device);

  for (let i = 0; i < pageLinks.length; i++) {
    pageLinks[i].addEventListener("click", (e) => {
      document.getElementById(`page-${activePage}`).classList.remove("active-page");
      pageLinks[i].classList.add("active-page");
      activePage = Number(pageLinks[i].dataset.page);
      readPage(activePage, device);
      e.preventDefault();
    })
  }
}