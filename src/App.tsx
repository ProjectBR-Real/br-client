import { useState, useEffect } from 'react';
import { useGameState } from './hooks/useGameState';
import { PlayerCard } from './components/PlayerCard';
import { executeAction, startInteraction, cancelInteraction } from './api';

function App() {
  const [gameId, setGameId] = useState<string | null>(null);

  // Target Selection State is now handled by gameState.pending_interaction

  const [visibleMessage, setVisibleMessage] = useState<{ content: string; duration?: number } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gid = params.get('game_id');
    if (gid) {
      setGameId(gid);
    }
  }, []);

  const { gameState, error, loading, refresh } = useGameState(gameId);

  const [actionPopup, setActionPopup] = useState<{
    type: 'shoot' | 'item';
    source: string;
    target?: string;
    item?: string;
    result: string;
  } | null>(null);

  const [lastActionTimestamp, setLastActionTimestamp] = useState<number>(0);

  useEffect(() => {
    if (gameState?.messages && gameState.messages.length > 0) {
      const lastMsg = gameState.messages[gameState.messages.length - 1];
      setVisibleMessage(lastMsg);

      if (lastMsg.duration) {
        const timer = setTimeout(() => {
          setVisibleMessage(null);
        }, lastMsg.duration * 1000);
        return () => clearTimeout(timer);
      }
    }
  }, [gameState?.messages]);

  // Watch for last_action updates
  useEffect(() => {
    if (gameState?.last_action && gameState.last_action.timestamp > lastActionTimestamp) {
      setLastActionTimestamp(gameState.last_action.timestamp);
      setActionPopup(gameState.last_action);
    }
  }, [gameState?.last_action, lastActionTimestamp]);

  // Auto-dismiss popup
  useEffect(() => {
    if (actionPopup) {
      const timer = setTimeout(() => {
        setActionPopup(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionPopup]);

  const handleAction = async (action: string, targetId?: number, itemName?: string) => {
    if (!gameId || !gameState) return;

    // If using handcuffs, enter selection mode via API
    if (action === 'use_item' && itemName === 'handcuffs') {
      try {
        await startInteraction(gameId, itemName);
        refresh();
      } catch (err) {
        console.error("Failed to start interaction:", err);
      }
      return;
    }

    // Otherwise execute immediately
    try {
      await executeAction(gameId, action, targetId, itemName);
      refresh(); // Refresh state immediately
    } catch (err) {
      console.error("Action failed:", err);
      alert("Action failed");
    }
  };

  const handleTargetSelect = async (targetId: number) => {
    if (!gameId || !gameState?.pending_interaction) return;

    try {
      await executeAction(gameId, 'use_item', targetId, gameState.pending_interaction.item);
      refresh();
    } catch (err) {
      console.error("Action failed:", err);
      alert("Action failed");
    }
  };

  const handleCancelInteraction = async () => {
    if (!gameId) return;
    try {
      await cancelInteraction(gameId);
      refresh();
    } catch (err) {
      console.error("Failed to cancel:", err);
    }
  };

  if (!gameId) {
    return (
      <div className="container" style={{ marginTop: '100px' }}>
        <h1>Buckshot Roulette Tablet</h1>
        <p>Please provide a game_id in the URL.</p>
        <code>/?game_id=123</code>
      </div>
    );
  }

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (error) {
    return <div className="container" style={{ color: 'red' }}>{error}</div>;
  }

  if (!gameState) return null;

  return (
    <div className="container">
      <div className="game-header">
        <h1 className="game-title">ROUND {gameState.round}</h1>
        <div className="game-info">
          <span>
            Current Turn: <strong>PLAYER {gameState.players[gameState.current_player_index]?.id} ({gameState.players[gameState.current_player_index]?.name || `Player ${gameState.players[gameState.current_player_index]?.id}`})</strong>
          </span>
        </div>
      </div>

      {/* Shotgun Status */}
      <div className="shotgun-status">
        <div className="shell-count live">
          <span>LIVE</span>
          <strong>{gameState.shotgun.live_shells}</strong>
        </div>
        <div className="shell-count blank">
          <span>BLANK</span>
          <strong>{gameState.shotgun.blank_shells}</strong>
        </div>
        {gameState.shotgun.is_sawed_off && <div className="sawed-off-badge">SAWED OFF</div>}
      </div>

      {/* Broadcast Message Overlay */}
      {visibleMessage && (
        <div className="broadcast-message-container">
          <div className="broadcast-message">
            <div className="broadcast-label">INCOMING MESSAGE</div>
            <div className="broadcast-content">{visibleMessage.content}</div>
            <button className="close-msg-btn" onClick={() => setVisibleMessage(null)}>CLOSE</button>
          </div>
        </div>
      )}

      {gameState.pending_interaction && (
        <div className="target-selection-overlay">
          <h2 style={{ color: '#f1c40f' }}>SELECT TARGET FOR {gameState.pending_interaction.item.toUpperCase()}</h2>
          <button
            className="cancel-btn"
            onClick={handleCancelInteraction}
          >
            CANCEL
          </button>
        </div>
      )}

      <div className="players-grid">
        {gameState.players.map((player) => {
          const isTargetable = !!gameState.pending_interaction && player.id !== gameState.pending_interaction.source;
          const isCurrentTurn = gameState.players[gameState.current_player_index]?.id === player.id;

          return (
            <PlayerCard
              key={player.id}
              player={player}
              isCurrentTurn={isCurrentTurn}
              onAction={handleAction}
              isTargetable={isTargetable}
              onSelectTarget={() => handleTargetSelect(player.id)}
            />
          );
        })}
      </div>

      {/* Action Popup */}
      {actionPopup && (
        <div className="action-popup-container">
          <div className={`action-popup ${actionPopup.type === 'item' ? 'item-use' : ''}`}>
            <div className="action-source">{actionPopup.source}</div>
            <div className="action-main">
              {actionPopup.type === 'shoot' ? (
                <>SHOOTS {actionPopup.target}</>
              ) : (
                <>USES {actionPopup.item}</>
              )}
            </div>
            <div className="action-result">{actionPopup.result}</div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {gameState.is_game_over && (
        <div className="game-over-overlay">
          <div className="game-over-content">
            <div className="game-over-title">GAME OVER</div>
            {gameState.winner ? (
              <div className="winner-name">WINNER: {gameState.winner.name}</div>
            ) : (
              <div className="winner-name">DRAW</div>
            )}
            <div className="winner-id">PLAYER {gameState.winner?.id}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
