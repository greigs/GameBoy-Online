"use strict";
class GameBoyIO {
	gameboy = null;						//GameBoyCore object.
	gbRunInterval = null;				//GameBoyCore Timer
	
	
	start(canvas, ROM, xoffset, yoffset) {
		this.clearLastEmulation();
		this.autoSave();	//If we are about to load a new game, then save the last one...
		this.gameboy = new GameBoyCoreClass().GameBoyCore(canvas, ROM, this, xoffset, yoffset);
		this.gameboy.openMBC = this.openSRAM;
		this.gameboy.openRTC = this.openRTC;
		this.gameboy.start();
		this.run();
	}
	run() {
		if (this.GameBoyEmulatorInitialized()) {
			if (!this.GameBoyEmulatorPlaying()) {
				this.gameboy.stopEmulator &= 1;
				cout("Starting the iterator.", 0);
				var dateObj = new Date();
				this.gameboy.firstIteration = dateObj.getTime();
				this.gameboy.iterations = 0;
				this.gbRunInterval = setInterval(() => {
					if (!document.hidden && !document.msHidden && !document.mozHidden && !document.webkitHidden) {
						this.gameboy.run();
					}
				}, settings[6]);
			}
			else {
				cout("The GameBoy core is already running.", 1);
			}
		}
		else {
			cout("GameBoy core cannot run while it has not been initialized.", 1);
		}
	}
	pause() {
		if (this.GameBoyEmulatorInitialized()) {
			if (this.GameBoyEmulatorPlaying()) {
				this.autoSave();
				this.clearLastEmulation();
			}
			else {
				cout("GameBoy core has already been paused.", 1);
			}
		}
		else {
			cout("GameBoy core cannot be paused while it has not been initialized.", 1);
		}
	}
	clearLastEmulation() {
		if (this.GameBoyEmulatorInitialized() && this.GameBoyEmulatorPlaying()) {
			clearInterval(this.gbRunInterval);
			this.gameboy.stopEmulator |= 2;
			cout("The previous emulation has been cleared.", 0);
		}
		else {
			cout("No previous emulation was found to be cleared.", 0);
		}
	}
	save() {
		if (this.GameBoyEmulatorInitialized()) {
			var state_suffix = 0;
			while (findValue("FREEZE_" + gameboy.name + "_" + state_suffix) != null) {
				state_suffix++;
			}
			this.saveState("FREEZE_" + gameboy.name + "_" + state_suffix);
		}
		else {
			cout("GameBoy core cannot be saved while it has not been initialized.", 1);
		}
	}
	saveSRAM() {
		if (this.GameBoyEmulatorInitialized()) {
			if (this.gameboy.cBATT) {
				try {
					var sram = this.gameboy.saveSRAMState();
					if (sram.length > 0) {
						cout("Saving the SRAM...", 0);
						if (findValue("SRAM_" + this.gameboy.name) != null) {
							//Remove the outdated storage format save:
							cout("Deleting the old SRAM save due to outdated format.", 0);
							deleteValue("SRAM_" + this.gameboy.name);
						}
						setValue("B64_SRAM_" + this.gameboy.name, arrayToBase64(sram));
					}
					else {
						cout("SRAM could not be saved because it was empty.", 1);
					}
				}
				catch (error) {
					cout("Could not save the current emulation state(\"" + error.message + "\").", 2);
				}
			}
			else {
				cout("Cannot save a game that does not have battery backed SRAM specified.", 1);
			}
			this.saveRTC();
		}
		else {
			cout("GameBoy core cannot be saved while it has not been initialized.", 1);
		}
	}
	saveRTC() {	//Execute this when SRAM is being saved as well.
		if (this.GameBoyEmulatorInitialized()) {
			if (this.gameboy.cTIMER) {
				try {
					cout("Saving the RTC...", 0);
					setValue("RTC_" + this.gameboy.name, this.gameboy.saveRTCState());
				}
				catch (error) {
					cout("Could not save the RTC of the current emulation state(\"" + error.message + "\").", 2);
				}
			}
		}
		else {
			cout("GameBoy core cannot be saved while it has not been initialized.", 1);
		}
	}
	autoSave() {
		if (this.GameBoyEmulatorInitialized()) {
			cout("Automatically saving the SRAM.", 0);
			this.saveSRAM();
			this.saveRTC();
		}
	}
	openSRAM(filename) {
		try {
			if (findValue("B64_SRAM_" + filename) != null) {
				cout("Found a previous SRAM state (Will attempt to load).", 0);
				return base64ToArray(findValue("B64_SRAM_" + filename));
			}
			else if (findValue("SRAM_" + filename) != null) {
				cout("Found a previous SRAM state (Will attempt to load).", 0);
				return findValue("SRAM_" + filename);
			}
			else {
				cout("Could not find any previous SRAM copy for the current ROM.", 0);
			}
		}
		catch (error) {
			cout("Could not open the  SRAM of the saved emulation state.", 2);
		}
		return [];
	}
	openRTC(filename) {
		try {
			if (findValue("RTC_" + filename) != null) {
				cout("Found a previous RTC state (Will attempt to load).", 0);
				return findValue("RTC_" + filename);
			}
			else {
				cout("Could not find any previous RTC copy for the current ROM.", 0);
			}
		}
		catch (error) {
			cout("Could not open the RTC data of the saved emulation state.", 2);
		}
		return [];
	}
	saveState(filename) {
		if (this.GameBoyEmulatorInitialized()) {
			try {
				setValue(filename, gameboy.saveState());
				cout("Saved the current state as: " + filename, 0);
			}
			catch (error) {
				cout("Could not save the current emulation state(\"" + error.message + "\").", 2);
			}
		}
		else {
			cout("GameBoy core cannot be saved while it has not been initialized.", 1);
		}
	}
	openState(filename, canvas) {
		try {
			if (findValue(filename) != null) {
				try {
					clearLastEmulation();
					cout("Attempting to run a saved emulation state.", 0);
					gameboy = new GameBoyCore(canvas, "");
					gameboy.savedStateFileName = filename;
					gameboy.returnFromState(findValue(filename));
					run();
				}
				catch (error) {
					alert(error.message + " file: " + error.fileName + " line: " + error.lineNumber);
				}
			}
			else {
				cout("Could not find the save state " + filename + "\".", 2);
			}
		}
		catch (error) {
			cout("Could not open the saved emulation state.", 2);
		}
	}
	import_save(blobData) {
		blobData = decodeBlob(blobData);
		if (blobData && blobData.blobs) {
			if (blobData.blobs.length > 0) {
				for (var index = 0; index < blobData.blobs.length; ++index) {
					cout("Importing blob \"" + blobData.blobs[index].blobID + "\"", 0);
					if (blobData.blobs[index].blobContent) {
						if (blobData.blobs[index].blobID.substring(0, 5) == "SRAM_") {
							setValue("B64_" + blobData.blobs[index].blobID, base64(blobData.blobs[index].blobContent));
						}
						else {
							setValue(blobData.blobs[index].blobID, JSON.parse(blobData.blobs[index].blobContent));
						}
					}
					else if (blobData.blobs[index].blobID) {
						cout("Save file imported had blob \"" + blobData.blobs[index].blobID + "\" with no blob data interpretable.", 2);
					}
					else {
						cout("Blob chunk information missing completely.", 2);
					}
				}
			}
			else {
				cout("Could not decode the imported file.", 2);
			}
		}
		else {
			cout("Could not decode the imported file.", 2);
		}
	}
	generateBlob(keyName, encodedData) {
		//Append the file format prefix:
		var saveString = "EMULATOR_DATA";
		var consoleID = "GameBoy";
		//Figure out the length:
		var totalLength = (saveString.length + 4 + (1 + consoleID.length)) + ((1 + keyName.length) + (4 + encodedData.length));
		//Append the total length in bytes:
		saveString += to_little_endian_dword(totalLength);
		//Append the console ID text's length:
		saveString += to_byte(consoleID.length);
		//Append the console ID text:
		saveString += consoleID;
		//Append the blob ID:
		saveString += to_byte(keyName.length);
		saveString += keyName;
		//Now append the save data:
		saveString += to_little_endian_dword(encodedData.length);
		saveString += encodedData;
		return saveString;
	}
	generateMultiBlob(blobPairs) {
		var consoleID = "GameBoy";
		//Figure out the initial length:
		var totalLength = 13 + 4 + 1 + consoleID.length;
		//Append the console ID text's length:
		var saveString = to_byte(consoleID.length);
		//Append the console ID text:
		saveString += consoleID;
		var keyName = "";
		var encodedData = "";
		//Now append all the blobs:
		for (var index = 0; index < blobPairs.length; ++index) {
			keyName = blobPairs[index][0];
			encodedData = blobPairs[index][1];
			//Append the blob ID:
			saveString += to_byte(keyName.length);
			saveString += keyName;
			//Now append the save data:
			saveString += to_little_endian_dword(encodedData.length);
			saveString += encodedData;
			//Update the total length:
			totalLength += 1 + keyName.length + 4 + encodedData.length;
		}
		//Now add the prefix:
		saveString = "EMULATOR_DATA" + to_little_endian_dword(totalLength) + saveString;
		return saveString;
	}
	decodeBlob(blobData) {
		/*Format is as follows:
			- 13 byte string "EMULATOR_DATA"
			- 4 byte total size (including these 4 bytes).
			- 1 byte Console type ID length
			- Console type ID text of 8 bit size
			blobs {
				- 1 byte blob ID length
				- blob ID text (Used to say what the data is (SRAM/freeze state/etc...))
				- 4 byte blob length
				- blob length of 32 bit size
			}
		*/
		var length = blobData.length;
		var blobProperties = {};
		blobProperties.consoleID = null;
		var blobsCount = -1;
		blobProperties.blobs = [];
		if (length > 17) {
			if (blobData.substring(0, 13) == "EMULATOR_DATA") {
				var length = Math.min(((blobData.charCodeAt(16) & 0xFF) << 24) | ((blobData.charCodeAt(15) & 0xFF) << 16) | ((blobData.charCodeAt(14) & 0xFF) << 8) | (blobData.charCodeAt(13) & 0xFF), length);
				var consoleIDLength = blobData.charCodeAt(17) & 0xFF;
				if (length > 17 + consoleIDLength) {
					blobProperties.consoleID = blobData.substring(18, 18 + consoleIDLength);
					var blobIDLength = 0;
					var blobLength = 0;
					for (var index = 18 + consoleIDLength; index < length;) {
						blobIDLength = blobData.charCodeAt(index++) & 0xFF;
						if (index + blobIDLength < length) {
							blobProperties.blobs[++blobsCount] = {};
							blobProperties.blobs[blobsCount].blobID = blobData.substring(index, index + blobIDLength);
							index += blobIDLength;
							if (index + 4 < length) {
								blobLength = ((blobData.charCodeAt(index + 3) & 0xFF) << 24) | ((blobData.charCodeAt(index + 2) & 0xFF) << 16) | ((blobData.charCodeAt(index + 1) & 0xFF) << 8) | (blobData.charCodeAt(index) & 0xFF);
								index += 4;
								if (index + blobLength <= length) {
									blobProperties.blobs[blobsCount].blobContent =  blobData.substring(index, index + blobLength);
									index += blobLength;
								}
								else {
									cout("Blob length check failed, blob determined to be incomplete.", 2);
									break;
								}
							}
							else {
								cout("Blob was incomplete, bailing out.", 2);
								break;
							}
						}
						else {
							cout("Blob was incomplete, bailing out.", 2);
							break;
						}
					}
				}
			}
		}
		return blobProperties;
	}
	matchKey(key) {	//Maps a keyboard key to a gameboy key.
		//Order: Right, Left, Up, Down, A, B, Select, Start
		var keymap = ["right", "left", "up", "down", "a", "b", "select", "start"];	//Keyboard button map.
		for (var index = 0; index < keymap.length; index++) {
			if (keymap[index] == key) {
				return index;
			}
		}
		return -1;
	}
	GameBoyEmulatorInitialized() {
		return (typeof this.gameboy == "object" && this.gameboy != null);
	}
	GameBoyEmulatorPlaying() {
		return ((this.gameboy.stopEmulator & 2) == 0);
	}
	GameBoyKeyDown(key) {
		if (this.GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
			GameBoyJoyPadEvent(matchKey(key), true);
		}
	}
	GameBoyJoyPadEvent(keycode, down) {
		if (this.GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
			if (keycode >= 0 && keycode < 8) {
				gameboy.JoyPadEvent(keycode, down);
			}
		}
	}
	GameBoyKeyUp(key) {
		if (this.GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
			GameBoyJoyPadEvent(matchKey(key), false);
		}
	}
	GameBoyGyroSignalHandler(e) {
		if (this.GameBoyEmulatorInitialized() && GameBoyEmulatorPlaying()) {
			if (e.gamma || e.beta) {
				gameboy.GyroEvent(e.gamma * Math.PI / 180, e.beta * Math.PI / 180);
			}
			else {
				gameboy.GyroEvent(e.x, e.y);
			}
			try {
				e.preventDefault();
			}
			catch (error) { }
		}
	}
	//The emulator will call this to sort out the canvas properties for (re)initialization.
	initNewCanvas() {
		if (this.GameBoyEmulatorInitialized()) {
			this.gameboy.canvas.width = this.gameboy.canvas.clientWidth;	
			this.gameboy.canvas.height = this.gameboy.canvas.clientHeight;
		}
	}
	//Call this when resizing the canvas:
	initNewCanvasSize() {
		if (this.GameBoyEmulatorInitialized()) {
			if (!settings[12]) {
				if (gameboy.onscreenWidth != 160 || gameboy.onscreenHeight != 144) {
					gameboy.initLCD();
				}
			}
			else {
				if (gameboy.onscreenWidth != gameboy.canvas.clientWidth || gameboy.onscreenHeight != gameboy.canvas.clientHeight) {
					gameboy.initLCD();
				}
			}
		}
	}

}