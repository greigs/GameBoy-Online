
const columnCount = 5
const rowCount = 3
const canvasHeightIndividualGame = 144 * 2
const canvasWidthIndividualGame = 160 * 2
const borderSize = 2
const canvasHeightTotal = (canvasHeightIndividualGame * rowCount) + (rowCount * borderSize) + borderSize
const canvasWidthTotal = (canvasWidthIndividualGame * columnCount) + (columnCount * borderSize) + borderSize
let canvas = document.getElementById("canvas")
canvas.style.width = '100%'
canvas.style.maxWidth = 'fit-content'
canvas.width = "" + canvasWidthTotal
canvas.height = "" + canvasHeightTotal
var ctx = canvas.getContext('2d')
ctx.imageSmoothingEnabled = false;
const offScreen = new OffscreenCanvas(160, 144)
const offScreenCtx = offScreen.getContext("2d")

let workers = []

for (let i=0; i<columnCount; i++){
	for (let j=0; j<rowCount; j++){
		const worker = new Worker('js/worker.js')
		workers[(columnCount * j) + i] = worker
		worker.postMessage({ i: i, j: j, offsetDistanceX : canvasWidthIndividualGame, offsetDistanceY : canvasHeightIndividualGame});
		worker.onmessage = function (e) {
			offScreenCtx.putImageData(e.data.image, 0, 0);
			let ia =  (e.data.i / canvasWidthIndividualGame)
			let x = (ia * canvasWidthIndividualGame) + (ia * borderSize) + borderSize
			let ja =  (e.data.j / canvasHeightIndividualGame)
			let y = (ja * canvasHeightIndividualGame) + (ja * borderSize) + borderSize
			let arrayPos = (ja * columnCount) + ia
			
			// if (arrayPos === activeIndex - 1 && activeFrame === (activeIndex - 1)){
			// 	ctx.lineWidth = borderSize * 2
			// 	ctx.strokeStyle = 'black';
			// 	ctx.beginPath();
			// 	ctx.rect(x, y, canvasWidthIndividualGame, canvasHeightIndividualGame);
			// 	ctx.stroke();
			// }				

			if (arrayPos === activeIndex && activeFrame !== activeIndex){				
				ctx.lineWidth = borderSize * 2
				ctx.strokeStyle = 'lime';
				ctx.beginPath();
				ctx.rect(x, y, canvasWidthIndividualGame, canvasHeightIndividualGame);
				ctx.stroke();
				activeFrame = activeIndex
			}	
			
			ctx.drawImage(offScreen, x, y, canvasWidthIndividualGame, canvasHeightIndividualGame);
		}
	}
}

let activeIndex = 0
let activeFrame = activeIndex
let active = workers[activeIndex]

let globalFrameCount = 0
window.onkeydown = (e) =>{
	active.postMessage({keyDown: {keyCode: e.keyCode}})
}

window.onkeyup = (e) =>{
	active.postMessage({keyUp: {keyCode: e.keyCode}})
}

const runAll = true
const runAllAsBackground = false
const frameDivisionAll = 5
const frameDivisionSingle = 1
const frameDivisionBackground = 10
const tickInverval = 8
const changeWorkerInterval = 3000

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
  activeIndex++
  if (activeIndex === (columnCount * rowCount) - 1){
    activeIndex = 0
  }
  
  active = workers[activeIndex]
}, changeWorkerInterval)