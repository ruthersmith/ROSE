const config = {};
window.onload = function () {
	const controlButton = document.getElementById('control-button');
	const fpsDecreaseButton = document.getElementById('fps-decrease-button');
	const fpsIncreaseButton = document.getElementById('fps-increase-button');
	config.loadingTotal = 14;
	config.loadingCompleted = 0;
	config.trackImages = loadImages(['res/bg/bg_1.png', 'res/bg/bg_2.png', 'res/bg/bg_3.png']);
	config.carImages = loadImages(['res/cars/car1.png', 'res/cars/car2.png', 'res/cars/car3.png', 'res/cars/car4.png']);
	config.obstacleImages = {
		'barrier': loadImage('res/obstacles/barrier.png'),
		'bike': loadImage('res/obstacles/bike.png'),
		'crack': loadImage('res/obstacles/crack.png'),
		'penguin': loadImage('res/obstacles/penguin.png'),
		'trash': loadImage('res/obstacles/trash.png'),
		'water': loadImage('res/obstacles/water.png')
	};
	config.finishLineImage = loadImage('res/end/final_flag.png');
	loadingTimer = setTimeout(function () {
		if (config.loadingTotal !== config.loadingCompleted) {
			return;
		}
		clearTimeout(loadingTimer);
		const websocket = new WebSocket('ws://' + window.location.hostname + ':8880/ws');
		document.getElementById('loading').remove();
		websocket.onopen = function () {
			console.log ('websocket connected!');
		};
		websocket.onmessage = handleWebSocketMessageEvent;
	}, 300);
	controlButton.onclick = handleControlButtonClickEvent;
	fpsDecreaseButton.onclick = handleFpsDecreaseClickEvent;
	fpsIncreaseButton.onclick = handleFpsIncreaseClickEvent;
}
function loadImage(src) {
	const img = new Image();
	img.onload = function () {
		config.loadingCompleted++;
	}
	img.src = src;
	return img;
}
function loadImages(sources) {
	const images = [];
	for (source of sources) {
		images.push(loadImage(source));
	}
	return images;
}
function post(url, data = '', callback = function () {}) {
	const xhr = new XMLHttpRequest();
	xhr.open('POST', url);
	xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
	xhr.onload = callback;
	xhr.send(encodeURI(data));
}
function setMessage(newMessage) {
	const messageBox = document.getElementById('message');
	messageBox.innerText = newMessage;
	if (newMessage.length === 0) {
		messageBox.setAttribute('style', 'display:none');
	} else {
		messageBox.removeAttribute('style');
	}
}
function getGameContext() {
	return document.getElementById('game').getContext('2d');
}
function handleControlButtonClickEvent() {
	const button = this;
	post('admin', 'running=' + (getStarted() ? '0' : '1'));
}
function handleFpsDecreaseClickEvent() {
	if (getFpsDisplay() == 1) {
		return;
	}
	post('admin', 'rate=' + (getFpsDisplay() - 1));
}
function handleFpsIncreaseClickEvent() {
	post('admin', 'rate=' + (getFpsDisplay() + 1));
}
function getFpsDisplay() {
	return config.payload.rate;
}
function getTimeLeft() {
	return config.payload.timeleft;
}
function getStarted() {
	return config.payload.started;
}
function updateFpsDisplay(fps) {
	document.getElementById('numerical-fps').innerText = fps;
}
function updateTimeleftDisplay(timeleft) {
	document.getElementById('time-left').innerText = timeleft;
}
function updateStartedDisplay(started) {
	document.getElementById('control-button').innerText = started ? 'Stop' : 'Start';
}
function updatePlayerDisplay(players) {
	const playerListBody = document.getElementById('player-list-body');
	playerListBody.innerHTML = '';
	if (players.length === 0) {
		setMessage('No players connected.');
		return;
	}
	for (const player of players) {
		const row = document.createElement('tr');
		const name = document.createElement('th');
		const score = document.createElement('td');
		name.setAttribute('scope', 'row');
		name.innerText = player.name;
		score.innerText = player.score;
		row.appendChild(name);
		row.appendChild(score);
		playerListBody.appendChild(row);
	}
	setMessage('');
}
function updateTrack() {
	if (!getStarted()) {
		return;
	}
	config.trackImages.unshift(config.trackImages.pop());
}
function drawTrack() {
	const images = config.trackImages;
	for (let i = 0; i < 9; i++) { //Config.track_length
		const img = images[i % images.length];
		getGameContext().drawImage(img, 0, i * img.height);
	}
}
function drawCar() {
	const context = getGameContext();
	context.fillStyle = "rgb(0, 0, 0)";
	context.textBaseline = "top";
	context.font = "bold 15px sans-serif";
	context.textAlign = "center";
	for (const player of config.payload.players) {
		const img = config.carImages[player['car']];
		const x = 95 + player['x'] * 130;
		const y = player['y'] * 65;
		context.drawImage(img, x, y);
		var car_center = x + (img.width / 2);
		var car_bottom = y + img.height;
		context.fillText(player.name, car_center, car_bottom + 5);
	}
}
function drawObstacle() {
	const context = getGameContext();
	for (const obstacle of config.payload.track) {
		const img = config.obstacleImages[obstacle['name']];
		const x = 95 + obstacle['x'] * 130;
		const y = 10 + obstacle['y'] * 65;
		context.drawImage(img, x, y);
	}
}
function drawFinishLine() {
	const timeLeft = Math.max(getTimeLeft(), 0);
	if (timeLeft > 5) {
		return;
	}
	const y = 65 * (5 - timeLeft);
	getGameContext().drawImage(config.finishLineImage, 0, y);
}
function handleWebSocketMessageEvent(event) {
	msg = JSON.parse(event.data);
	console.log(msg);
	if (msg.action !== 'update') {
		return;
	}
	const payload = msg.payload;
	config.payload = payload;

	updateFpsDisplay(payload.rate);
	updateTimeleftDisplay(payload.timeleft);
	updateStartedDisplay(payload.started);
	updatePlayerDisplay(payload.players);

	updateTrack();
	drawTrack();
	drawCar();
	drawObstacle();
	drawFinishLine();
}
