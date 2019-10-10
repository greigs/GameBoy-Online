importScripts("other/zelda.js")
importScripts("other/mario.js")
importScripts("other/mobile.js")
importScripts("other/base64.js")
importScripts("other/resampler.js")
//importScripts("other/XAudioServer.js")
importScripts("other/resize.js")    
importScripts("GameBoyCore.js")
importScripts("GameBoyIO.js");
let gb
const startgb = (canvas, i,j) => {
	gb = new GameBoyIO()
	//gb.bindKeyboard();

	let settings = [						//Some settings.
		false, 								//Turn on sound.
		true,								//Boot with boot ROM first?
		false,								//Give priority to GameBoy mode
		1,									//Volume level set.
		true,								//Colorize GB mode?
		false,								//Disallow typed arrays?
		8,								    //Interval for the emulator loop.
		10,									//Audio buffer minimum span amount over x interpreter iterations.
		20,									//Audio buffer maximum span amount over x interpreter iterations.
		false,								//Override to allow for MBC1 instead of ROM only (compatibility for broken 3rd-party cartridges).
		false,								//Override MBC RAM disabling and always allow reading and writing to the banks.
		false,								//Use the GameBoy boot ROM instead of the GameBoy Color boot ROM.
		false,								//Scale the canvas in JS, or let the browser scale the canvas?
		false,								//Use image smoothing based scaling?
		[true, true, true, true]            //User controlled channel enables.
	];
	
    gb.start(canvas, base64_decode(i % 2 == 0 ? zeldaRomData : marioRomData), i * 64, j * 64, settings)
}

self.onmessage = function(e) {

    if (e.data.step){
        gb.step(e.data.produceFrame)
	}
	else if (e.data.keyDown){
		gb.keyDown(e.data.keyDown)
	} 
    else if (e.data.keyUp){
		gb.keyUp(e.data.keyUp)
	}
	else{
        startgb(new OffscreenCanvas(64,64),e.data.i,e.data.j)   
    } 
};
