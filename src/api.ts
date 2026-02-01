import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api"; // Adjust if running on different host

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Web Serial API型定義
export interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
}

declare global {
  interface Navigator {
    serial?: {
      requestPort(): Promise<SerialPort>;
    };
  }
}

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
  dealer: Record<string, unknown>; // Changed from any
  items_on_table: string[];
  turn_log: string[];
  is_game_over: boolean;
  winner: Player | null;
  messages: { timestamp: string; content: string; duration?: number }[];
  pending_interaction: { type: string; source: number; item: string } | null;
  last_action: {
    type: "shoot" | "item";
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

export const executeAction = async (
  gameId: string,
  action: string,
  targetId?: number,
  itemName?: string,
) => {
  const response = await api.post(`/game/${gameId}/action`, {
    action,
    target_id: targetId,
    item_name: itemName,
  });
  return response.data;
};

export const startInteraction = async (gameId: string, item_name: string) => {
  const response = await api.post(`/game/${gameId}/interaction/start`, {
    action: "use_item", // Dummy action type
    item_name: item_name,
  });
  return response.data;
};

export const cancelInteraction = async (gameId: string) => {
  const response = await api.post(`/game/${gameId}/interaction/cancel`);
  return response.data;
};

/**
 * アイテムを使用する
 * @param gameId - ゲームID
 * @param itemName - アイテム名 (e.g., 'cigarette', 'beer', 'saw', 'handcuffs', 'magnifyingglass')
 * @param targetId - 対象プレイヤーID（必要な場合）
 */
export const useItem = async (
  gameId: string,
  itemName: string,
  targetId?: number,
) => {
  return executeAction(gameId, "use", targetId, itemName);
};

/**
 * ショットガンを発砲する
 * @param gameId - ゲームID
 * @param targetId - 対象プレイヤーID
 */
export const shootShotgun = async (gameId: string, targetId: number) => {
  return executeAction(gameId, "shoot", targetId);
};

/**
 * Web Serial API経由でシリアルデバイスに接続
 */
export const connectSerialDevice = async (): Promise<SerialPort> => {
  if (!("serial" in navigator)) {
    throw new Error("Web Serial API is not supported in this browser");
  }
  const port = await navigator.serial!.requestPort();
  await port.open({ baudRate: 9600 });
  return port;
};

/**
 * シリアルポートからデータを読み取る
 * 行ごとのデータを処理して、完全な行単位でコールバックを呼び出す
 */
export const readSerialData = async (
  port: SerialPort,
  onData: (data: string) => void,
) => {
  const reader = port.readable.getReader();
  const decoder = new TextDecoder();
  let buffer = ""; // Buffer for incomplete lines

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      buffer += text;

      // Process complete lines (terminated by \n or \r\n)
      const lines = buffer.split(/\r?\n/);
      buffer = lines.pop() || ""; // Keep the incomplete part in buffer

      for (const line of lines) {
        if (line.trim()) { // Only process non-empty lines
          onData(line.trim());
        }
      }
    }

    // Process remaining data in buffer
    if (buffer.trim()) {
      onData(buffer.trim());
    }
  } finally {
    reader.releaseLock();
  }
};

/**
 * シリアルポートを閉じる
 */
export const closeSerialDevice = async (port: SerialPort) => {
  await port.close();
};
