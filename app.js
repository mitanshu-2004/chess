const chessboard = document.querySelector(".chessboard");
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


for(let i = 0; i < 8; i++) {
    for(let j = 0; j < 8; j++) {
        const square = document.createElement("div");
        square.classList.add("square");
        square.dataset.row = i; // ✅ Store row index
        square.dataset.col = j; // ✅ Store column index

        if ((i + j) % 2 === 0) {
            square.classList.add("light");
        } else {
            square.classList.add("dark");
        }
        chessboard.appendChild(square);
    }
}


function spawn_pieces(board){
    for(let i=0;i<8;i++){
        for(let j=0;j<8;j++){
            if(board[i][j] != " "){
                const piece = document.createElement("i");
                piece.classList.add("fa-solid");
                piece.classList.add(pieces[board[i][j].slice(0,-1)]);
                if(board[i][j].slice(-1)=="l"){
                    piece.style.color="#a0887b";
                }
                else{
                    piece.style.color="#000000"
                }
                piece.dataset.type = board[i][j].slice(0,-1);
                piece.dataset.color = board[i][j].slice(-1);
                piece.dataset.position = [i,j];
                piece.dataset.moved = "false"; 

                chessboard.children[i*8+j].appendChild(piece);
            }
        }
    }
}
spawn_pieces(boardSetup);

function return_moves(piece_selected){
    let moves_list=[]
    const squares=document.querySelectorAll(".square")
    if (piece_selected.dataset.type=="rook"){
        let row=piece_selected.dataset.position.split(',').map(Number)[0];
        let col=piece_selected.dataset.position.split(',').map(Number)[1];
        for(let i=row-1;i>=0;i--){
            if(squares[i*8+col].children.length>0){
                break;
            }
            console.log(i,col);
        }
        for(let i=col-1;i>=0;i--){
            if(squares[row*8+i].children.length>0){
                break;
            }
            console.log(row,i);
            
        }

        for(let i=row+1;i<8;i++){
            if(squares[i*8+col].children.length>0){
                break;
            }
            console.log(i,col);
        }
        for(let i=col+1;i<8;i++){
            if(squares[row*8+i].children.length>0){
                break;
            }
            console.log(row,i);
        }

        
            
    }
}
// const pieces_on_board = document.querySelectorAll(".fa-solid");
// pieces_on_board.forEach(piece =>{
//     piece.addEventListener("click",()=>{

//         console.log(piece.dataset.color);
//         console.log(piece.dataset.type);
//         console.log(piece.dataset.position);
//         console.log(piece.dataset.moved);
        
        
//     });
// });






document.querySelectorAll(".square").forEach(square => {
    square.addEventListener("click", () => {
        const row = parseInt(square.dataset.row);
        const col = parseInt(square.dataset.col);

        if (!selectedPiece) {
            // Selecting a piece
            if (square.children.length > 0) {
                selectedPiece = square.firstChild;
                cursorPiece.className = `cursor-piece fa-solid ${selectedPiece.classList[1]}`;
                cursorPiece.style.color = selectedPiece.style.color;
                selectedPos = { row, col };

                // ✅ Ensure only one highlight is active at a time
                document.querySelectorAll(".square").forEach(sq => sq.classList.remove("highlight"));
                square.classList.add("highlight");
            }
        } else {
            // Moving piece
            const prevSquare = document.querySelector(`[data-row="${selectedPos.row}"][data-col="${selectedPos.col}"]`);

            if (square.children.length === 0) { // Ensure it's an empty square
                if (prevSquare) {
                    prevSquare.classList.remove("highlight"); // ✅ Remove highlight safely
                }
                square.appendChild(selectedPiece);
                cursorPiece.className = "cursor-piece fa-solid";
                selectedPiece = null;
                selectedPos = null;
            }
        }
    });
});
