# Minesweeper

This is my implementation of minesweeper written in pure JavaScript. I tried to imitate the Windows version of it.

I was studying some graph algorithms when I was reminded of playing this game back in the good ol' days when I used to use Windows.

Play [HERE](https://mcw-minesweeper.herokuapp.com/minesweeperDisplay.html). 

**WARNING**: ONLY TESTED ON GOOGLE CHROME!!

### Supported Clicks
- First click is always safe! This means the first click will never be a mine.
- **Left click**: Make a cell visible. If a left-clicked cell is not a mine, it will be either a number, indicating the number of surrounding mines or an empty cell, which means flooding will happen.
- **Right click**: Mark as mine/flag, question mark, or as nothing.
- **Left+right click**:  Used to open up more cells if mines surrounding the cell clicked have been correctly marked. If mines surrounding the cell have not all been found, surrounding cells will be highlighted.
- **Middle click**: Similar to left+right click for opening up cells, but this is an alternative for laptops in which simultaneous left and right click is not possible.

### Levels- Grid Size (width x height) & Number of Mines
- **Beginner**: 9 x 9 grid, 10 mines
- **Intermediate**: 16 x 16 grid, 40 mines
- **Expert**: 30 x 16 grid, 99 mines