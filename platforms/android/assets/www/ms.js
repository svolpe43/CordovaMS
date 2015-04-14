
/* Minesweeper */

var idle = 0;
var flagged = 1;
var exposed = 2;

var easy = 1;
var medium = 2;
var hard = 3;

var PADDING = 30;

var boardWidthWithoutLines = 240;
var boardHeightWithoutLines = 360;
var lineWidth = 2;

var horizontalCellNum;
var verticalCellNum;

var horizontalLineOffset;
var verticalLineOffset;

var gamedata;
var gamediv
var context;
var board;
var cellDim;
var tileCheckId;

var boardWidthWithLines;
var boardHeightWithLines;

var mouse;
var bombcount;
var bombcountspan;
var instructionsShowing = false;

var cords = {
	x : 0,
	y : 0
}

$(document).ready(function(){
	gamecontainer = $("#game-container");
	gamediv = $("#game");
	tit = $("#title");
	mouse = new Mouse;

	// make sure tap doesnt get triggered by the taphold
	$.event.special.tap.emitTapOnTaphold = false;
	
	// shorten the taphold duration a little default is 750ms
	$.event.special.tap.tapholdThreshold = 400;

	//document.onmousedown = mouseDown;
	document.onmousemove = mouseMove;

	$(document).on('vmousedown', function(event){
		cords.x = event.pageX;
		cords.y = event.pageY;
	});

	$(document).bind("tap", mouseDown);
	$(document).bind('taphold', longPress);

	bombcountspan = $("#bomb-count-text");

	reset(2);
});

// static function to initialize an array
Array.matrix = function(numrows, numcols){
   var arr = [];
   for (var i = 0; i < numrows; ++i){
      var columns = [];
      for (var j = 0; j < numcols; ++j){
         columns[j] = new Tile();
      }
      arr[i] = columns;
    }
    return arr;
}

// mouse object
function Mouse(){
	this.x = 0;
	this.y = 0;
}

function GameData(cells, bombs){
	this.numexposed = 0;
	this.numbombs = bombs;
	this.numcells = cells;
	this.flagsleft = bombs;
	this.flagsdown = 0;
}

// tile object
function Tile(){
	this.isBomb = false;
	this.surrounding = 0;
	this.state = idle;
	this.checked = 0;
}

// show the instructions
function instructions(){
	if(!instructionsShowing){
		$("#game-message").fadeIn("slow");
		$("#instructions").show();
		$("#game-over").hide();
		$("#win").hide();
		instructionsShowing = true;
	}else{
		$("#game-message").fadeOut("slow");
		$("#instructions").hide();
		$("#game-over").hide();
		$("#win").hide();
		instructionsShowing = false;
	}
}

// called to reset everything basically
function reset(difficulty, isreset){
	$("#game-message").fadeOut("slow");
	switch(difficulty){
		case(easy):
			cellDim = 60;
			density = 8;
			break;
		case(medium):
			cellDim = 25;
			density = 30;
			break;
		case(hard):
			cellDim = 30;
			density = 20;
			break;
	}

	updateParameters(isreset);
	randomize(20);
	drawCells();
}

// update the settings of the game, changed when first loading and changing difficulty
function updateParameters(isreset){

	boardWidthWithoutLines = roundDown($(window).width() * .7, cellDim);
	boardHeightWithoutLines = roundDown($(window).height() * .7, cellDim);

	horizontalCellNum = boardWidthWithoutLines / cellDim;
	verticalCellNum = boardHeightWithoutLines / cellDim;

	horizontalLineOffset = (lineWidth * (horizontalCellNum - 1));
	verticalLineOffset = (lineWidth * (verticalCellNum - 1));

	boardWidthWithLines = boardWidthWithoutLines + horizontalLineOffset;
	boardHeightWithLines = boardHeightWithoutLines + verticalLineOffset;

	gamediv.height(boardHeightWithLines);
	gamediv.width(boardWidthWithLines);

	var pad = 30;
	if(isreset)
		pad = 0;
	
	$("#game-message").height(boardHeightWithLines + PADDING);
	$("#game-message").width(boardWidthWithLines + PADDING);
	$("#game-container").height(boardHeightWithLines + pad);
	$("#game-container").width(boardWidthWithLines + pad);
	$("#top").width(boardWidthWithLines + PADDING);
}

// performs random normal distribution of bombs on board
function randomize(bombs){
	board = Array.matrix(verticalCellNum, horizontalCellNum);
	console.log(verticalCellNum, horizontalCellNum);
	gamedata = new GameData(verticalCellNum * horizontalCellNum, bombs);
	tileCheckId = 0;
	while(bombs > 0){
		var x = randomVal(0, verticalCellNum - 1);
		var y = randomVal(0, horizontalCellNum - 1);
		if(!board[x][y].isBomb){
			board[x][y].isBomb = true;
			bombs--;
		}
	}
	bombcountspan.html(gamedata.flagsleft);
	countSurroundings();
}

// called when space is unpressed
function longPress(event){
	console.log("spacedown");
	event.pageX = cords.x;
	event.pageY = cords.y;
	x = getTile(event, false);
	y = getTile(event, true);
	if(board[x][y].state == idle && gamedata.flagsleft > 0){
		board[x][y].state = flagged;
		cell = $("#cell-" + x + "-" + y);
		cell.removeClass("surround-yes");
		cell.addClass("flagged");
		gamedata.flagsleft--;
		gamedata.flagsdown++;
	}else if(board[x][y].state == flagged){
		board[x][y].state = idle;
		cell = $("#cell-" + x + "-" + y);
		cell.removeClass("flagged");
		cell.addClass("surround-yes");
		gamedata.flagsleft++;
		gamedata.flagsdown--;
	}
	bombcountspan.html(gamedata.flagsleft);
	win();
}

// called when mouse is moved
function mouseMove(event){
	mouse.x = event.x;
	mouse.y = event.y;
}

// called when mouse is pressed
function mouseDown(event){

	x = getTile(event, false);
	y = getTile(event, true);

	if(offBoard(x, y))
		return;

	if(board[x][y].state == idle){
		if(board[x][y].isBomb){
			gameover();
		}else{
			tileCheckId++;
			exposeTile(x, y);
		}
	}

	win();
}

// determines if win and shows message
function win(){
	if(gamedata.numexposed + gamedata.flagsdown == gamedata.numcells){
		$("#game-message").fadeIn("slow");
		$("#game-over").hide();
		$("#instructions").hide();
		$("#win").show();
	}
}

// get the specific tile that was clicked
function getTile(event, isY){
	return Math.floor(getCord(event, isY)/(cellDim + lineWidth));
}

// get the 1D cordinate of the event
function getCord(event, isY){
	return (isY) ? 
		event.pageX - gamediv.offset().left + $(document).scrollLeft() :
		event.pageY - gamediv.offset().top + $(document).scrollTop();
}

// recursive function to clear a open region of the board
function exposeTile(x, y){
	board[x][y].state = exposed;
	gamedata.numexposed++;
	cell = $("#cell-" + x + "-" + y);
	cell.addClass("exposed", 0); 
	if(board[x][y].surrounding == 0){
		for(var i = -1; i < 2; i++){
			for(var j = -1; j < 2; j++){
				if(offBoard(x + i, y + j))
					continue;
				if( !isBomb(x + i, y + j) && 
					board[x + i][y + j].state == idle){
						exposeTile(x + i, y + j);
				}
			}
		}
	}
}

// called when game is over, exposes every bomb
function gameover(){
	// expose all of the bombs
	for(var i = 0; i < verticalCellNum; i++){
		for(var j = 0; j < horizontalCellNum; j++){
			if(board[i][j].isBomb){
				board[i][j].state = exposed;
				cell = $("#cell-" + i + "-" + j);
				cell.animate({
				  	backgroundColor: "#CC0052"
				}, 1000, "easeOutBack");
			}
		}
	}
	
	$("#game-message").fadeIn("slow");
	$("#game-over").show();
	$("#instructions").hide();
	$("#win").hide();
}

// creates an html string called 'game' and inserts it into the game container then some size assurance
function drawCells(){
	gamediv.empty();
	var gamestring = "";
	for(var i = 0; i < verticalCellNum; i++){
		gamestring += '<div class="game-row">';
		for(var j = 0; j < horizontalCellNum; j++){
			gamestring += '<div id="cell-' + i + '-' + j + '" class="game-cell';
			if(board[i][j].state == exposed){
				if(board[i][j].isBomb)
					gamestring += ' bomb'
				else
					gamestring += ' exposed';
				gamestring += '">';
			}else if (board[i][j].state == idle){
				
					gamestring += ' surround-yes">';
			}else{
				gamestring += ' flagged">';
			}
			if(board[i][j].surrounding != 0)
				gamestring += '<p>' + board[i][j].surrounding + '</p>';
			gamestring += '</div>';
		}
		gamestring += '</div>';
	}
	gamestring += '</div>';
	gamediv.append(gamestring);

	$('.game-row').each(function() {
		$(this).height(cellDim);
	});
	
	$('.game-cell').each(function() {
		$(this).height(cellDim).width(cellDim);
	});
}

function countSurroundings(){
	for(var i = 0; i < verticalCellNum; i++){
		for(var j = 0; j < horizontalCellNum; j++){
			processCell(i, j);
		}
	}
}

// sets the surrounding mines count on the tile object
function processCell(x, y){
	var count = 0;
	for(var i = -1; i < 2; i++){
		for(var j = -1; j < 2; j++){
			if(i == 0 && j == 0)
				continue;
			if(isBomb(x + i, y + j))
				count++;
		}
	}
	
	board[x][y].surrounding = count;
}

// returns if the tile is a bomb being careful to not go off the board
function isBomb(x, y){
	if(offBoard(x, y))
		return false;
	return board[x][y].isBomb;
}

// a check to make sure we are staying within board limits
function offBoard(x, y){
	return (x < 0 || y < 0 || x > verticalCellNum - 1 || y > horizontalCellNum - 1)
}

// rounds down to the nearest specified number
function roundDown(num, nearest){
     return num - num % nearest;
}

// returns a random value between specified values
function randomVal(lower, higher){
	return Math.floor(Math.random()*(higher - lower + 1) + lower);
}
