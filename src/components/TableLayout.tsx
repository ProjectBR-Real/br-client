import React from 'react';
import { PlayerSection } from './PlayerSection';
import type { GameState, Player } from '../api';
import './TableLayout.css';

interface TableLayoutProps {
    gameState: GameState;
    onAction: (action: string, targetId?: number, itemName?: string) => void;
    onSelectTarget: (targetId: number) => void;
    message?: { content: string; duration?: number } | null;
    actionPopup?: {
        type: 'shoot' | 'item';
        source: string;
        target?: string;
        item?: string;
        result: string;
    } | null;
}

export const TableLayout: React.FC<TableLayoutProps> = ({ gameState, onAction, onSelectTarget, message, actionPopup }) => {
    // We assume players are ordered 1-4.
    // Index 0: Bottom (Player 1) - 0 deg
    // Index 1: Left  (Player 2) - 90 deg
    // Index 2: Top   (Player 3) - 180 deg
    // Index 3: Right (Player 4) - 270 deg

    const getPlayer = (id: number) => gameState.players.find(p => p.id === id);

    // Hardcode positions for now based on ID 1-4 standard
    const player1 = getPlayer(1);
    const player2 = getPlayer(2);
    const player3 = getPlayer(3);
    const player4 = getPlayer(4);

    const getRotationForPlayer = (playerId: number) => {
        if (playerId === 1) return 0;
        if (playerId === 2) return 90;
        if (playerId === 3) return 180;
        if (playerId === 4) return 270;
        return 0;
    };

    const getRotationForSource = (sourceName: string) => {
        // Try to match by name (case-insensitive)
        const normalizedSource = sourceName.toLowerCase();
        const player = gameState.players.find(p =>
            p.name.toLowerCase() === normalizedSource ||
            `player ${p.id}` === normalizedSource ||
            `player${p.id}` === normalizedSource
        );

        if (player) {
            return getRotationForPlayer(player.id);
        }
        return 0;
    };

    const renderSection = (player: Player | undefined, rotation: number) => {
        if (!player) return null;

        const isTargetable = !!gameState.pending_interaction && player.id !== gameState.pending_interaction.source;
        const isCurrent = gameState.players[gameState.current_player_index]?.id === player.id;

        return (
            <PlayerSection
                player={player}
                rotation={rotation}
                isCurrent={isCurrent}
                onAction={onAction}
                isTargetable={isTargetable}
                onSelectTarget={() => onSelectTarget(player.id)}
            />
        );
    };

    const renderCenterInfo = () => (
        <div className="center-info-container">
            <div className="round-info">ROUND {gameState.round}</div>
            <div className="shotgun-info">
                <div className="shell-group live">
                    <span className="shell-label">LIVE</span>
                    <span className="shell-value text-red">{gameState.shotgun.live_shells}</span>
                </div>
                <div className="shell-group blank">
                    <span className="shell-label">BLANK</span>
                    <span className="shell-value text-blue">{gameState.shotgun.blank_shells}</span>
                </div>
            </div>
            {gameState.shotgun.is_sawed_off && <div className="sawed-status">SAWED OFF</div>}
        </div>
    );

    return (
        <div className="table-layout">
            <div className="table-center">
                <div className="center-content">
                    {actionPopup ? (
                        <div
                            className="rotation-wrapper"
                            style={{
                                transform: `rotate(${getRotationForSource(actionPopup.source)}deg)`,
                                width: '100%',
                                height: '100%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                        >
                            <div className="central-action-popup">
                                <div className="action-gif-placeholder">
                                    {/* Placeholder for GIF - based on action type/item */}
                                    <div className="gif-box">
                                        [{actionPopup.type === 'shoot' ? 'SHOOT_ANIM' : `USE_${actionPopup.item}_ANIM`}]
                                    </div>
                                </div>
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
                    ) : message ? (
                        <div className="central-message">
                            <div className="msg-title">INCOMING MESSAGE</div>
                            <div className="message-text">{message.content}</div>
                        </div>
                    ) : (
                        renderCenterInfo()
                    )}
                </div>
            </div>

            <div className="quadrant bottom">
                {renderSection(player1, 0)}
            </div>
            <div className="quadrant left">
                {renderSection(player2, 90)}
            </div>
            <div className="quadrant top">
                {renderSection(player3, 180)}
            </div>
            <div className="quadrant right">
                {renderSection(player4, 270)}
            </div>
        </div>
    );
};
