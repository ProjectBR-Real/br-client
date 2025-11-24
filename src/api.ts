import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000/api'; // Adjust if running on different host

export const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export interface GameState {
    id: string;
    round: number;
    players: Player[];
    current_player_index: number;
    shotgun: {
        live_shells: number;
        blank_shells: number;
        is_sawed_off: boolean;
    };
    dealer: any; // Add type if needed
    items_on_table: string[];
    turn_log: string[];
    is_game_over: boolean;
    winner: Player | null;
    messages: { timestamp: string; content: string; duration?: number }[];
    pending_interaction: { type: string; source: number; item: string } | null;
    last_action: {
        type: 'shoot' | 'item';
        source: string;
        target?: string;
        item?: string;
        result: string;
        timestamp: number;
    } | null;
}

export interface Player {
    id: number;
    name: string;
    lives: number;
    max_lives: number;
    items: string[];
    is_human: boolean;
    is_skipped?: boolean;
}

export const getGameState = async (gameId: string) => {
    const response = await api.get<GameState>(`/game/${gameId}/state`);
    return response.data;
};

export const executeAction = async (gameId: string, action: string, targetId?: number, itemName?: string) => {
    const response = await api.post(`/game/${gameId}/action`, {
        action,
        target_id: targetId,
        item_name: itemName,
    });
    return response.data;
};

export const startInteraction = async (gameId: string, item_name: string) => {
    const response = await api.post(`/game/${gameId}/interaction/start`, {
        action: 'use_item', // Dummy action type
        item_name: item_name
    });
    return response.data;
};

export const cancelInteraction = async (gameId: string) => {
    const response = await api.post(`/game/${gameId}/interaction/cancel`);
    return response.data;
};
