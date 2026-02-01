# API Reference

Master サーバーが提供する HTTP API のリファレンスです。
Base URL: `http://localhost:8000`

## Game Management

### List Games
アクティブなゲーム一覧を取得します。

- **Endpoint**: `GET /api/games`
- **Response**:
  ```json
  {
    "games": [
      {
        "id": "string",
        "round": "int",
        "players": "int",
        "is_over": "boolean",
        ...
      }
    ]
  }
  ```

### Create Game
新しいゲームセッションを作成します。

- **Endpoint**: `POST /api/game/create`
- **Body**:
  ```json
  {
    "player_ids": [1, 2],
    "custom_settings": { ... } // Optional
  }
  ```

### Terminate Game
ゲームを強制終了します。

- **Endpoint**: `POST /api/game/{game_id}/terminate`

## Game State & Actions

### Get Game State
現在のゲーム状態を取得します（ポーリング用）。

- **Endpoint**: `GET /api/game/{game_id}/state`
- **Response**: `GameState` オブジェクト (JSON)

### Execute Action
プレイヤーのアクション（発砲、アイテム使用）を実行します。

- **Endpoint**: `POST /api/game/{game_id}/action`
- **Body**:
  ```json
  {
    "action": "shoot" | "use",
    "target_id": "int", // Optional
    "item_name": "string" // Optional
  }
  ```

### Start Interaction
インタラクション（手錠の対象選択など）を開始します。

- **Endpoint**: `POST /api/game/{game_id}/interaction/start`

### Cancel Interaction
インタラクションをキャンセルします。

- **Endpoint**: `POST /api/game/{game_id}/interaction/cancel`

### Undo
最後のアクションを取り消します。

- **Endpoint**: `POST /api/game/{game_id}/undo`

## Hardware Protocol

### Shotgun (TCP Port 8080)

- **Master -> Shotgun**:
  - `FIRE:LIVE`: 実弾発射指示
  - `FIRE:BLANK`: 空砲発射指示

- **Shotgun -> Master**:
  - `DONE`: コマンド完了通知
  - `TRIGGER`: トリガー検知

### Table (TCP/Serial)

- **Table -> Master**:
  - `RFID:<UID>`: アイテム検知 (UID送信)
