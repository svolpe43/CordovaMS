
/* Minesweeper */

var idle = 0;
var flagged = 1;
var exposed = 2;

var easy = 1;
var medium = 2;
var hard = 3;

var boardDimWithoutLines = 240;
var lineWidth = 5;

var gamediv
var context;
var board;
var cellDim;
var DIM;
var lineOffset;
var boardDimWithLines;
var mouse;
var bombcount;
var bombcountspan;

$(document).ready(function(){
	gamecontainer = $("#game-container");
	gamediv = $("#game");
	tit = $("#title");
	mouse = new Mouse;
	document.onmousedown = mouseDown;
	document.onmousemove = mouseMove;
	
	$(document).bind('keyup', 'space', spaceUp);
	bombcountspan = $("#bomb-count-text");

	reset(2, false);
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

// tile object
function Tile(){
	this.isBomb = false;
	this.surrounding = 0;
	this.state = idle;
}

// called to reset everything basically
function reset(difficulty, isReset){
	$("#game-message").fadeOut("slow");
	switch(difficulty){
		case(easy):
			cellDim = 60;
			density = 8;
			break;
		case(medium):
			cellDim = 40;
			density = 15;
			break;
		case(hard):
			cellDim = 30;
			density = 20;
			break;
	}

	updateSettings(isReset);
	randomize();
	drawCells();
}

// update the settings of the game, changed when first loading and changing difficulty
function updateSettings(isReset){
	DIM = boardDimWithoutLines / cellDim;
	lineOffset = (lineWidth * (DIM - 1));
	boardDimWithLines = boardDimWithoutLines + lineOffset;

	console.log("#game dimensions: " + boardDimWithLines);

	gamediv.height(boardDimWithLines);
	gamediv.width(boardDimWithLines);
	
	$("#game-message").height(boardDimWithLines + 30);
	$("#game-message").width(boardDimWithLines + 30);
	$("#top").width(boardDimWithLines + 30);
}

// randomizes the bombs on the board, this is not how the original does it
// original uses set number of bombs and performs normal distribution
function randomize(){
	board = Array.matrix(DIM, DIM);
	bombcount = 0;
	for(var i = 0; i < DIM; i++){
		for(var j = 0; j < DIM; j++){
			if(Math.random() < density/100){
				board[i][j].isBomb = true;
				bombcount++;
			}
		}
	}
	bombcountspan.html(bombcount);
	countSurroundings();
}

// called when space is unpressed
function spaceUp(event){
	console.log("spacedown");
	x = getTile(mouse, false);
	y = getTile(mouse, true);
	if(board[x][y].state != exposed && board[x][y].state != flagged && bombcount > 0){
		if(board[x][y].state == flagged){
			board[x][y].state = idle;
			bombcount++;
		}else{
			board[x][y].state = flagged;
			cell = $("#cell-" + x + "-" + y);
			cell.animate({
			  	backgroundColor: "#008F6B",
				color: "#fff"
			}, 500, "easeOutBack");
			bombcount--;
		}
	}
	bombcountspan.html(bombcount);
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

	if(x < 0 || y < 0 || x > DIM - 1 || y > DIM - 1)
		return;

	if(board[x][y].state == idle){
		if(board[x][y].isBomb){
			gameover();
		}else{
			exposeTile(x, y);
		}
	}
}

// get the specific tile that was clicked
function getTile(event, isY){
	return Math.floor(getCord(event, isY)/(cellDim + lineWidth));
}

// get the 1D cordinate of the event
function getCord(event, isY){
	return (isY) ? 
		event.x - gamediv.offset().left + $(document).scrollLeft() :
		event.y - gamediv.offset().top + $(document).scrollTop();
}

// recursive function to clear a open region of the board
function exposeTile(x, y){
	board[x][y].state = exposed;

	cell = $("#cell-" + x + "-" + y);
	/*cell.animate({
	  	backgroundColor: "#36367A",
		height: cellDim + 2,
		width: cellDim + 2
	}, 500, "easeOutBack");
	cell.animate({
		height: cellDim,
		width: cellDim
	}, 500, "easeOutBack");*/
	
	cell.addClass("exposed", 200); 

	if(board[x][y].surrounding == 0){
		for(var i = -1; i < 2; i++){
			for(var j = -1; j < 2; j++){
				if(x + i < 0 || y + j < 0 || x + i > DIM - 1 || y + j > DIM - 1)
					continue;
				if(!isBomb(x + i, y + j) && board[x + i][y + j].state == idle)
					exposeTile(x + i, y + j);
			}
		}
	}
}

// called when game is over, exposes every bomb
function gameover(){
	for(var i = 0; i < DIM; i++){
		for(var j = 0; j < DIM; j++){
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
}

// draws the cells and any letters inside of the cell
function drawCells(){
	gamediv.empty();
	var gamestring = "";

	for(var i = 0; i < DIM; i++){
		gamestring += '<div class="game-row">';
		for(var j = 0; j < DIM; j++){
			gamestring += '<div id="cell-' + i + '-' + j + '" class="game-cell';
			if(board[i][j].state == exposed){
				if(board[i][j].isBomb)
					gamestring += ' bomb'
				else
					gamestring += ' exposed';
				gamestring += '">';
			}else if (board[i][j].state == idle){
				gamestring += ' idle">';
			}else{
				gamestring += ' flagged">';
			}
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
	for(var i = 0; i < DIM; i++){
		for(var j = 0; j < DIM; j++){
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
	if(x < 0 || y < 0 || x > DIM - 1 || y > DIM - 1)
		return false;
	return board[x][y].isBomb;
}
