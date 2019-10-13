const columnCount = 3
const rowCount = 2
const canvasHeightIndividualGame = 144 * 2
const canvasWidthIndividualGame = 160 * 2
const borderSize = 4
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
let allLoaded = false
let gbReadyCount = 0
const getRomData2 = async () => {
	let myModule = await import('./other/mario.js')
	return myModule.default.getMarioRomData()
}
const launcher = async () => {
	let workers = []
	for (let i = 0; i < columnCount; i++) {
		for (let j = 0; j < rowCount; j++) {
			const worker = new Worker('js/worker.js')
			workers[(columnCount * j) + i] = worker

			worker.onmessage = function (e) {
				if (e.data.gbReady){
					gbReadyCount++
					if (gbReadyCount >= (rowCount * columnCount)){
						allLoaded = true
					}
				}
				else{
					offScreenCtx.putImageData(e.data.image, 0, 0);
					let ia = (e.data.i / canvasWidthIndividualGame)
					let x = (ia * canvasWidthIndividualGame) + (ia * borderSize) + borderSize
					let ja = (e.data.j / canvasHeightIndividualGame)
					let y = (ja * canvasHeightIndividualGame) + (ja * borderSize) + borderSize
					ctx.drawImage(offScreen, x, y, canvasWidthIndividualGame, canvasHeightIndividualGame);
				}
			}

		}
	}

	let activeIndex = 0
	let activeFrame = -1
	let active = workers[activeIndex]
	let romLoaded = false
	let globalFrameCount = 0
	window.onkeydown = (e) => {
		if (allLoaded){
			active.postMessage({ keyDown: { keyCode: e.keyCode } })
		}
	}

	window.onkeyup = (e) => {
		if (allLoaded){
			active.postMessage({ keyUp: { keyCode: e.keyCode } })
		}
	}

	const runAll = true
	const runAllAsBackground = false
	const frameDivisionAll = 5
	const frameDivisionSingle = 1
	const frameDivisionBackground = 10
	const tickInverval = 8
	const changeWorkerInterval = 3000
	workers.forEach(async function (worker, index) {
		let j = (Math.floor(index / columnCount))
		let i = (index % columnCount)
		worker.postMessage({
			init: true,
			i: i * canvasWidthIndividualGame,
			j: j * canvasHeightIndividualGame,
			offsetDistanceX: canvasWidthIndividualGame,
			offsetDistanceY: canvasHeightIndividualGame
		});
	})

	const updateActiveGame = (newIndex) => {
        
		activeIndex = newIndex
		active = workers[newIndex]
		let ja = (Math.floor(activeIndex / columnCount))
		let ia = (activeIndex % columnCount)
		let x = (ia * canvasWidthIndividualGame) + (ia * borderSize) + borderSize
		let y = (ja * canvasHeightIndividualGame) + (ja * borderSize) + borderSize

		ctx.lineWidth = borderSize * 2
		// disable previous active frame first
		if (activeFrame > -1) {

			let pj = Math.floor(activeFrame / columnCount)
			let pi = activeFrame % columnCount
			let px = (pi * canvasWidthIndividualGame) + (pi * borderSize) + borderSize
			let py = (pj * canvasHeightIndividualGame) + (pj * borderSize) + borderSize 
			ctx.strokeStyle = 'black';
			ctx.beginPath();
			ctx.rect(px, py, canvasWidthIndividualGame, canvasHeightIndividualGame);
			ctx.stroke();
		}

		ctx.strokeStyle = 'lime';
		ctx.beginPath();
		ctx.rect(x, y, canvasWidthIndividualGame, canvasHeightIndividualGame);
		ctx.stroke();

		activeFrame = activeIndex


	}
    const saveSnapshot = () =>{
		workers[0].postMessage({saveState: true})
	}
	setInterval(() => {
		if (allLoaded){
			const oldIndex = activeIndex
			let newIndex = oldIndex + 1
			if (newIndex === (columnCount * rowCount)) {
				newIndex = 0
			}
			console.log(newIndex)
			updateActiveGame(newIndex)
			saveSnapshot()
		}
	}, changeWorkerInterval)

	const rom = await getRomData2()
	const romValid = true
	if (romValid) {
		for (let i = 0; i < columnCount; i++) {
			for (let j = 0; j < rowCount; j++) {
				worker = workers[(columnCount * j) + i]
				worker.postMessage({ rom: rom, i: i, j: j, offsetDistanceX: canvasWidthIndividualGame, offsetDistanceY: canvasHeightIndividualGame });
			}
		}
		romLoaded = true


		setInterval(async () => {
			globalFrameCount++;
			if (runAll) {
				workers.forEach(async function (worker) {
					worker.postMessage({ step: true, produceFrame: globalFrameCount % frameDivisionAll === 0 })
				});
			} else if (runAllAsBackground) {
				workers.forEach(async function (worker) {
					worker.postMessage({ step: true, produceFrame: globalFrameCount % (active === worker ? frameDivisionSingle : frameDivisionBackground) === 0 })
				})
			} else {
				active.postMessage({ step: true, produceFrame: globalFrameCount % frameDivisionSingle === 0 })
			}
		}, tickInverval)
	}

	updateActiveGame(0)
}

launcher()