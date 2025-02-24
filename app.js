const chessboard = document.querySelector(".chessboard");
let can_en_passant = null;
let player = "l";
let inCheck = { l: false, d: false };

// Promotion Modal & Backdrop
const promotionModal = document.createElement("div");
promotionModal.style.cssText = `display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background-color: #fff; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.5); z-index: 1000;`;
document.body.appendChild(promotionModal);

const backdrop = document.createElement("div");
backdrop.style.cssText = `display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0,0,0,0.5); z-index: 999;`;
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

let squares = [];
for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
        const square = document.createElement("div");
        square.classList.add("square", (i + j) % 2 === 0 ? "light" : "dark");
        square.dataset.row = i;
        square.dataset.col = j;
        chessboard.appendChild(square);
        squares.push(square);
    }
}

function spawn_pieces(board) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const pieceName = board[i][j];
            if (pieceName !== " ") {
                const piece = document.createElement("i");
                piece.classList.add("fa-solid", pieces[pieceName.slice(0, -1)]);
                piece.style.color = pieceName.slice(-1) === "l" ? "#a0887b" : "#000000";
                piece.dataset.type = pieceName.slice(0, -1);
                piece.dataset.color = pieceName.slice(-1);
                piece.dataset.moved = "false";
                squares[i * 8 + j].appendChild(piece);
            }
        }
    }
}

spawn_pieces(boardSetup);

function return_moves(piece_type, colour, position) {
    let available_moves = [];

    function add_moves(directions, limit) {
        let r = parseInt(position[0]);
        let c = parseInt(position[1]);

        for (const [dx, dy] of directions) {
            let steps = 0;
            let newR = r + dx;
            let newC = c + dy;

            while (newR >= 0 && newR < 8 && newC >= 0 && newC < 8 && (limit === -1 || steps < limit)) {
                const targetSquare = squares[newR * 8 + newC];
                const targetPiece = targetSquare.firstChild;

                if (!targetPiece) {
                    available_moves.push([newR, newC]);
                } else {
                    if (targetPiece.dataset.color !== colour) {
                        available_moves.push([newR, newC]);
                    }
                    break;
                }
                newR += dx;
                newC += dy;
                steps++;
            }
        }
    }

    if (piece_type === "pawn") {
        let direction = colour === "l" ? 1 : -1;
        let startRow = colour === "l" ? 1 : 6;
        let row = parseInt(position[0]), col = parseInt(position[1]);

        if (row + direction >= 0 && row + direction < 8 && squares[(row + direction) * 8 + col].firstChild === null) {
            available_moves.push([row + direction, col]);
            if (row === startRow && row + 2 * direction >= 0 && row + 2 * direction < 8 && squares[(row + 2 * direction) * 8 + col].firstChild === null) {
                available_moves.push([row + 2 * direction, col]);
            }
        }

        for (let dc of [-1, 1]) {
            let captureCol = col + dc;
            if (captureCol >= 0 && captureCol < 8 && row + direction >= 0 && row + direction < 8) {
                let captureSquare = squares[(row + direction) * 8 + captureCol];
                if (captureSquare.firstChild && captureSquare.firstChild.dataset.color !== colour) {
                    available_moves.push([row + direction, captureCol]);
                }
            }
        }

        if (can_en_passant) {
            const [enPassantRow, enPassantCol] = can_en_passant;
            if (row === enPassantRow && Math.abs(col - enPassantCol) === 1) {
                available_moves.push([row + direction, enPassantCol]);
            }
        }
    } else if (piece_type === "rook") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1]], -1);
    } else if (piece_type === "bishop") {
        add_moves([[-1, -1], [-1, 1], [1, -1], [1, 1]], -1);
    } else if (piece_type === "queen") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]], -1);
    } else if (piece_type === "knight") {
        let moves = [[-2, -1], [-2, 1], [2, -1], [2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2]];
        for (let [dx, dy] of moves) {
            let r = parseInt(position[0]) + dx, c = parseInt(position[1]) + dy;
            if (r >= 0 && r < 8 && c >= 0 && c < 8) {
                let targetSquare = squares[r * 8 + c];
                if (!targetSquare.firstChild || targetSquare.firstChild.dataset.color !== colour) {
                    available_moves.push([r, c]);
                }
            }
        }
    } else if (piece_type === "king") {
        add_moves([[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [-1, 1], [1, -1], [1, 1]], 1);

        const baseRow = colour === "l" ? 0 : 7;
        if (parseInt(position[0]) === baseRow && parseInt(position[1]) === 4) {
            const king = squares[baseRow * 8 + 4].firstChild;
            if (king && king.dataset.moved === "false") {
                const kingsideRook = squares[baseRow * 8 + 7].firstChild;
                if (kingsideRook && kingsideRook.dataset.type === "rook" && kingsideRook.dataset.moved === "false" && !squares[baseRow * 8 + 5].firstChild && !squares[baseRow * 8 + 6].firstChild) {
                    available_moves.push([baseRow, 6]);
                }

                const queensideRook = squares[baseRow * 8 + 0].firstChild;
                if (queensideRook && kingsideRook.dataset.type === "rook" && queensideRook.dataset.moved === "false" && !squares[baseRow * 8 + 1].firstChild && !squares[baseRow * 8 + 2].firstChild && !squares[baseRow * 8 + 3].firstChild) {
                    available_moves.push([baseRow, 2]);
                }
            }
        }
    }

    return available_moves;
}

function isKingInCheck(color) {
    const kingPos = findKing(color);
    if (!kingPos) return false;

    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = squares[i * 8 + j].firstChild;
            if (piece && piece.dataset.color !== color) {
                const moves = return_moves(piece.dataset.type, piece.dataset.color, [i, j]);
                if (moves.some(move => move[0] === kingPos[0] && move[1] === kingPos[1])) {
                    return true;
                }
            }
        }
    }
    return false;
}

function findKing(color) {
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            const piece = squares[i * 8 + j].firstChild;
            if (piece && piece.dataset.type === "king" && piece.dataset.color === color) {
                return [i, j];
            }
        }
    }
    return null;
}

document.querySelectorAll(".square").forEach(square => {
    square.addEventListener("click", async (event) => {
        const piece = event.target.closest("i");
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (!selectedPiece && piece) {
            if (piece.dataset.color !== player) return;

            selectedPiece = piece;
            selectedPos = { row, col };

            document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture"));
            square.classList.add("highlight");

            cursorPiece.className = `cursor-piece fa-solid ${selectedPiece.classList[1]}`;
            cursorPiece.style.color = selectedPiece.style.color;

            const availableMoves = return_moves(selectedPiece.dataset.type, selectedPiece.dataset.color, [row, col]);

            availableMoves.forEach(([r, c]) => {
                const targetSquare = squares[r * 8 + c];
                if (targetSquare.firstChild) {
                    targetSquare.classList.add("can-capture");
                } else if (selectedPiece.dataset.type === "pawn" && c !== col) {
                    if (selectedPiece.dataset.color === "l") {
                        const enPassantSquare = squares[(r - 1) * 8 + c];
                        if (enPassantSquare) {
                            enPassantSquare.classList.add("can-capture");
                        }
                        targetSquare.classList.add("can-move");
                    } else if (selectedPiece.dataset.color === "d") {
                        const enPassantSquare = squares[(r + 1) * 8 + c];
                        if (enPassantSquare) {
                            enPassantSquare.classList.add("can-capture");
                        }
                        targetSquare.classList.add("can-move");
                    }
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

            const availableMoves = return_moves(selectedPiece.dataset.type, selectedPiece.dataset.color, [selectedPos.row, selectedPos.col]);
            const validMove = availableMoves.some(move => move[0] === row && move[1] === col);

            if (validMove) {
                const originalSquare = squares[selectedPos.row * 8 + selectedPos.col];
                const targetSquare = squares[row * 8 + col];

                if (selectedPiece.dataset.type === "king" && Math.abs(selectedPos.col - col) === 2) {
                    const baseRow = selectedPiece.dataset.color === "l" ? 0 : 7;
                    if (col === 6) {
                        const rook = squares[baseRow * 8 + 7].firstChild;
                        squares[baseRow * 8 + 5].appendChild(rook);
                        rook.dataset.moved = "true";
                    } else if (col === 2) {
                        const rook = squares[baseRow * 8 + 0].firstChild;
                        squares[baseRow * 8 + 3].appendChild(rook);
                        rook.dataset.moved = "true";
                    }
                }

                if (selectedPiece.dataset.type === "pawn" && Math.abs(selectedPos.col - col) === 1 && targetSquare.firstChild === null) {
                    const capturedPawnRow = selectedPos.row;
                    const capturedPawnCol = col;
                    const capturedPawnSquare = squares[capturedPawnRow * 8 + capturedPawnCol];
                    if (capturedPawnSquare.firstChild && capturedPawnSquare.firstChild.dataset.type === "pawn") {
                        capturedPawnSquare.firstChild.remove();
                    }
                }

                if (targetSquare.firstChild) {
                    targetSquare.firstChild.remove();
                }
                targetSquare.appendChild(selectedPiece);
                document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture","king-capture"));
                

                if (selectedPiece.dataset.type === "pawn" && (
                    (selectedPiece.dataset.color === "l" && row === 7) ||
                    (selectedPiece.dataset.color === "d" && row === 0)
                )) {

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

                    const promotionPiece = await new Promise(resolve => {
                        const pieces = promotionModal.querySelectorAll("i");
                        pieces.forEach(piece => {
                            piece.addEventListener("click", () => {
                                const pieceType = piece.classList[1].replace("fa-chess-", "");
                                resolve(pieceType);
                            });
                        });
                    });

                    promotionModal.style.display = "none";
                    backdrop.style.display = "none";

                    selectedPiece.dataset.type = promotionPiece;
                    selectedPiece.className= `fa-solid ${pieces[promotionPiece]}`;
                }

                selectedPiece.dataset.moved = "true";

                if (selectedPiece.dataset.type === "pawn" && Math.abs(selectedPos.row - row) === 2) {
                    can_en_passant = [row, col];
                } else {
                    can_en_passant = null;
                }

                if (isKingInCheck(player)) {
                    originalSquare.appendChild(selectedPiece);
                    if (targetSquare.firstChild) {
                        targetSquare.firstChild.remove();
                    }
                    selectedPiece = null;
                    selectedPos = null;
                    cursorPiece.className = "cursor-piece fa-solid";
                    document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture","king-capture"));
                    return;
                }

                player = player === "l" ? "d" : "l";
                inCheck[player] = isKingInCheck(player);
                if (inCheck[player]) {
                    const poss=findKing(player);
                    document.querySelectorAll(".square")[poss[0]*8+poss[1]].classList.add("king-capture");
                }


            }

            document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight", "can-move", "can-capture"));
            selectedPiece = null;
            selectedPos = null;
            cursorPiece.className = "cursor-piece fa-solid";
        }
    });
});