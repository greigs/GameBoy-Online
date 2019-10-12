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
const startgb = (canvas, rom, i,j, offsetDistanceX, offsetDistanceY) => {
	gb = new GameBoyIO()

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
	
    gb.start(canvas, rom, i * offsetDistanceX, j * offsetDistanceY, settings)
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
	else if (e.data.init){
		const loadingCanv = new OffscreenCanvas(e.data.offsetDistanceX,e.data.offsetDistanceY)	
		const loadingCtx = loadingCanv.getContext("2d");
		loadingCtx.fillStyle = 'white';
		loadingCtx.fillRect(0,0,e.data.offsetDistanceX, e.data.offsetDistanceY)
		loadingCtx.font = '20px sans-serif';
		loadingCtx.fillStyle = 'black';
		loadingCtx.fillText('Loading...', 30, 60)
		const buff = loadingCtx.getImageData(0,0,e.data.offsetDistanceX,e.data.offsetDistanceY);
		postMessage({ image: buff,i: e.data.i, j:e.data.j })
	} 
	else{	
        startgb(new OffscreenCanvas(e.data.offsetDistanceX,e.data.offsetDistanceY),e.data.rom, e.data.i,e.data.j, e.data.offsetDistanceX, e.data.offsetDistanceY)   
    } 
};
