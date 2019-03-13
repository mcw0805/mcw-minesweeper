"use strict";

const DEFAULT_CANVAS_WIDTH = 780;
const DEFAULT_CANVAS_HEIGHT = 450;
const SQUARE_SIZE = 25;
const MARGIN = 10;

/* grid sizes by level (same as Windows Minesweeper) */
const BEGINNER_GRID_SIZE = 9;
const INTERMEDIATE_GRID_SIZE = 16;
const EXPERT_GRID_WIDTH = 30;
const EXPERT_GRID_HEIGHT = 16;

/* number of mines by level */
const BEGINNER_NUM_MINES = 10;
const INTERMEDIATE_NUM_MINES = 40;
const EXPERT_NUM_MINES = 99;

const BEGINNER_LEVEL = 0;
const INTERMEDIATE_LEVEL = 1;
const EXPERT_LEVEL = 2;

/* directions for moving horizontally, vertically, and diagonally */
const NUM_DIRECTIONS = 8;
const dRow = [-1, -1, -1, 0, 0, 1, 1, 1];
const dCol = [-1, 0, 1, -1, 1, -1, 0, 1];

const RIGHT_CLICK_LOOP_LENGTH = 3;

const DEBUG = true;

var rightClickDown = false;  
var leftClickDown = false;

var grid = []; // will be a 2D array containing Tile objects
var gameSvg;

/* Game states */
const INITIALIZE_STATE = 0;
const START_STATE = 1;
const PLAY_STATE = 2;
const GAME_LOSE_STATE = 3;
const GAME_WIN_STATE = 4;

/* variables for the current state of the game */
var currentGridWidth = BEGINNER_GRID_SIZE;
var currentGridHeight = BEGINNER_GRID_SIZE;
var currentNumMines = BEGINNER_NUM_MINES;
var currentNumCellMarkVisible = BEGINNER_GRID_SIZE * BEGINNER_GRID_SIZE - BEGINNER_NUM_MINES;
var currentState = INITIALIZE_STATE;
var currentCanvasWidth = 2 * MARGIN + currentGridWidth * SQUARE_SIZE;
var currentCanvasHeight = 2 * MARGIN + currentGridHeight * SQUARE_SIZE;

/* time, num mines marked control */
var clickFirstTime = true;
var flaggedMinesCountDown = BEGINNER_NUM_MINES;

var gameTimeInSec = 0;
var t;

/* UI control */
var resetBtn = document.getElementById("resetBtn");
var mineCountDownDisplay = document.getElementById("mineCountDown");
var gameTimerDisplay = document.getElementById("gameTimer");
var btnImg = document.getElementById("btnImg");

var levelDropDown = document.getElementById("levelDropDown");
var currentLevel = levelDropDown.selectedIndex;
var selectedLevel = currentLevel;


window.onload = () => {
    init();
};

function init() {
    currentState = INITIALIZE_STATE;


    switch (currentLevel) {
        case BEGINNER_LEVEL:
            currentGridWidth = currentGridHeight = BEGINNER_GRID_SIZE;
            currentNumMines = BEGINNER_NUM_MINES;
            flaggedMinesCountDown = BEGINNER_NUM_MINES;
            currentNumCellMarkVisible = BEGINNER_GRID_SIZE * BEGINNER_GRID_SIZE - BEGINNER_NUM_MINES;
            break;
        case INTERMEDIATE_LEVEL:
            currentGridWidth = currentGridHeight = INTERMEDIATE_GRID_SIZE;
            currentNumMines = INTERMEDIATE_NUM_MINES;
            flaggedMinesCountDown = INTERMEDIATE_NUM_MINES;
            currentNumCellMarkVisible = INTERMEDIATE_GRID_SIZE * INTERMEDIATE_GRID_SIZE - INTERMEDIATE_NUM_MINES;
            break;
        case EXPERT_LEVEL:
            currentGridWidth = EXPERT_GRID_WIDTH;
            currentGridHeight = EXPERT_GRID_HEIGHT;
            currentNumMines = EXPERT_NUM_MINES;
            flaggedMinesCountDown = EXPERT_NUM_MINES;
            currentNumCellMarkVisible = EXPERT_GRID_WIDTH * EXPERT_GRID_HEIGHT - EXPERT_NUM_MINES;
            break;
    }

    let canvasDim = calculateCanvasSize(currentGridWidth, currentGridHeight, SQUARE_SIZE, MARGIN);
    currentCanvasWidth = canvasDim[0];
    currentCanvasHeight = canvasDim[1];

    mineCountDownDisplay.innerHTML = flaggedMinesCountDown;
    
    initializeGrid(currentGridWidth, currentGridHeight);
    randomizeMines(currentGridWidth, currentGridHeight, currentNumMines);
    label(currentGridWidth, currentGridHeight);
    
    gameSvg = drawGridSvg(currentCanvasWidth, currentCanvasHeight, currentGridWidth, currentGridHeight, SQUARE_SIZE);
    
    addLeftClickListener();
    addRightClickListener();
    addMiddleClickListener();

    return gameSvg;
}

function resetBoard() {
    currentState = INITIALIZE_STATE;

    // reset timer
    gameTimeInSec = 0;
    gameTimerDisplay.innerHTML = "000";
    clearTimeout(t);

    // reset reset button
    btnImg.src = "./smile.png";

    clickFirstTime = true;
    updateSelectedLevel();
    let oldGridSvg = document.querySelector("#grid-svg");
    oldGridSvg.remove();

    init();

}

function updateSelectedLevel() {
    selectedLevel = levelDropDown.selectedIndex;
    if (currentLevel !== selectedLevel) {
        currentLevel = selectedLevel;
    }
}

document.createSvg = function(tagName) {
    var svgNS = "http://www.w3.org/2000/svg";
    return this.createElementNS(svgNS, tagName);
};

function drawGridSvg(canvasWidth, canvasHeight, gridWidth, gridHeight, squareSize) {
    var svg = document.createSvg("svg");
    svg.setAttribute("width", canvasWidth);
    svg.setAttribute("height", canvasHeight);
    svg.setAttribute("viewbox", "0 0 " + canvasWidth + " " + canvasHeight);
    svg.setAttribute("id", "grid-svg");

    let cellNum = 0;
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {

            let g = document.createSvg("g");
            g.setAttribute("transform", ["translate(", j * squareSize + 10, ",", i * squareSize + 10, ")"].join(""));
            g.setAttribute("id", "g" + cellNum);
            g.setAttribute("class", "cell");

            let box = document.createSvg("rect");
            box.setAttribute("width", squareSize);
            box.setAttribute("height", squareSize);
            box.setAttribute("fill", "#38B0DE");
            box.setAttribute("stroke", "grey");
            box.setAttribute("id", "b" + cellNum); // put id on each of the rect elements

            g.appendChild(box);
            svg.appendChild(g);

            cellNum++; 
        }
    }

    let svgContainer = document.getElementById("svg-container");
    svgContainer.appendChild(svg);

    return svg;
}

function addLeftClickListener() {
    for (let cg of gameSvg.childNodes) {
        //cg.addEventListener("click", cellLeftClickHandler);
        cg.onclick = cellLeftClickHandler;
    }
}

function addRightClickListener() {
    for (let cg of gameSvg.childNodes) {
        //cg.addEventListener("contextmenu", cellRightClickHandler);
        cg.oncontextmenu = cellRightClickHandler;
    }
}

function addMiddleClickListener() {
    for (let cg of gameSvg.childNodes) {
        cg.onmousedown = middleClickHandler;
        //cg.addEventListener("mousedown", middleClickHandler);
        // cg.addEventListener("mousedown", (e) => {
        //     // if (e && e.which === 2) {
        //     //     e.preventDefault();
        //     //     console.log('middleclicked');
        //     // }
        //     //middleClickHandler(e, this);
        // });

        cg.onmouseup = upClickHandler;
    }
}

function upClickHandler(e) {
    e.preventDefault();
    if(e.which == 1) {
        leftClickDown = false;
    } else if (e.which == 3) {
        rightClickDown = false;
    }

    if (!leftClickDown && !rightClickDown) {
        console.log('both clicked');
        e.preventDefault();
        let rowCol = cellIdNumToRowCol(parseInt((this.id).substring(1)), currentGridWidth);
        let row = rowCol[0], col = rowCol[1];
        if (grid[row][col].label > 0 && grid[row][col].isVisible) { 

            // look around the neighbour and if flag and mine matches
            for (let i = 0; i < NUM_DIRECTIONS; i++) {
                let neighborRow = row + dRow[i];
                let neighborCol = col + dCol[i];

                if (!isInBounds(neighborRow, neighborCol, currentGridWidth, currentGridHeight)) continue;
        
                if (!grid[neighborRow][neighborCol].isVisible && grid[neighborRow][neighborCol].rightClickStatus === 0) {
                    let cellNum = rowColToCellNum(neighborRow, neighborCol, currentGridWidth);
                    markCellColorVisible(gameSvg.childNodes[cellNum], "#38B0DE");
                }

            } // end for
        }
    }
}

/*
    Left click in minesweeper is used to get the number of mines around the clicked cell.
*/
function cellLeftClickHandler() {

    let rowCol = cellIdNumToRowCol(parseInt((this.id).substring(1)), currentGridWidth);
    let row = rowCol[0], col = rowCol[1];

    let changeFirstTime = clickFirstTime;
    while (clickFirstTime && grid[row][col].isMine) {
        // console.log('reconfiguring mine board');
        resetBoard();
    }

    // mechanism to make timer call only once
    // start timer on the very very first click
    clickFirstTime = false;
    if (changeFirstTime != clickFirstTime) {
        if (gameTimeInSec == 0) {
            gameTimeInSec = 1;
            gameTimerDisplay.innerHTML = gameTimeInSec;
        }
        timer();
    }

    // if cell hasn't been clicked -> update UI to make the cell visible
    if (!grid[row][col].isVisible) {
        setVisible(row, col, currentGridWidth, currentGridHeight, gameSvg);
    }
}

/* 
    Right click in minesweeper is used to mark mines, mark as question mark, or leave as unmarked.
*/
function cellRightClickHandler() {
    let rowCol = cellIdNumToRowCol(parseInt((this.id).substring(1)), currentGridWidth);
    let row = rowCol[0], col = rowCol[1];

    // if hasn't been clicked -> can't right click on a cell already shown
    if (!grid[row][col].isVisible) {
        if (grid[row][col].rightClickStatus == 0) { // not marked --> change to flag
            drawFlagWithinCell(SQUARE_SIZE, this);
            // remove left click event listener
            this.onclick = '';
            //this.removeEventListener("click", cellLeftClickHandler);
        
            flaggedMinesCountDown--;
            if (flaggedMinesCountDown.toString().length > 1) {
                mineCountDownDisplay.innerHTML = flaggedMinesCountDown;
            } else {
                mineCountDownDisplay.innerHTML = "0" + flaggedMinesCountDown;
            }

        } else if (grid[row][col].rightClickStatus == 1) { // marked as flag --> change to ?
            clearCell(this);
            drawNumberWithinCell("?", this);

            flaggedMinesCountDown++;
            if (flaggedMinesCountDown.toString().length > 1) {
                mineCountDownDisplay.innerHTML = flaggedMinesCountDown;
            } else {
                mineCountDownDisplay.innerHTML = "0" + flaggedMinesCountDown;
            }

        } else if (grid[row][col].rightClickStatus == 2) { // marked as ? --> change to not marked
            clearCell(this);
            //this.addEventListener("click", cellLeftClickHandler);
            this.onclick = cellLeftClickHandler;
        }

        if (currentNumCellMarkVisible == 0 && flaggedMinesCountDown == 0) {
            gameWin();
            return;
        }
        grid[row][col].rightClickStatus++;
        grid[row][col].rightClickStatus %= RIGHT_CLICK_LOOP_LENGTH;
    }
    return false;

}

/*  
    Both left and right click is used for flooding the cells when mines around a cell have all been discovered. 
    Or it is used to highlight undiscovered surrounding cells.

    With MacBooks and some other laptops, simultaneous left/right click is not possible on the trackpad, so middle click
    is used instead to flood. Highlighting surrounding cells is not possible in this case.
*/
function middleClickHandler(e) {

    if (e && e.which == 3) {
        rightClickDown = true;
    } else if (e && e.which == 1) {
        leftClickDown = true;
    }

    // simultaneous left and right click
    if (leftClickDown && rightClickDown) {
        // console.log('both clicked');
        e.preventDefault();
        let rowCol = cellIdNumToRowCol(parseInt((this.id).substring(1)), currentGridWidth);
        let row = rowCol[0], col = rowCol[1];
        
        if (grid[row][col].label > 0 && grid[row][col].isVisible) { 

            let numFlaggedCorrect = 0;
            let numFlaggedIncorrect = 0;
            let neighborCoordinates = [];

            // look around the neighbour and if flag and mine matches
            for (let i = 0; i < NUM_DIRECTIONS; i++) {
                let neighborRow = row + dRow[i];
                let neighborCol = col + dCol[i];

                if (!isInBounds(neighborRow, neighborCol, currentGridWidth, currentGridHeight)) continue;
        
                if (!grid[neighborRow][neighborCol].isVisible && grid[neighborRow][neighborCol].rightClickStatus === 0) {
                    let cellNum = rowColToCellNum(neighborRow, neighborCol, currentGridWidth);
                    markCellColorVisible(gameSvg.childNodes[cellNum], "blue");
                }

                ////
                if (grid[neighborRow][neighborCol].rightClickStatus === 1) {
                    if (grid[neighborRow][neighborCol].isMine) {
                        numFlaggedCorrect++;
                    } else  {
                        numFlaggedIncorrect++;
                    }
                }

                if (!grid[neighborRow][neighborCol].isMine && !grid[neighborRow][neighborCol].isVisible) {
                    neighborCoordinates.push([neighborRow, neighborCol]);
                }
                ////

            } // end for

            if (numFlaggedIncorrect > 0) {
                gameLose();
                return;
            }

            // highlight neighboring cells that are not visible yet
            if (numFlaggedCorrect === grid[row][col].label && neighborCoordinates.length > 0) {
                setNonMineNeighborVisible(neighborCoordinates);
            }
        }
    }

    // middle click only
    // implementation is mostly same as above
    if (e && e.which == 2) {
        e.preventDefault();
        let rowCol = cellIdNumToRowCol(parseInt((this.id).substring(1)), currentGridWidth);
        let row = rowCol[0], col = rowCol[1];

        // middle click on a visible cell, make sure it's not an empty cell
        if (grid[row][col].label > 0 && grid[row][col].isVisible) { 
            
            let numFlaggedCorrect = 0;
            let numFlaggedIncorrect = 0;
            let neighborCoordinates = [];

            // look around the neighbour and if flag and mine matches
            for (let i = 0; i < NUM_DIRECTIONS; i++) {
                let neighborRow = row + dRow[i];
                let neighborCol = col + dCol[i];

                if (!isInBounds(neighborRow, neighborCol, currentGridWidth, currentGridHeight)) continue;
        
                if (grid[neighborRow][neighborCol].rightClickStatus === 1) {
                    if (grid[neighborRow][neighborCol].isMine) {
                        numFlaggedCorrect++;
                    } else  {
                        numFlaggedIncorrect++;
                    }
                }

                if (!grid[neighborRow][neighborCol].isMine && !grid[neighborRow][neighborCol].isVisible) {
                    neighborCoordinates.push([neighborRow, neighborCol]);
                }
            } // end for
            
            if (numFlaggedIncorrect > 0) {
                gameLose();
                return;
            }
            if (numFlaggedCorrect === grid[row][col].label && neighborCoordinates.length > 0) {
                setNonMineNeighborVisible(neighborCoordinates);
            }
        }

    }
    return false;
}

// highlight surrounding cells
function setNonMineNeighborVisible(neighborCoordinates) {
    for (let i = 0; i < neighborCoordinates.length; i++) {
        let row = neighborCoordinates[i][0];
        let col = neighborCoordinates[i][1];
        setVisible(row, col, currentGridWidth, currentGridHeight, gameSvg);
    }
}

// draw flag for marking mines
function drawFlagWithinCell(squareSize, cellGroup) {
    let poleLen = squareSize * 0.6;
    let verticalShift = (squareSize - poleLen) / 2;
    let horizontalShift = squareSize / 4;

    let flagPoleBeginX = cellGroup.getAttribute("x") + horizontalShift; // horizontally shifted
    let flagPoleBeginY = cellGroup.getAttribute("y") + verticalShift;
    let flagPoleEndY = flagPoleBeginY + poleLen;

    let g = document.createSvg("g");
    g.setAttribute("class", "flag")

    let pole = document.createSvg("line");
    pole.setAttribute("x1", flagPoleBeginX);
    pole.setAttribute("y1", flagPoleBeginY);
    pole.setAttribute("x2", flagPoleBeginX);
    pole.setAttribute("y2", flagPoleEndY);
    pole.setAttribute("stroke", "black");

    let flagHeight = poleLen / 1.75;
    let flagWidth = horizontalShift * 2;

    let flagBody = document.createSvg("rect");
    flagBody.setAttribute("x", flagPoleBeginX);
    flagBody.setAttribute("y", flagPoleBeginY);
    flagBody.setAttribute("width", flagWidth);
    flagBody.setAttribute("height", flagHeight);
    flagBody.setAttribute("fill", "red");

    g.appendChild(pole);
    g.append(flagBody);

    cellGroup.appendChild(g);
}

// shift is hardcoded based on SQUARE_SIZE
function drawNumberWithinCell(num, cellGroup) {
    if (num === 0) return;

    let numberText = document.createSvg("text");
    numberText.setAttribute("x", 7);
    numberText.setAttribute("y", 18);
    numberText.setAttribute("class", "numInCell");

    numberText.setAttribute("fill", "black");
    let d = document.createTextNode(num + "");
    numberText.appendChild(d);

    cellGroup.appendChild(numberText);
}

// mine is just a circle
function drawMineWithinCell(cellGroup, squareSize) {
    let mineRadius = (squareSize * 0.6) / 2;

    let mine = document.createSvg("circle");
    mine.setAttribute("cx", squareSize / 2);
    mine.setAttribute("cy", squareSize / 2);
    mine.setAttribute("r", mineRadius);
    mine.setAttribute("fill", "dimgrey");

    cellGroup.appendChild(mine);

}

function markCellColorVisible(cellGroup, color) {
    cellGroup.firstChild.setAttribute("fill", color);
}

function markCellExploded(cellGroup) {
    if (cellGroup) {
        let cellRect = cellGroup.firstChild;
        cellRect.setAttribute("fill", "red");
    }
}

// incorrectly marked mines are covered with an X symbol (2 diagonal lines)
function markCellIncorrect(cellGroup, squareSize) {
    //let cellGroup = document.getElementById(cellId);

    let g = document.createSvg("g");

    let line1 = document.createSvg("line");
    line1.setAttribute("x1", 0);
    line1.setAttribute("y1", 0);
    line1.setAttribute("x2", squareSize);
    line1.setAttribute("y2", squareSize);
    line1.setAttribute("stroke", "red");

    let line2 = document.createSvg("line");
    line2.setAttribute("x1", squareSize);
    line2.setAttribute("y1", 0);
    line2.setAttribute("x2", 0);
    line2.setAttribute("y2", squareSize);
    line2.setAttribute("stroke", "red");

    g.appendChild(line1);
    g.appendChild(line2);
    
    cellGroup.appendChild(g);
}

function clearCell(cellGroup) {
    let cellChildNodes = cellGroup.childNodes; // should be rect, g, or text
    for (let cn of cellChildNodes) {
        if (cn.tagName !== "rect") {
            cn.remove();
        }
    }
}

/* game logic */

/*
    Tile object: 
        - isMine -> self-explanatory
        - isVisible -> label is visible, meaning it has been clicked
        - label -> number of mines surrounding the cell
        - rightClickStatus -> toggles among mine flag, question mark, and no mark
*/
function Tile(isMine, isVisible, label) {
    this.isMine = isMine;
    this.isVisible = isVisible;
    this.label = label;
    this.id = Tile.count++;
    this.rightClickStatus = 0;
}

Tile.prototype.getTileInfo = () => {
    return {
        "id": this.id,
        "isMine": this.isMine,
        "isVisible": this.isVisible,
        "label": this.label
    };
}

Tile.count = 0;

// Just setting up the grid. Nothing about mines/labels at this point.
function initializeGrid(gridWidth, gridHeight) {

    Tile.count = 0;

    for (let i = 0; i < gridHeight; i++) {
        grid[i] = [];
        for (let j = 0; j < gridWidth; j++) {
            grid[i][j] = new Tile(false, false, 0);
        }
    }

}

// randomize mines on the grid
function randomizeMines(gridWidth, gridHeight, numMines) {
    for (let i = 0; i < numMines; i++) {
        while (true) {
            let randRow = Math.floor(Math.random() * gridHeight);
            let randCol = Math.floor((Math.random() * gridWidth));

            // set mine if not already set
            if (!grid[randRow][randCol].isMine){
                grid[randRow][randCol].isMine = true;
                break;
            }
        } // if already a mine, try again
    }
}

function drawMinesOnGrid(gridWidth, gridHeight, gridSvg) {
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
            let cellGroup = gridSvg.childNodes[rowColToCellNum(i, j, gridWidth)];
            if (grid[i][j].isMine && grid[i][j].rightClickStatus != 1) { // question mark or not marked
                drawMineWithinCell(cellGroup, SQUARE_SIZE);
            } else if (!grid[i][j].isMine  && grid[i][j].rightClickStatus == 1) { // if flag
                    clearCell(cellGroup);
                    drawMineWithinCell(cellGroup, SQUARE_SIZE);
                    markCellIncorrect(cellGroup, SQUARE_SIZE)
            }
        }
    }
}

function drawLabelsOnGrid(gridWidth, gridHeight) {
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
            if (!grid[i][j].isMine) {
                drawNumberWithinCell(grid[i][j].label, "g" + grid[i][j].id);
            }
        }
    }
}

function isInBounds(row, col, gridWidth, gridHeight) {
    return row >= 0 && row < gridHeight && col >= 0 && col < gridWidth;
}

function numSurroundingMines(currRow, currCol, gridWidth, gridHeight) {
    let numMines = 0;

    for (let i = 0; i < NUM_DIRECTIONS; i++) {
        let neighborRow = currRow + dRow[i];
        let neighborCol = currCol + dCol[i];

        // check bounds first then check whether that cell is a mine
        if (isInBounds(neighborRow, neighborCol, gridWidth, gridHeight) && grid[neighborRow][neighborCol].isMine) {
            numMines++;
        }
    }

    return numMines;
}

// should call after randomizing the mines
// determines number of mines surrounding a cell for the entire grid
function label(gridWidth, gridHeight) {
    for (let i = 0; i < gridHeight; i++) {
        for (let j = 0; j < gridWidth; j++) {
            if (!grid[i][j].isMine) {
                grid[i][j].label = numSurroundingMines(i, j, gridWidth, gridHeight);
            }
        }
    }
}

function setVisible(currRow, currCol, gridWidth, gridHeight, gridSvg) {
    // out of bounds check
    if (!isInBounds(currRow, currCol, gridWidth, gridHeight)) return;

    // if already visited or is a mine
    if (grid[currRow][currCol].isVisible) return;

    let cellGroup = gridSvg.childNodes[rowColToCellNum(currRow, currCol, gridWidth)];

    // mine has been clicked
    if (grid[currRow][currCol].isMine) {
        markCellExploded(cellGroup);
        gameLose();
        return;
    }
    
    grid[currRow][currCol].isVisible = true;
    markCellColorVisible(cellGroup, "cyan");
    currentNumCellMarkVisible--;
    // console.log("current marked visible: " + currentNumCellMarkVisible);
    // console.log("flagged: " + flaggedMinesCountDown);

    if (currentNumCellMarkVisible == 0 && flaggedMinesCountDown == 0) {
        if (grid[currRow][currCol].label > 0) {
            clearCell(cellGroup);
            drawNumberWithinCell(grid[currRow][currCol].label, cellGroup);
        }
        gameWin();
        return;
    }

    if (grid[currRow][currCol].label > 0) {
        clearCell(cellGroup);
        drawNumberWithinCell(grid[currRow][currCol].label, cellGroup);
        return;
    }

    // search neighbours
    for (let i = 0; i < NUM_DIRECTIONS; i++) {
        setVisible(currRow + dRow[i], currCol + dCol[i], gridWidth, gridHeight, gridSvg);
    }

}

function gameLose() {
    drawMinesOnGrid(currentGridWidth, currentGridHeight, gameSvg);
    btnImg.src = "./dead_face.png";
    currentState = GAME_LOSE_STATE;
    gameEnd();
}

function gameEnd() {
    // disable all clicks since the game is over
    for (let cg of gameSvg.childNodes) {
        // cg.removeEventListener("click", cellLeftClickHandler);
        // cg.removeEventListener("contextmenu", cellRightClickHandler);
        cg.onclick = '';
        cg.oncontextmenu = '';
        cg.onmousedown = '';
    }
    
    clearTimeout(t); // stop timer since game is over
}

function gameWin() {
    btnImg.src = "./sunglass_smile.png";
    currentState = GAME_WIN_STATE;
    gameEnd();
}

function calculateCanvasSize(gridWidth, gridHeight, squareSize, margin) {
    let overallWidth = gridWidth * squareSize;
    let overallHeight = gridHeight * squareSize;

    let cavasWidth = 2 * margin + overallWidth;
    let canvasHeight = 2 * margin + overallHeight;

    return [cavasWidth, canvasHeight];
}

// gridWidth = number of coloumns
function cellIdNumToRowCol(cellIdNum, gridWidth) {
    return [Math.floor(cellIdNum / gridWidth), cellIdNum % gridWidth];
}

// gridWidth = number of coloumns
function rowColToCellNum(currRow, currCol, gridWidth) {
    return currRow * gridWidth + currCol;
}

function addSeconds() {

    gameTimeInSec++;
    gameTimerDisplay.innerHTML = gameTimeInSec;
    timer();
}

function timer() {
    t = setTimeout(addSeconds, 1000);
}