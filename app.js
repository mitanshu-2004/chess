const chessboard = document.querySelector(".chessboard");
let can_en_passant = null;
let player = "l";

const promotionModal = document.createElement("div");
promotionModal.style.display = "none";
promotionModal.style.position = "fixed";
promotionModal.style.top = "50%";
promotionModal.style.left = "50%";
promotionModal.style.transform = "translate(-50%, -50%)";
promotionModal.style.backgroundColor = "#fff";
promotionModal.style.padding = "20px";
promotionModal.style.borderRadius = "10px";
promotionModal.style.boxShadow = "0 0 10px rgba(0,0,0,0.5)";
promotionModal.style.zIndex = "1000";
document.body.appendChild(promotionModal);

// Create backdrop
const backdrop = document.createElement("div");
backdrop.style.display = "none";
backdrop.style.position = "fixed";
backdrop.style.top = "0";
backdrop.style.left = "0";
backdrop.style.width = "100%";
backdrop.style.height = "100%";
backdrop.style.backgroundColor = "rgba(0,0,0,0.5)";
backdrop.style.zIndex = "999";
document.body.appendChild(backdrop);

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
                        available_moves.push([r, c]);
                    }
                    break;
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

        // Normal forward moves
        if (squares[(row + direction) * 8 + col].children.length === 0) {
            available_moves.push([row + direction, col]);
            if (row === startRow && squares[(row + 2 * direction) * 8 + col].children.length === 0) {
                available_moves.push([row + 2 * direction, col]);
            }
        }

        // Normal captures
        for (let dc of [-1, 1]) {
            let captureCol = col + dc;
            if (captureCol >= 0 && captureCol < 8) {
                let captureSquare = squares[(row + direction) * 8 + captureCol];
                if (captureSquare.children.length > 0 && captureSquare.children[0].dataset.color !== colour) {
                    available_moves.push([row + direction, captureCol]);
                }
            }
        }

        // En passant
        if (can_en_passant) {
            const [enPassantRow, enPassantCol] = can_en_passant;
            if (row === enPassantRow && Math.abs(col - enPassantCol) === 1) {
                available_moves.push([row + direction, enPassantCol]);
            }
        }
    }

    else if (piece_type === "rook") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1]], -1);
    }

    else if (piece_type === "bishop") {
        add_moves([[-1, -1], [-1, 1], [1, -1], [1, 1]], -1);
    }

    else if (piece_type === "queen") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]], -1);
    }

    else if (piece_type === "knight") {
        let moves = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2]];
        for (let [dx, dy] of moves) {
            let r = position[0] + dx, c = position[1] + dy;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                let targetSquare = squares[r * 8 + c];
                if (targetSquare.children.length === 0 || targetSquare.children[0].dataset.color !== colour) {
                    available_moves.push([r, c]);
                }
            }
        }
    }

    else if (piece_type === "king") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]], 1);
        
        const baseRow = colour === "l" ? 0 : 7;
        if (position[0] === baseRow && position[1] === 4) {
            const king = squares[baseRow * 8 + 4].children[0];
            if (king && king.dataset.moved === "false") {
                // Kingside castling
                const kingsideRook = squares[baseRow * 8 + 7].children[0];
                if (kingsideRook && 
                    kingsideRook.dataset.type === "rook" && 
                    kingsideRook.dataset.moved === "false" &&
                    !squares[baseRow * 8 + 5].children.length &&
                    !squares[baseRow * 8 + 6].children.length) {
                    available_moves.push([baseRow, 6]);
                }
                
                // Queenside castling
                const queensideRook = squares[baseRow * 8 + 0].children[0];
                if (queensideRook && 
                    queensideRook.dataset.type === "rook" && 
                    queensideRook.dataset.moved === "false" &&
                    !squares[baseRow * 8 + 1].children.length &&
                    !squares[baseRow * 8 + 2].children.length &&
                    !squares[baseRow * 8 + 3].children.length) {
                    available_moves.push([baseRow, 2]);
                }
            }
        }
    }

    return available_moves;
}

document.querySelectorAll(".square").forEach(square => {
    square.addEventListener("click", async (event) => {
        const piece = event.target.closest("i");
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (!selectedPiece && piece) {
            if (piece.dataset.color != player) {
                return;
            }
            selectedPiece = piece;
            selectedPos = { row, col };

            document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture"));
            square.classList.add("highlight");

            cursorPiece.className = `cursor-piece fa-solid ${selectedPiece.classList[1]}`;
            cursorPiece.style.color = selectedPiece.style.color;

            let availableMoves = return_moves(selectedPiece.dataset.type, selectedPiece.dataset.color, [row, col]);
            availableMoves.forEach(([r, c]) => {
                const targetSquare = document.querySelector(`.square[data-row='${r}'][data-col='${c}']`);
                if (targetSquare.children.length > 0 ) {
                    targetSquare.classList.add("can-capture");
                } 
                else if(targetSquare.children.length == 0 &&
                    (selectedPiece.dataset.type === "pawn" && c !== col)){
                        if(selectedPiece.dataset.color=="l"){
                            document.querySelector(`.square[data-row='${r-1}'][data-col='${c}']`).classList.add("can-capture");
                            targetSquare.classList.add("can-move");
                        }
                        else if(selectedPiece.dataset.color=="d"){
                            document.querySelector(`.square[data-row='${r+1}'][data-col='${c}']`).classList.add("can-capture");
                            targetSquare.classList.add("can-move");
                        }
                        
                    }
                else {
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

            if (validMove) {
                // Handle castling moves
                if (selectedPiece.dataset.type === "king" && Math.abs(selectedPos.col - col) === 2) {
                    const baseRow = selectedPiece.dataset.color === "l" ? 0 : 7;
                    if (col === 6) {
                        const rook = document.querySelector(`.square[data-row='${baseRow}'][data-col='7']`).children[0];
                        document.querySelector(`.square[data-row='${baseRow}'][data-col='5']`).appendChild(rook);
                        rook.dataset.moved = "true";
                    }
                    else if (col === 2) {
                        const rook = document.querySelector(`.square[data-row='${baseRow}'][data-col='0']`).children[0];
                        document.querySelector(`.square[data-row='${baseRow}'][data-col='3']`).appendChild(rook);
                        rook.dataset.moved = "true";
                    }
                }

                // Handle en passant capture
                if (selectedPiece.dataset.type === "pawn" && 
                    Math.abs(selectedPos.col - col) === 1 && 
                    square.children.length === 0) {
                    const capturedPawnRow = selectedPos.row;
                    const capturedPawnCol = col;
                    const capturedPawnSquare = document.querySelector(
                        `.square[data-row='${capturedPawnRow}'][data-col='${capturedPawnCol}']`
                    );
                    if (capturedPawnSquare.children.length > 0 && 
                        capturedPawnSquare.children[0].dataset.type === "pawn") {
                        capturedPawnSquare.children[0].remove();
                    }
                }

                // Move piece to new square
                if (square.children.length > 0) {
                    square.children[0].remove();
                }
                square.appendChild(selectedPiece);
                
                if (selectedPiece.dataset.type === "pawn" && 
                    ((selectedPiece.dataset.color === "l" && row === 7) || 
                     (selectedPiece.dataset.color === "d" && row === 0))) {
                    
                    // Show promotion modal
                    promotionModal.innerHTML = `
                        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px;">
                            <i class="fa-solid ${pieces.queen}" style="font-size: 2em; cursor: pointer; color: ${selectedPiece.style.color}"></i>
                            <i class="fa-solid ${pieces.rook}" style="font-size: 2em; cursor: pointer; color: ${selectedPiece.style.color}"></i>
                            <i class="fa-solid ${pieces.bishop}" style="font-size: 2em; cursor: pointer; color: ${selectedPiece.style.color}"></i>
                            <i class="fa-solid ${pieces.knight}" style="font-size: 2em; cursor: pointer; color: ${selectedPiece.style.color}"></i>
                        </div>
                    `;
                    promotionModal.style.display = "block";
                    backdrop.style.display = "block";

                    // Wait for promotion piece selection
                    const promotionPiece = await new Promise(resolve => {
                        const pieces = promotionModal.querySelectorAll("i");
                        pieces.forEach(piece => {
                            piece.addEventListener("click", () => {
                                const pieceType = piece.classList[1].replace("fa-chess-", "");
                                resolve(pieceType);
                            });
                        });
                    });

                    // Hide modal
                    promotionModal.style.display = "none";
                    backdrop.style.display = "none";

                    // Create new promoted piece
                    selectedPiece.dataset.type = promotionPiece;
                    selectedPiece.className = `fa-solid ${pieces[promotionPiece]}`;
                }

                selectedPiece.dataset.moved = "true";

                // Update en passant possibility
                if (selectedPiece.dataset.type === "pawn" && 
                    Math.abs(selectedPos.row - row) === 2) {
                    can_en_passant = [row, col];
                } else {
                    can_en_passant = null;
                }

                // Switch players
                player = player === "l" ? "d" : "l";
            }

            document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture"));
            selectedPiece = null;
            selectedPos = null;
            cursorPiece.className = "cursor-piece fa-solid";
        }
    });
});