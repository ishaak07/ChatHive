import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import './Connect4Game.css';

const ROWS = 6;
const COLS = 7;

const createEmptyBoard = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

function Connect4Game({ opponent, onClose }) {
  const [board, setBoard] = useState(createEmptyBoard());
  const [myTurn, setMyTurn] = useState(false);
  const [winner, setWinner] = useState(null);
  const [isDraw, setIsDraw] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket();

  const myColor = opponent.isInviter ? 'yellow' : 'red';
 
  useEffect(() => {
    setMyTurn(opponent.isInviter ? false : true);
  }, [opponent]);

  useEffect(() => {
    if (!socket) return;

    const handleMoveReceived = ({ board: newBoard, currentPlayer }) => {
      setBoard(newBoard);
      setMyTurn(true);
      checkGameEnd(newBoard);
    };

    const handleRestarted = () => {
      setBoard(createEmptyBoard());
      setWinner(null);
      setIsDraw(false);
      setMyTurn(opponent.isInviter ? false : true);
    };

    socket.on('gameMoveReceived', handleMoveReceived);
    socket.on('gameRestarted', handleRestarted);

    return () => {
      socket.off('gameMoveReceived', handleMoveReceived);
      socket.off('gameRestarted', handleRestarted);
    };
  }, [socket, opponent]);

  const checkWinner = (b, color) => {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] === color && b[r][c + 1] === color && b[r][c + 2] === color && b[r][c + 3] === color) return true;
      }
    }
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c < COLS; c++) {
        if (b[r][c] === color && b[r + 1][c] === color && b[r + 2][c] === color && b[r + 3][c] === color) return true;
      }
    }
    for (let r = 0; r <= ROWS - 4; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] === color && b[r + 1][c + 1] === color && b[r + 2][c + 2] === color && b[r + 3][c + 3] === color) return true;
      }
    }
    for (let r = 3; r < ROWS; r++) {
      for (let c = 0; c <= COLS - 4; c++) {
        if (b[r][c] === color && b[r - 1][c + 1] === color && b[r - 2][c + 2] === color && b[r - 3][c + 3] === color) return true;
      }
    }
    return false;
  };

  const checkGameEnd = (b) => {
    if (checkWinner(b, 'red')) {
      setWinner('red');
    } else if (checkWinner(b, 'yellow')) {
      setWinner('yellow');
    } else if (b.every((row) => row.every((cell) => cell !== null))) {
      setIsDraw(true);
    }
  };

  const handleColumnClick = (col) => {
    if (!myTurn || winner || isDraw) return;
    let targetRow = -1;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r][col] === null) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) return; 

    const newBoard = board.map((row) => [...row]);
    newBoard[targetRow][col] = myColor;

    setBoard(newBoard);
    setMyTurn(false);
    checkGameEnd(newBoard);

    socket.emit('gameMove', {
      toUserId: opponent._id,
      board: newBoard,
      column: col,
      row: targetRow,
    });
  };

  const handleRestart = () => {
    setBoard(createEmptyBoard());
    setWinner(null);
    setIsDraw(false);
    setMyTurn(opponent.isInviter ? false : true);
    socket.emit('gameRestart', { toUserId: opponent._id });
  };

  return (
    <div className="connect4-overlay">
      <div className="connect4-modal">
        <div className="connect4-header">
          <h3>🔴🟡 Connect 4 vs {opponent.username}</h3>
          <button onClick={onClose}>×</button>
        </div>

        <div className="connect4-status">
          {winner ? (
            <p className="game-result">
              {winner === myColor ? '🎉 You Won!' : `😔 ${opponent.username} Won!`}
            </p>
          ) : isDraw ? (
            <p className="game-result">🤝 It's a Draw!</p>
          ) : (
            <p>{myTurn ? "Your turn" : `${opponent.username}'s turn`}</p>
          )}
        </div>

        <div className="connect4-board">
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="connect4-row">
              {row.map((cell, colIndex) => (
                <div
                  key={colIndex}
                  className="connect4-cell"
                  onClick={() => handleColumnClick(colIndex)}
                >
                  <div className={`connect4-disc ${cell || 'empty'}`}></div>
                </div>
              ))}
            </div>
          ))}
        </div>

        {(winner || isDraw) && (
          <button className="restart-btn" onClick={handleRestart}>
            Play Again
          </button>
        )}
      </div>
    </div>
  );
}

export default Connect4Game;