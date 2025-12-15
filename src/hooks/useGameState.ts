import { useState, useEffect, useRef } from 'react';
import { getGameState, type GameState } from '../api';
import { MOCK_GAME_STATE } from '../mockData';

export const useGameState = (gameId: string | null) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const intervalRef = useRef<number | null>(null);

    // Check for debug mode via URL param or env var
    const isDebug = new URLSearchParams(window.location.search).get('debug') === 'true';

    const fetchState = async () => {
        if (isDebug) {
            setGameState(MOCK_GAME_STATE);
            setLoading(false);
            return;
        }

        if (!gameId) return;
        try {
            const data = await getGameState(gameId);
            setGameState(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch game state:", err);
            if (loading) {
                setError("Failed to connect to game server.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isDebug || gameId) {
            fetchState(); // Initial fetch
            if (!isDebug) {
                intervalRef.current = window.setInterval(fetchState, 1000); // Poll every 1s
            }
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [gameId, isDebug]);

    return { gameState, error, loading, refresh: fetchState, isDebug };
};
