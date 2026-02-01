import { useState } from "react";
import { type GameState, type Player } from "../api";
import "../styles/DebugPanel.css";

interface DebugPanelProps {
  gameState: GameState | null;
  serialConnected: boolean;
  onConnectSerial: () => void;
  onDisconnectSerial: () => void;
  onUseItem: (itemName: string, targetId?: number) => Promise<Record<string, unknown>>;
  onShootShotgun: (targetId: number) => Promise<Record<string, unknown>>;
  onSerialEvent?: (event: string) => void;
}

export const DebugPanel = ({
  gameState,
  serialConnected,
  onConnectSerial,
  onDisconnectSerial,
  onUseItem,
  onShootShotgun,
  onSerialEvent,
}: DebugPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<string>("cigarette");
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setLog((prev) => [...prev, logMessage].slice(-50)); // Keep last 50 logs
    // Also notify serialEvent callback
    if (onSerialEvent) {
      onSerialEvent(logMessage);
    }
  };

  const handleUseItem = async () => {
    try {
      addLog(
        `Using item: ${selectedItem} (target: ${selectedTarget || "self"})`,
      );
      const result = await onUseItem(selectedItem, selectedTarget || undefined);
      addLog(
        `✓ Item used successfully: ${JSON.stringify(result.message ?? "OK")}`,
      );
    } catch (err) {
      const error = err as Error & { response?: { data?: { message?: string } } };
      const errorMsg =
        error?.response?.data?.message || error?.message || String(err);
      addLog(`✗ Error using item: ${errorMsg}`);
      console.error("[DebugPanel] useItem error:", err);
    }
  };

  const handleShootShotgun = async () => {
    if (selectedTarget === 0) {
      addLog(`✗ Please select a target before shooting`);
      return;
    }
    try {
      addLog(`Shooting target: ${selectedTarget}`);
      const result = await onShootShotgun(selectedTarget);
      addLog(
        `✓ Shot fired successfully: ${JSON.stringify(result.message ?? "OK")}`,
      );
    } catch (err) {
      const error = err as Error & { response?: { data?: { message?: string } } };
      const errorMsg =
        error?.response?.data?.message || error?.message || String(err);
      addLog(`✗ Error shooting: ${errorMsg}`);
      console.error("[DebugPanel] shootShotgun error:", err);
    }
  };

  const handleSimulateItemDetection = async () => {
    const itemTypeMap: Record<string, string> = {
      cigarette: "CIG",
      beer: "BEER",
      saw: "SAW",
      handcuffs: "CUFF",
      magnifyingglass: "MAG",
    };
    
    const itemType = itemTypeMap[selectedItem] || selectedItem;
    addLog(`[SIMULATED] Item detected: ITEM:${itemType}`);
    
    try {
      addLog(`Simulating item use: ${selectedItem}`);
      const result = await onUseItem(selectedItem, selectedTarget || undefined);
      addLog(`✓ Item used successfully (simulated): ${JSON.stringify(result.message ?? "OK")}`);
    } catch (err) {
      const error = err as Error & { response?: { data?: { message?: string } } };
      const errorMsg = error?.response?.data?.message || error?.message || String(err);
      addLog(`✗ Error using item (simulated): ${errorMsg}`);
    }
  };

  const itemOptions = [
    { value: "cigarette", label: "Cigarette (CIG)" },
    { value: "beer", label: "Beer (BEER)" },
    { value: "saw", label: "Saw (SAW)" },
    { value: "handcuffs", label: "Handcuffs (CUFF)" },
    { value: "magnifyingglass", label: "Magnifying Glass (MAG)" },
  ];

  return (
    <>
      {/* Toggle Button */}
      <button
        className="debug-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Close Debug Panel" : "Open Debug Panel"}
      >
        🔧 DEBUG
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="debug-panel">
          <div className="debug-header">
            <h2>Debug Control Panel</h2>
            <button className="debug-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>
          </div>

          <div className="debug-content">
            {/* Serial Connection Control */}
            <section className="debug-section">
              <h3>Serial Communication</h3>
              <div className="status-indicator">
                <span
                  className={`status-dot ${serialConnected ? "connected" : "disconnected"}`}
                ></span>
                <span>{serialConnected ? "Connected" : "Disconnected"}</span>
              </div>
              <div className="button-group">
                {!serialConnected ? (
                  <button className="btn btn-primary" onClick={onConnectSerial}>
                    Connect Serial Device
                  </button>
                ) : (
                  <button
                    className="btn btn-danger"
                    onClick={onDisconnectSerial}
                  >
                    Disconnect Serial Device
                  </button>
                )}
              </div>
            </section>

            {/* Item Usage Control */}
            <section className="debug-section">
              <h3>Item Usage</h3>
              <div className="control-group">
                <label>Select Item:</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                >
                  {itemOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="control-group">
                <label>Target Player:</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(Number(e.target.value))}
                >
                  <option value={0}>No Target (Self)</option>
                  {gameState?.players.map((p: Player) => (
                    <option key={p.id} value={p.id}>
                      Player {p.id}: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="button-group">
                <button className="btn btn-info" onClick={handleUseItem}>
                  Use Item
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleSimulateItemDetection}
                >
                  Simulate Detection
                </button>
              </div>
            </section>

            {/* Shotgun Control */}
            <section className="debug-section">
              <h3>Shotgun Control</h3>
              <div className="control-group">
                <label>Target Player:</label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setSelectedTarget(Number(e.target.value))}
                >
                  <option value={0}>Select Target...</option>
                  {gameState?.players.map((p: Player) => (
                    <option key={p.id} value={p.id}>
                      Player {p.id}: {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="button-group">
                <button className="btn btn-danger" onClick={handleShootShotgun}>
                  Fire Shotgun
                </button>
              </div>
            </section>

            {/* Game State Display */}
            <section className="debug-section">
              <h3>Game State</h3>
              <div className="game-state-info">
                <p>
                  <strong>Game ID:</strong> {gameState?.id || "N/A"}
                </p>
                <p>
                  <strong>Round:</strong> {gameState?.round || "N/A"}
                </p>
                <p>
                  <strong>Current Player:</strong>{" "}
                  {gameState?.players?.[gameState.current_player_index]?.name ||
                    "N/A"}
                </p>
                <p>
                  <strong>Live Shells:</strong>{" "}
                  {gameState?.shotgun?.live_shells || 0}
                </p>
                <p>
                  <strong>Blank Shells:</strong>{" "}
                  {gameState?.shotgun?.blank_shells || 0}
                </p>
                <p>
                  <strong>Game Over:</strong>{" "}
                  {gameState?.is_game_over ? "Yes" : "No"}
                </p>
              </div>
            </section>

            {/* Log Display */}
            <section className="debug-section">
              <h3>Activity Log</h3>
              <div className="log-container">
                {log.length === 0 ? (
                  <p className="log-empty">No activity logged yet</p>
                ) : (
                  log.map((line, idx) => (
                    <div key={idx} className="log-line">
                      {line}
                    </div>
                  ))
                )}
              </div>
              <button className="btn btn-secondary" onClick={() => setLog([])}>
                Clear Log
              </button>
            </section>
          </div>
        </div>
      )}
    </>
  );
};
