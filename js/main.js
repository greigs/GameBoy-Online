
let canvas = document.getElementById("canvas")
var ctx = canvas.getContext('2d')
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

let active = workers[1]

let globalFrameCount = 0
window.onkeydown = (e) =>{
	active.postMessage({keyDown: {keyCode: e.keyCode}})
}

window.onkeyup = (e) =>{
	active.postMessage({keyUp: {keyCode: e.keyCode}})
}

const runAll = false
const runAllAsBackground = false
const frameDivisionAll = 5
const frameDivisionSingle = 1
const frameDivisionBackground = 10

setInterval(async () => 
{
	  globalFrameCount++;
	  if (runAll){
		workers.forEach(async function(worker){
			worker.postMessage({step: true, produceFrame: globalFrameCount % frameDivisionAll === 0})		
		});
	  } else if (runAllAsBackground){
		workers.forEach(async function(worker){			
			worker.postMessage({step: true, produceFrame: globalFrameCount % (active === worker ? frameDivisionSingle : frameDivisionBackground) === 0})		
		})
	  } else{
		active.postMessage({step: true, produceFrame: globalFrameCount % frameDivisionSingle === 0})
	  }
},8)


