# Palitra

Tool to configure the [Palitra](https://github.com/bitgamma/palitra) device

## Compilation

The application is Electron-based. To compile it you need Node and npm installed. Once you download the repository you need to run 

```npm install```

To start it you need to run

```npm start```

Note that the app is very much work in progress - it does its job but the interface is not finished yet. In particular the bootloader functionality is not finished.

## Known issues

1. The application always says that there is an update of the device firmware available
2. The firmware is loaded from a fixed location
3. The progress bar is not yet implemented.
4. The profile is not backed up on upgrade, meaning that an upgrade will delete all existing shortcuts

## Loading a new firmware image

1. Copy your firmware the project's root directory. The file must be called palitra.X.production.hex
2. Run npm start
3. Click on the "click here" link at the bottom of the screen
4. Click the start update button
5. Wait about 10 seconds before clicking Close update window button
