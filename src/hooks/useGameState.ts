import { useState, useEffect, useRef } from "react";
import {
  getGameState,
  type GameState,
  useItem,
  shootShotgun,
  connectSerialDevice,
  readSerialData,
  closeSerialDevice,
} from "../api";
import { MOCK_GAME_STATE } from "../mockData";

export const useGameState = (gameId: string | null) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const intervalRef = useRef<number | null>(null);

  // Serial communication state
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const serialPortRef = useRef<any>(null);
  const serialReaderRef = useRef<any>(null);

  // Check for debug mode via URL param or env var
  const isDebug =
    new URLSearchParams(window.location.search).get("debug") === "true";

  const fetchState = async () => {
    // デバッグモードでもgameIdがあればAPIから取得する
    // gameIdがない場合のみモックデータを使用
    if (!gameId) {
      if (isDebug) {
        setGameState(MOCK_GAME_STATE);
        setLoading(false);
        return;
      }
      return;
    }

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

  // Initialize serial communication if Web Serial API is available
  useEffect(() => {
    if (!gameId || isDebug) return;

    const initializeSerial = async () => {
      try {
        if ("serial" in navigator) {
          const port = await connectSerialDevice();
          serialPortRef.current = port;
          setSerialConnected(true);

          // Start reading serial data
          readSerialData(port, (data: string) => {
            handleSerialData(data, gameId);
          }).catch((err: any) => {
            if (err.name !== "AbortError") {
              console.error("Serial read error:", err);
            }
          });
        }
      } catch (err) {
        console.warn(
          "Serial connection failed (this is normal if no device is connected):",
          err,
        );
      }
    };

    // Optionally auto-initialize on component mount
    // Uncomment if you want auto-connection:
    // initializeSerial();

    return () => {
      if (serialPortRef.current) {
        closeSerialDevice(serialPortRef.current).catch(console.error);
      }
    };
  }, [gameId, isDebug]);

  const handleSerialData = async (data: string, gId: string) => {
    const line = data.trim();

    // Parse item detection (e.g., "ITEM:CIG")
    if (line.startsWith("ITEM:")) {
      const itemType = line.substring(5).toLowerCase();
      console.log("Item detected:", itemType);

      // Map serial format to internal format if needed
      const itemNameMap: Record<string, string> = {
        cig: "cigarette",
        beer: "beer",
        saw: "saw",
        cuff: "handcuffs",
        mag: "magnifyingglass",
      };

      const itemName = itemNameMap[itemType] || itemType;

      try {
        await useItem(gId, itemName);
        await fetchState(); // Refresh game state
      } catch (err) {
        console.error("Failed to use item:", err);
      }
    }

    // Parse trigger detection
    else if (line === "TRIGGER") {
      console.log("Trigger detected");
      // This would typically be handled by the shotgun hardware
      // triggering an action in the game
    }
  };

  // Connect serial device manually (for debug panel)
  const connectSerial = async () => {
    try {
      const port = await connectSerialDevice();
      serialPortRef.current = port;
      setSerialConnected(true);

      readSerialData(port, (data: string) => {
        if (gameId) {
          handleSerialData(data, gameId);
        }
      }).catch((err: any) => {
        if (err.name !== "AbortError") {
          console.error("Serial read error:", err);
        }
      });
    } catch (err) {
      console.error("Failed to connect serial device:", err);
      setError("Failed to connect to serial device");
    }
  };

  // Disconnect serial device
  const disconnectSerial = async () => {
    if (serialPortRef.current) {
      try {
        await closeSerialDevice(serialPortRef.current);
        serialPortRef.current = null;
        setSerialConnected(false);
      } catch (err) {
        console.error("Failed to disconnect serial device:", err);
      }
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

  return {
    gameState,
    error,
    loading,
    refresh: fetchState,
    isDebug,
    serialConnected,
    connectSerial,
    disconnectSerial,
    useItem: async (itemName: string, targetId?: number) => {
      if (!gameId) throw new Error("No game ID");
      console.log(
        `[useItem] Calling API with gameId=${gameId}, itemName=${itemName}, targetId=${targetId}`,
      );
      try {
        const result = await useItem(gameId, itemName, targetId);
        console.log(`[useItem] Response:`, result);
        await fetchState();
        return result;
      } catch (err) {
        console.error(`[useItem] Error:`, err);
        throw err;
      }
    },
    shootShotgun: async (targetId: number) => {
      if (!gameId) throw new Error("No game ID");
      console.log(
        `[shootShotgun] Calling API with gameId=${gameId}, targetId=${targetId}`,
      );
      try {
        const result = await shootShotgun(gameId, targetId);
        console.log(`[shootShotgun] Response:`, result);
        await fetchState();
        return result;
      } catch (err) {
        console.error(`[shootShotgun] Error:`, err);
        throw err;
      }
    },
  };
};
