let HID = require('node-hid');
let devices = HID.devices();
console.log(devices);

let deviceInfo = devices.find( function(d) {
  return (d.vendorId === 0x1209) && (d.productId === 0x0BAB) && (d.usagePage === 0xFF00);
});

if(deviceInfo) {
  console.log(deviceInfo);
  let device = new HID.HID(deviceInfo.path);
  console.log(device);
}