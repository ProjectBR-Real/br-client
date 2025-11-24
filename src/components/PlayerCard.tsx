import React from 'react';
import { type Player } from '../api';
import { Heart } from 'lucide-react';

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
                <div style={{ fontSize: '0.6em', color: '#bdc3c7' }}>{player.name}</div>
            </div>

            <div className="lives-container">
                {Array.from({ length: Math.max(player.lives, player.max_lives || 0) }).map((_, i) => (
                    <Heart
                        key={i}
                        className="life-icon"
                        fill={i < player.lives ? "#e74c3c" : "none"}
                        stroke={i < player.lives ? "#e74c3c" : "#7f8c8d"}
                    />
                ))}
            </div>

            {player.items.length > 0 && (
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
            )}

            {isCurrentTurn && (
                <div style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: '10px' }}>YOUR TURN</div>
            )}

            {isTargetable && (
                <div style={{ color: '#f1c40f', fontWeight: 'bold', marginTop: '10px' }}>SELECT TARGET</div>
            )}

            {player.is_skipped && (
                <div className="handcuffed-badge">HANDCUFFED</div>
            )}
        </div>
    );
};
