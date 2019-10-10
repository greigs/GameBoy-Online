
let canvas = document.getElementById("canvas")
var ctx = canvas.getContext('2d')
const offScreen = new OffscreenCanvas(160, 144)
const offScreenCtx = offScreen.getContext("2d")
let workers = []
const columnCount = 6
const rowCount = 1
for (let i=0; i<columnCount; i++){
	for (let j=0; j<rowCount; j++){
		const worker = new Worker('js/worker.js')
		workers.push(worker)
		worker.postMessage({ i: i, j: j });
		worker.onmessage = function (e) {
			offScreenCtx.putImageData(e.data.image, 0, 0);
			ctx.drawImage(offScreen, e.data.i, e.data.j, 64, 64);
		}
	}
}

let activeIndex = 0
let active = workers[activeIndex]

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
const tickInverval = 8
const changeWorkerInterval = 5000

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
},tickInverval)


setInterval(() =>{
  if (activeIndex === columnCount - 1){
    activeIndex = 0
  }
  else{
	activeIndex++
  }
  active = workers[activeIndex]
}, changeWorkerInterval)