
// const startgb = (canvas, i,j) => {
// 	const gb = new GameBoyIO()
// 	gb.bindKeyboard();

// 	let settings = [						//Some settings.
// 		false, 								//Turn on sound.
// 		true,								//Boot with boot ROM first?
// 		false,								//Give priority to GameBoy mode
// 		1,									//Volume level set.
// 		true,								//Colorize GB mode?
// 		false,								//Disallow typed arrays?
// 		8,									//Interval for the emulator loop.
// 		10,									//Audio buffer minimum span amount over x interpreter iterations.
// 		20,									//Audio buffer maximum span amount over x interpreter iterations.
// 		false,								//Override to allow for MBC1 instead of ROM only (compatibility for broken 3rd-party cartridges).
// 		false,								//Override MBC RAM disabling and always allow reading and writing to the banks.
// 		false,								//Use the GameBoy boot ROM instead of the GameBoy Color boot ROM.
// 		false,								//Scale the canvas in JS, or let the browser scale the canvas?
// 		false,								//Use image smoothing based scaling?
// 		[true, true, true, true]            //User controlled channel enables.
// 	];
	
// 	gbs.push(gb)
// 	gb.start(canvas, base64_decode(i % 2 == 0 ? zeldaRomData : marioRomData), i * 64, j * 64, settings)
// }
const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}



let canvas = document.getElementById("canvas")
var ctx = canvas.getContext('2d')
let gbs = []
const offScreen = new OffscreenCanvas(160, 144)
const offScreenCtx = offScreen.getContext("2d")
let workers = []
for (let i=0; i<6; i++){
	for (let j=0; j<1; j++){
	    
		const worker = new Worker('js/worker.js')
		workers.push(worker)
		worker.postMessage({ i: i, j: j });
		worker.onmessage = function (e) {
			offScreenCtx.putImageData(e.data.image, 0, 0);
			ctx.drawImage(offScreen, e.data.i, e.data.j, 64, 64);
		}
	}
}

setInterval(async () => 
{
	  var i = 0;
      workers.forEach(async function(worker){
		  i+= 20
    	setTimeout(() => worker.postMessage({step: true}), i)
		
	  });
},8)


