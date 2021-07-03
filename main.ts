// NOTE: DO NOT CONVERT TO BLOCKS!
// Click on "Show console" to see the maze generated and other information.
// Global variables and constants
enum STATES { WALL, SPACE, PLAYER, END }
enum DIRECTION { UP, RIGHT, DOWN, LEFT }
let LENGTH = Math.randomRange(50, 150)
let HEIGHT = Math.randomRange(50, 150)

let maze: number[][]
let elements: game.LedSprite[]
let player: number[]
let endingPoint: number[]
let playerSprite: game.LedSprite
let numMoves: number
let won: boolean
let numGames = 0
let solving: boolean

function initAndStartGame() {
    numGames++
    numMoves = 0
    won = false
    solving = false
    player = [-1, -1]
    endingPoint = [-1, -1]
    maze = []
    if (elements != null) {
        for (let s of elements) {
            s.delete()
        }
    }
    elements = []
    createMaze(LENGTH, HEIGHT)
    if (playerSprite != null) playerSprite.delete()
    playerSprite = game.createSprite(2, 2)
    playerSprite.set(LedSpriteProperty.Brightness, 127)
    printMaze(player)
    logMaze()
    solve(player, endingPoint, false)
}

function prepareArray(array: any[][], len: number, width: number, initialValue: any) {
    for (let i = 0; i < len; i++) {
        array.push([])
        for (let j = 0; j < width; j++) {
            array[i].push(initialValue)
        }
    }
}

function randomDirection(): DIRECTION {
    return Math.randomRange(0, 3)
}

function createMaze(len: number, width: number) {
    let startx = Math.randomRange(0, LENGTH - 1)
    let starty = Math.randomRange(0, HEIGHT - 1)
    prepareArray(maze, len, width, STATES.WALL)
    explore(startx, starty, Math.min(len * width - 1, Math.randomRange((len + width) * 2, len * width / 3)), randomDirection())
    maze[startx][starty] = STATES.PLAYER
    player[0] = startx
    player[1] = starty
}

function isValidDirection(x: number, y: number, direction: DIRECTION): boolean {
    if (x == 0 && direction == DIRECTION.LEFT) return false
    if (x == LENGTH - 1 && direction == DIRECTION.RIGHT) return false
    if (y == 0 && direction == DIRECTION.UP) return false
    if (y == HEIGHT - 1 && direction == DIRECTION.DOWN) return false
    return true
}

function explore(thisx: number, thisy: number, num: number, direction: DIRECTION) {
    let playerx = thisx
    let playery = thisy
    while (num > 0) {
        if (maze[thisx][thisy] != STATES.SPACE) num--
        maze[thisx][thisy] = STATES.SPACE
        let newdirection: DIRECTION
        let newx = -1
        let newy = -1
        do {
            let randnum = Math.randomRange(0, 7)
            if (randnum < 5) newdirection = direction // can explore more in maze and minimise chances of cycling
            else newdirection = randomDirection()
        } while (!isValidDirection(thisx, thisy, newdirection))
        switch (newdirection) {
            case DIRECTION.UP:
                thisy -= 1
                break
            case DIRECTION.DOWN:
                thisy += 1
                break
            case DIRECTION.RIGHT:
                thisx += 1
                break
            case DIRECTION.LEFT:
                thisx -= 1
                break
        }
        direction = newdirection
    }
    if (playerx == thisx && playery == thisy) {
        let newdirection: DIRECTION = null
        do {
            newdirection = randomDirection()
        } while (!isValidDirection(thisx, thisy, newdirection))
        explore(thisx, thisy, 1, newdirection)
    } else {
        maze[thisx][thisy] = STATES.END
        endingPoint[0] = thisx
        endingPoint[1] = thisy
    }
}

function logMaze() {
    let numWalls = 0
    console.log("Game #" + convertToText(numGames) + ":")
    for (let i = 0; i < HEIGHT; i++) {
        let str = ""
        for (let j = 0; j < LENGTH; j++) {
            if (maze[j][i] == STATES.PLAYER) str += "S"
            else if (maze[j][i] == STATES.END) str += "E"
            else if (maze[j][i] == STATES.SPACE) str += "."
            else {
                str += "W"
                numWalls++
            }
        }
        console.log(str)
    }
    console.log("Starting point: " + convertToText(player[0]) + ", " + convertToText(player[1]))
    console.log("Ending point: " + convertToText(endingPoint[0]) + ", " + convertToText(endingPoint[1]))
    console.log("Number of empty spaces: " + convertToText(LENGTH * HEIGHT - numWalls))
    console.log("Percentage of empty spaces: " + convertToText((LENGTH * HEIGHT - numWalls) / (LENGTH * HEIGHT) * 100) + "%")
}

function printMaze(player: number[]) {
    for (let s of elements) s.delete()
    elements = []
    let playerx = player[0]
    let playery = player[1]
    for (let ledx = 0, searchx = playerx - 2; ledx < 5; ledx++ , searchx++) {
        for (let ledy = 0, searchy = playery - 2; ledy < 5; ledy++ , searchy++) {
            if (!inBounds(searchx, searchy)) elements.push(game.createSprite(ledx, ledy))
            else {
                if (maze[searchx][searchy] == STATES.WALL) elements.push(game.createSprite(ledx, ledy))
                else if (maze[searchx][searchy] == STATES.END) {
                    let end = game.createSprite(ledx, ledy)
                    end.set(LedSpriteProperty.Brightness, 200)
                    end.setBlink(500)
                    elements.push(end)
                }
            }
        }
    }
}

function isValidMove(player: number[], changex: number, changey: number): boolean {
    let newx = player[0] + changex
    let newy = player[1] + changey
    if (!inBounds(newx, newy)) return false
    else if (maze[newx][newy] == STATES.WALL) return false
    else return true
}

function isAWin(player: number[]): boolean {
    return maze[player[0]][player[1]] == STATES.END
}

function congratulatePlayer() {
    game.pause()
    basic.clearScreen()
    basic.showString("You Win!", 100)
    basic.showString("Moves made: ", 100)
    basic.showNumber(numMoves)
}

function toCoord(coordList: number[]): string {
    return convertToText(coordList[0]) + ", " + convertToText(coordList[1])
}

function inBounds(x: number, y: number): boolean {
    return !(x < 0 || x >= LENGTH || y < 0 || y >= HEIGHT)
}

function solve(player: number[], end: number[], animate: boolean = true, logging: boolean = true) {
    let shortestPathFromStart: number[][] = []
    prepareArray(shortestPathFromStart, LENGTH, HEIGHT, -1)
    let bfsqueue: number[][] = [[player[0], player[1], 0]]
    let colsearch = [0, 0, 1, -1]
    let rowsearch = [1, -1, 0, 0]
    let endx = end[0], endy = end[1]
    while (bfsqueue.length != 0) {
        let currnode = bfsqueue.shift()
        let currentx = currnode[0], currenty = currnode[1], fromstart = currnode[2]
        if (shortestPathFromStart[currentx][currenty] != -1) continue
        else {
            shortestPathFromStart[currentx][currenty] = fromstart
            if (currentx == endx && currenty == endy) break
            for (let l = 0; l < 4; l++) {
                if (inBounds(currentx + rowsearch[l], currenty + colsearch[l]) && maze[currentx + rowsearch[l]][currenty + colsearch[l]] != STATES.WALL) {
                    bfsqueue.push([currentx + rowsearch[l], currenty + colsearch[l], fromstart + 1])
                }
            }
        }
    }
    let path: number[][] = [[endx, endy]]
    let dist = shortestPathFromStart[endx][endy]
    if (logging) console.log("Shortest distance to ending point: " + convertToText(dist))
    if (animate) {
        while (dist > 0) {
            for (let m = 0; m < 4; m++) {
                let prevnode = path[path.length - 1]
                let prevx = prevnode[0], prevy = prevnode[1]
                if (inBounds(prevx + rowsearch[m], prevy + colsearch[m]) && shortestPathFromStart[prevx + rowsearch[m]][prevy + colsearch[m]] == dist - 1) {
                    path.push([prevx + rowsearch[m], prevy + colsearch[m]])
                    dist--
                    break
                }
            }
        }
        solving = true
        while (!(path.length == 0)) {
            let nextnode = path.pop()
            let nextx = nextnode[0], nexty = nextnode[1]
            player[0] = nextx
            player[1] = nexty
            printMaze(player)
            basic.pause(500)
        }
        solving = false
        won = true
        congratulatePlayer()
    }
}

function updateGameState(player: number[]) {
    numMoves++
    if (isAWin(player)) {
        won = true
        congratulatePlayer()
    } else {
        printMaze(player)
    }
}

input.onButtonPressed(Button.A, function () { // move down
    if (!won && !solving && isValidMove(player, 0, +1)) {
        player[1] += 1
        updateGameState(player)
    }
})
input.onButtonPressed(Button.B, function () { // move up
    if (!won && !solving && isValidMove(player, 0, -1)) {
        player[1] -= 1
        updateGameState(player)
    }
})

input.onGesture(Gesture.TiltLeft, function () { // move left
    if (!won && !solving && isValidMove(player, -1, 0)) {
        player[0] -= 1
        numMoves += 1
        updateGameState(player)
    }
})

input.onGesture(Gesture.TiltRight, function () { // move right
    if (!won && !solving && isValidMove(player, 1, 0)) {
        player[0] += 1
        updateGameState(player)
    }
})

input.onButtonPressed(Button.AB, function () {
    if (!won) solve(player, endingPoint, true, false)
    else if (solving) { /* do nothing */ }
    else {
        game.resume()
        initAndStartGame()
    }
})

initAndStartGame()

