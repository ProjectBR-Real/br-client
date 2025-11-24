# Buckshot Roulette Client

このプロジェクトは、ゲーム「Buckshot Roulette」の進行状況を表示するための Web クライアントアプリケーションです。バックエンドサーバーと通信し、現在のゲーム状態をリアルタイムで表示します。

## ✨ 主な機能

- 現在のラウンドとプレイヤーの情報を表示
- 各プレイヤーの体力と所持アイテムを一覧表示
- ショットガンに装填されている実弾と空砲の数を表示
- ゲームの進行に合わせて自動的に情報を更新

## 🛠️ 技術スタック

- **フレームワーク**: [React](https://react.dev/)
- **言語**: [TypeScript](https://www.typescriptlang.org/)
- **ビルドツール**: [Vite](https://vitejs.dev/)
- **HTTP クライアント**: [Axios](https://axios-http.com/)
- **パッケージマネージャー**: [pnpm](https://pnpm.io/)

## 🚀 セットアップと実行

### 前提条件

- [Node.js](https://nodejs.org/) (v18.18.0, v20.9.0, または >=21.1.0)
- [pnpm](https://pnpm.io/installation)

### インストール

プロジェクトの依存関係をインストールします。

```sh
pnpm install
```

### 開発サーバーの起動

開発モードでアプリケーションを起動します。

```sh
pnpm dev
```

起動後、ブラウザで `http://localhost:5173` にアクセスしてください。

### 使用方法

アプリケーションは、URL のクエリパラメータ `game_id` を使用して特定のゲームセッションに接続します。

例:
`http://localhost:5173/?game_id=123`

### ビルド

本番用にアプリケーションをビルドします。

```sh
pnpm build
```

ビルドされたファイルは `dist` ディレクトリに出力されます。

### Lint

コードの静的解析を実行します。

```sh
pnpm lint
```
