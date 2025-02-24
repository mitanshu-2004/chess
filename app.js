const chessboard = document.querySelector(".chessboard");
let can_en_passant=null;
let player="l";

const pieces = {
    "rook": "fa-chess-rook",
    "knight": "fa-chess-knight",
    "bishop": "fa-chess-bishop",
    "queen": "fa-chess-queen",
    "king": "fa-chess-king",
    "pawn": "fa-chess-pawn",
};

let cursorPiece = document.createElement("i");
cursorPiece.classList.add("cursor-piece", "fa-solid");
document.body.appendChild(cursorPiece);

let selectedPiece = null;
let selectedPos = null;

document.addEventListener("mousemove", (e) => {
    cursorPiece.style.left = e.pageX + "px";
    cursorPiece.style.top = e.pageY + "px";
});

const boardSetup = [
    ["rookl", "knightl", "bishopl", "queenl", "kingl", "bishopl", "knightl", "rookl"],
    ["pawnl", "pawnl", "pawnl", "pawnl", "pawnl", "pawnl", "pawnl", "pawnl"],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    [" ", " ", " ", " ", " ", " ", " ", " "],
    ["pawnd", "pawnd", "pawnd", "pawnd", "pawnd", "pawnd", "pawnd", "pawnd"],
    ["rookd", "knightd", "bishopd", "queend", "kingd", "bishopd", "knightd", "rookd"]
];

for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.dataset.row = i;
        square.dataset.col = j;

        if ((i + j) % 2 === 0) {
            square.classList.add("light");
        } else {
            square.classList.add("dark");
        }
        chessboard.appendChild(square);
    }
}

function spawn_pieces(board) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if (board[i][j] !== " ") {
                const piece = document.createElement("i");
                piece.classList.add("fa-solid", pieces[board[i][j].slice(0, -1)]);
                piece.style.color = board[i][j].slice(-1) === "l" ? "#a0887b" : "#000000";
                piece.dataset.type = board[i][j].slice(0, -1);
                piece.dataset.color = board[i][j].slice(-1);
                piece.dataset.moved = "false";

                chessboard.children[i * 8 + j].appendChild(piece);
            }
        }
    }
}
spawn_pieces(boardSetup);

function return_moves(piece_type, colour, position) {
    const squares = document.querySelectorAll(".square");
    let available_moves = [];

    function add_moves(directions, limit) {
        for (let [dx, dy] of directions) {
            let r = position[0] + dx;
            let c = position[1] + dy;
            let steps = 0;

            while (r >= 0 && r < 8 && c >= 0 && c < 8 && (limit === -1 || steps < limit)) {
                let targetSquare = squares[r * 8 + c];

                if (targetSquare.children.length === 0) {
                    available_moves.push([r, c]);
                } else {
                    let targetPiece = targetSquare.children[0];
                    if (targetPiece.dataset.color !== colour) {
                        available_moves.push([r, c]); // Can capture opponent
                    }
                    break; // Stop after hitting any piece
                }
                r += dx;
                c += dy;
                steps++;
            }
        }
    }

    if (piece_type === "pawn") {
        let direction = colour === "l" ? 1 : -1;
        let startRow = colour === "l" ? 1 : 6;
        let row = position[0], col = position[1];

        if (squares[(row + direction) * 8 + col].children.length === 0) {
            available_moves.push([row + direction, col]);
            if (row === startRow && squares[(row + 2 * direction) * 8 + col].children.length === 0) {
                available_moves.push([row + 2 * direction, col]);
            }
        }

        for (let dc of [-1, 1]) {
            let captureCol = col + dc;
            if (captureCol >= 0 && captureCol < 8) {
                let captureSquare = squares[(row + direction) * 8 + captureCol].children[0];
                if (captureSquare && captureSquare.dataset.color !== colour) {
                    available_moves.push([row + direction, captureCol]);
                }
            }
        }
        if(can_en_passant){
            const en_colour=squares[(can_en_passant[0]) * 8 + can_en_passant[1]].children[0].dataset.color;
            if(Math.abs(can_en_passant[1] - col)==1){
                if(en_colour=="l"){
                    available_moves.push([row-1,can_en_passant[1]]);
                }
                if(en_colour=="d"){
                    available_moves.push([row+1,can_en_passant[1]]);
                }
                
            }
        }
    }

    else if (piece_type === "rook") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1]], -1); // Up, Down, Left, Right
    }

    else if (piece_type === "bishop") {
        add_moves([[-1, -1], [-1, 1], [1, -1], [1, 1]], -1); // Diagonal moves
    }

    else if (piece_type === "queen") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]], -1); // Rook + Bishop
    }

    else if (piece_type === "knight") {
        let moves = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2]];
        for (let [dx, dy] of moves) {
            let r = position[0] + dx, c = position[1] + dy;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                let targetSquare = squares[r * 8 + c];
                if (targetSquare.children.length === 0 || targetSquare.children[0].dataset.color !== colour) {
                    available_moves.push([r, c]); // Can move or capture
                }
            }
        }
    }

    else if (piece_type === "king") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]], 1); // One step in all directions
    }

    return available_moves;
}

document.querySelectorAll(".square").forEach(square => {
    square.addEventListener("click", (event) => {
        const piece = event.target.closest("i"); 
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (!selectedPiece && piece) {
            if(piece.dataset.color!=player){
                return;
            }
            selectedPiece = piece;
            selectedPos = { row, col };

            document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture"));
            square.classList.add("highlight");

            cursorPiece.className = `cursor-piece fa-solid ${selectedPiece.classList[1]}`;
            cursorPiece.style.color = selectedPiece.style.color;

            let availableMoves = return_moves(selectedPiece.dataset.type, selectedPiece.dataset.color, [row, col]);
            
            if(can_en_passant){
                const targetSquare = document.querySelector(`.square[data-row='${can_en_passant[0]}'][data-col='${can_en_passant[1]}']`);
                
                const targetSquare_1 = document.querySelector(`.square[data-row='${can_en_passant[0]}'][data-col='${can_en_passant[1]+1}']`);
                
                const targetSquare_2 = document.querySelector(`.square[data-row='${can_en_passant[0]}'][data-col='${can_en_passant[1]-1}']`);
                
                
                if(targetSquare_1==square){
                    targetSquare.classList.add("can-capture");
                }
                else if(targetSquare_2==square){
                    targetSquare.classList.add("can-capture");
                }
            }
            availableMoves.forEach(([r, c]) => {
                const targetSquare = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
                if (targetSquare.children.length > 0) {
                    targetSquare.classList.add("can-capture");
                } else {
                    targetSquare.classList.add("can-move");
                }
            });

        } else if (selectedPiece) {
            if (selectedPos.row === row && selectedPos.col === col) {
                selectedPiece = null;
                selectedPos = null;
                cursorPiece.className = "cursor-piece fa-solid";
                document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture"));
                return;
            }

            let availableMoves = return_moves(selectedPiece.dataset.type, selectedPiece.dataset.color, [selectedPos.row, selectedPos.col]);
            let validMove = availableMoves.some(move => JSON.stringify(move) === JSON.stringify([row, col]));
            if (selectedPiece.dataset.type == "pawn") {
                if (Math.abs(selectedPos.row - row) == 2) {
                    
                    can_en_passant = [row, col];
                } 
                else if(selectedPiece.dataset.type=="pawn" && Math.abs(selectedPos.row - row) == 1 && Math.abs(selectedPos.col - col) == 1 && square.children.length==0) {
                    
                    console.log("Something");
                    let capturedPawnRow = selectedPos.row;
                    let capturedPawnCol = col;
            
                    let capturedPawnSquare = document.querySelector(`.square[data-row='${capturedPawnRow}'][data-col='${capturedPawnCol}']`);
                    if (capturedPawnSquare.children.length > 0 && capturedPawnSquare.children[0].dataset.type == "pawn") {
                        capturedPawnSquare.children[0].remove();
                    }
                    can_en_passant = null; 
                } 
                else {
                    console.log("en removed");
                    can_en_passant = null; 
                }
            }
            
            
            
            if (validMove) {
                if (square.children.length > 0) {
                    square.children[0].remove();
                }
                square.appendChild(selectedPiece);
            }

            document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture"));

            selectedPiece = null;
            selectedPos = null;
            cursorPiece.className = "cursor-piece fa-solid";
            if(player=="l"){
                player="d";
            }
            else if(player=="d"){
                player="l";
            }
            
        }
    });
});
