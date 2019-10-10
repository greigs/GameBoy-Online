
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
let globalFrameCount = 0
window.onkeydown = (e) =>{
	workers.forEach(async function(worker){
		worker.postMessage({keyDown: {keyCode: e.keyCode}})
	})
}

window.onkeyup = (e) =>{
	workers.forEach(async function(worker){
		worker.postMessage({keyUp: {keyCode: e.keyCode}})
	})
}


setInterval(async () => 
{
	  globalFrameCount++;
	  var i = 0;
      workers.forEach(async function(worker){
		  i++;
		  worker.postMessage({step: true, produceFrame: globalFrameCount % 5 === 0})
		//  i+= 20
    	//setTimeout(() => worker.postMessage({step: true, produceFrame: false}), i)
		
	  });
},8)


