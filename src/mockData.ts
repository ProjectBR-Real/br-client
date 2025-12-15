import type { GameState } from './api';

export const MOCK_GAME_STATE: GameState = {
    id: "debug-session",
    round: 2,
    players: [
        { id: 1, name: "Player 1", lives: 2, max_lives: 4, items: ["beer", "magnifying_glass"], is_human: true },
        { id: 2, name: "Player 2", lives: 4, max_lives: 4, items: ["handcuffs"], is_human: true },
        { id: 3, name: "Player 3", lives: 1, max_lives: 4, items: [], is_human: true },
        { id: 4, name: "Player 4", lives: 3, max_lives: 4, items: ["saw", "cigarette"], is_human: true }
    ],
    current_player_index: 0,
    shotgun: {
        live_shells: 3,
        blank_shells: 2,
        is_sawed_off: false
    },
    dealer: {},
    items_on_table: [],
    turn_log: ["Round started"],
    is_game_over: false,
    winner: null,
    messages: [],
    pending_interaction: null,
    last_action: null
};
