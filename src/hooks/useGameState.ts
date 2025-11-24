import { useState, useEffect, useRef } from 'react';
import { getGameState, type GameState } from '../api';

export const useGameState = (gameId: string | null) => {
    const [gameState, setGameState] = useState<GameState | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const intervalRef = useRef<number | null>(null);

    const fetchState = async () => {
        if (!gameId) return;
        try {
            const data = await getGameState(gameId);
            setGameState(data);
            setError(null);
        } catch (err) {
            console.error("Failed to fetch game state:", err);
            // Don't set error on every poll failure to avoid flickering, just log it
            // But if it's the first load, we should show error
            if (loading) {
                setError("Failed to connect to game server.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (gameId) {
            fetchState(); // Initial fetch
            intervalRef.current = window.setInterval(fetchState, 1000); // Poll every 1s
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [gameId]);

    return { gameState, error, loading, refresh: fetchState };
};
