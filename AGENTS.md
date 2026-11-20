# spending

風土記（fudoki.dev）のサブサイト `spending.fudoki.dev`。「私のお金はどこへ行った？」に絞り、まちを選ぶと、その自治体の予算を住民1人あたりに割ったレシートを出す。Cloudflare Worker を1つ作り（`fudoki-spending`）、データは本体の Worker（`fudoki`）を Service Binding で読むだけにする。自前のデータ（D1・KV）は持たない。

## Story

- まちの住民として、自分の住むまちを選ぶと、自分1人ぶんの予算が何にいくら使われたかをレシートの形で読める
- 読み手として、レシートを QR コードで人に渡せる

## ディレクトリ構造

```
.
├── pages/           # 頁（React、@void/react）。まちを選ぶ頁とレシートの頁
├── docs/            # この repo の設計・判断（tracked）
├── void.config.ts   # Worker 名（fudoki-spending）と、本体 Worker（fudoki）への Service Binding
└── vite.config.ts
```

データは本体の Worker から読む。この repo で予算を集計し直したり、どこかへ書き込んだりしない。足りないデータは本体の API に足してから読む。

## セットアップ

ツールは mise で管理している。

```bash
mise install
mise exec -- bun install
mise exec -- bun run dev     # vite dev
mise exec -- bun run check   # 型検査
```

依存は exact ピン留めにし、公開から7日未満の版は `bunfig.toml`（`minimumReleaseAge`）で解決から外す。セキュリティ修正は cooldown の例外として直ちに入れ、例外を解除できる日時を PR 本文に書く。

repo は public なので、secret や非公開の設定値は tracked なファイルに入れない。

## 技術スタック

- Bun + TypeScript
- [Void](https://void.cloud)（Cloudflare Worker `fudoki-spending`）。`void.lock.json` は Void が生成したら commit する
- Void の pages（`@void/react`）・Tailwind CSS v4（`@tailwindcss/vite`）
- three.js（レシートの見せ方）・uqr（QR コード）

## Skills

- Void でアプリを作る・CLI を使うとき → `.agents/skills/void/`（`voidzero-dev/void` から skillctrl で取得。取得元と hash は `skills-lock.json`・`.agents/skillctrl/`）。Claude Code へは `.claude/skills/` の相対 symlink で渡す

## レビュー

- PR レビューは Pullfrog。初回レビューは自動、追加コミットの再レビューは無効。追加レビューは必要時に `@pullfrog` で依頼する。PR の merge で Pullfrog を待たなくてよい
- 設定の正本は `.github/pullfrog.config.sh`（backend の値は git から見えないので、変えるときはこの script を直して実行する）。model・effort・instructions は org の既定を継承する
