import React from 'react';
import { type Player } from '../api';

interface PlayerCardProps {
    player: Player;
    isCurrentTurn: boolean;
    onAction?: (action: string, targetId?: number, itemName?: string) => void;
    isTargetable?: boolean;
    onSelectTarget?: () => void;
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
    player,
    isCurrentTurn,
    onAction,
    isTargetable,
    onSelectTarget
}) => {

    const handleCardClick = () => {
        if (isTargetable && onSelectTarget) {
            onSelectTarget();
        }
    };

    return (
        <div
            className={`player-card ${isCurrentTurn ? 'active' : ''} ${player.lives <= 0 ? 'dead' : ''} ${isTargetable ? 'targetable' : ''}`}
            onClick={handleCardClick}
        >
            <div className="player-name">
                PLAYER {player.id}
                <span style={{ fontSize: '0.6em', color: '#666', marginLeft: '10px' }}>{player.name}</span>
            </div>

            <div className="lives-wrapper">
                <span className="lives-label">CCU:</span>
                <div className="lives-container">
                    {Array.from({ length: Math.max(player.lives, player.max_lives || 0) }).map((_, i) => (
                        <div
                            key={i}
                            className={`life-unit ${i < player.lives ? 'active' : ''}`}
                        />
                    ))}
                </div>
            </div>

            {player.items.length > 0 && (
                <>
                    <div className="items-label">INVENTORY:</div>
                    <div className="items-container">
                        {player.items.map((item, i) => (
                            <button
                                key={i}
                                className={`item-badge ${!isCurrentTurn ? 'disabled' : ''}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (isCurrentTurn && onAction) {
                                        onAction('use_item', undefined, item);
                                    }
                                }}
                                disabled={!isCurrentTurn}
                                title={item}
                            >
                                <span className="item-name">{item}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {isCurrentTurn && (
                <div style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    color: '#f1c40f',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    animation: 'blink 1s infinite'
                }}>
                    ▶
                </div>
            )}

            {isTargetable && (
                <div style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: '10px', textAlign: 'center' }}>[ SELECT TARGET ]</div>
            )}

            {player.is_skipped && (
                <div className="handcuffed-badge">HANDCUFFED</div>
            )}
        </div>
    );
};
