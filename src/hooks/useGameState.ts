import { useState, useEffect, useRef, useCallback } from "react";
import {
  getGameState,
  type GameState,
  type SerialPort,
  useItem as apiUseItem,
  shootShotgun,
  connectSerialDevice,
  readSerialData,
  closeSerialDevice,
} from "../api";
import { MOCK_GAME_STATE } from "../mockData";

export const useGameState = (
  gameId: string | null,
  onSerialEvent?: (event: string) => void,
) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const intervalRef = useRef<number | null>(null);

  // Serial communication state
  const [serialConnected, setSerialConnected] = useState<boolean>(false);
  const serialPortRef = useRef<SerialPort | null>(null);

  // Check for debug mode via URL param or env var
  const isDebug =
    new URLSearchParams(window.location.search).get("debug") === "true";

  const fetchState = useCallback(async () => {
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
  }, [gameId, isDebug, loading]);

  // Initialize serial communication if Web Serial API is available
  useEffect(() => {
    if (!gameId || isDebug) return;

    let isMounted = true;

    const handleSerialDataLocal = async (data: string, gId: string) => {
      const line = data.trim();

      if (!line) return; // Ignore empty lines

      // Parse item detection (e.g., "ITEM:CIG")
      if (line.startsWith("ITEM:")) {
        const itemType = line.substring(5).toLowerCase();
        console.log("Item detected via serial:", itemType);

        // Notify via callback
        onSerialEvent?.(
          `[SERIAL] Item detected: ITEM:${itemType.toUpperCase()}`,
        );

        // Map serial format to internal format
        const itemNameMap: Record<string, string> = {
          cig: "cigarette",
          beer: "beer",
          saw: "saw",
          cuff: "handcuffs",
          mag: "magnifyingglass",
        };

        const itemName = itemNameMap[itemType] || itemType;

        console.log(`Mapped item type "${itemType}" to "${itemName}"`);

        try {
          console.log(`Sending item use request: itemName=${itemName}`);
          onSerialEvent?.(`[SERIAL] Sending item use: ${itemName}`);
          await apiUseItem(gId, itemName);
          console.log("Item use successful, refreshing game state");
          onSerialEvent?.(`[SERIAL] ✓ Item use successful: ${itemName}`);
          // Re-fetch game state
          if (isMounted) {
            const data = await getGameState(gId);
            setGameState(data);
          }
        } catch (err) {
          console.error("Failed to use item:", err);
          onSerialEvent?.(
            `[SERIAL] ✗ Error: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }

      // Parse trigger detection (ignored for now - shotgun not implemented)
      else if (line === "TRIGGER") {
        console.log("Trigger detected (shotgun not yet implemented)");
        onSerialEvent?.(`[SERIAL] Trigger detected (not yet implemented)`);
      }

      // Ignore other data
      else if (line.length > 0) {
        console.log("Received unknown serial data:", line);
      }
    };

    const initializeSerial = async () => {
      try {
        if ("serial" in navigator) {
          const port = await connectSerialDevice();
          if (!isMounted) return;

          serialPortRef.current = port;
          setSerialConnected(true);
          console.log("Serial device connected successfully");
          // Refresh game state after serial connection
          await fetchState();

          // Start reading serial data
          readSerialData(port, (data: string) => {
            handleSerialDataLocal(data, gameId);
          }).catch((err: Error) => {
            if (err.name !== "AbortError") {
              console.error("Serial read error:", err);
              setSerialConnected(false);
            }
          });
        } else {
          console.warn("Web Serial API is not supported in this browser");
        }
      } catch (err) {
        if (isMounted) {
          console.warn(
            "Serial connection failed (this is normal if no device is connected):",
            err,
          );
          setSerialConnected(false);
        }
      }
    };

    // Auto-initialize on component mount
    initializeSerial();

    return () => {
      isMounted = false;
      if (serialPortRef.current) {
        closeSerialDevice(serialPortRef.current).catch(console.error);
        serialPortRef.current = null;
        setSerialConnected(false);
      }
    };
  }, [gameId, isDebug]);

  // Connect serial device manually (for debug panel)
  const connectSerial = async () => {
    try {
      const port = await connectSerialDevice();
      serialPortRef.current = port;
      setSerialConnected(true);
      onSerialEvent?.(`[SERIAL] Device connected successfully`);
      // Refresh game state after serial connection
      await fetchState();

      readSerialData(port, (data: string) => {
        if (gameId) {
          // Parse item detection locally
          const line = data.trim();
          if (line.startsWith("ITEM:")) {
            const itemType = line.substring(5).toLowerCase();
            onSerialEvent?.(
              `[SERIAL] Item detected: ITEM:${itemType.toUpperCase()}`,
            );

            const itemNameMap: Record<string, string> = {
              cig: "cigarette",
              beer: "beer",
              saw: "saw",
              cuff: "handcuffs",
              mag: "magnifyingglass",
            };
            const itemName = itemNameMap[itemType] || itemType;
            onSerialEvent?.(`[SERIAL] Sending item use: ${itemName}`);
            apiUseItem(gameId, itemName)
              .then(async () => {
                console.log("Item use successful");
                onSerialEvent?.(`[SERIAL] ✓ Item use successful: ${itemName}`);
                // Refresh UI after item use
                await fetchState();
              })
              .catch((err) => {
                console.error("Failed to use item:", err);
                onSerialEvent?.(
                  `[SERIAL] ✗ Error: ${err instanceof Error ? err.message : String(err)}`,
                );
              });
          }
        }
      }).catch((err: Error) => {
        if (err.name !== "AbortError") {
          console.error("Serial read error:", err);
          onSerialEvent?.(`[SERIAL] ✗ Read error: ${err.message}`);
        }
      });
    } catch (err) {
      console.error("Failed to connect serial device:", err);
      onSerialEvent?.(
        `[SERIAL] ✗ Connection failed: ${err instanceof Error ? err.message : String(err)}`,
      );
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
      // Only set up polling if NOT in debug mode
      if (!isDebug && gameId) {
        intervalRef.current = window.setInterval(() => {
          fetchState();
        }, 1000); // Poll every 1s
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [gameId, isDebug, fetchState]);

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
        const result = await apiUseItem(gameId, itemName, targetId);
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
