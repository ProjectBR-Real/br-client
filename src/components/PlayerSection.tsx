import React from 'react';
import { PlayerCard } from './PlayerCard';
import type { Player } from '../api';
import './PlayerSection.css';

interface PlayerSectionProps {
    player: Player;
    rotation: number;
    isCurrent: boolean;
    onAction: (action: string, targetId?: number, itemName?: string) => void;
    isTargetable: boolean;
    onSelectTarget: () => void;
}

export const PlayerSection: React.FC<PlayerSectionProps> = ({
    player,
    rotation,
    isCurrent,
    onAction,
    isTargetable,
    onSelectTarget
}) => {
    return (
        <div style={{
            transform: `rotate(${rotation}deg)`,
            // specific sizing to ensure the card fits well when rotated
            width: 'auto',
            height: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '10px'
        }}>
            <PlayerCard
                player={player}
                isCurrentTurn={isCurrent}
                onAction={onAction}
                isTargetable={isTargetable}
                onSelectTarget={onSelectTarget}
            />
        </div>
    );
};
