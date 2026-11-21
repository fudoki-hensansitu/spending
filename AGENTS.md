# spending

風土記（fudoki.dev）のサブサイト `spending.fudoki.dev`。「私のお金はどこへ行った？」に絞り、まちを選ぶと、その自治体の予算を住民1人あたりに割ったレシートを出す。Cloudflare Worker を1つ作り（`fudoki-spending`）、データは本体の Worker（`fudoki`）を Service Binding で読むだけにする。自前のデータ（D1・KV）は持たない。

## Story

- まちの住民として、自分の住むまちを選ぶと、自分1人ぶんの予算が何にいくら使われたかをレシートの形で読める
- 読み手として、レシートを QR コードで人に渡せる

## ディレクトリ構造

```
.
├── pages/           # 頁（React、@void/react）。まちを選ぶ頁（/）とレシートの頁（/<自治体コード>?year=）
├── receipt/         # 札とレシート（数え上げ・紙送り・押し出された紙の立体・シェア）。もとは fudoki の apps/web/home にあった（fudoki#1024 で外した）
├── components/      # 見出し・まちの検索・紋章などの小さな部品
├── lib/             # 本体から読むデータの形・分野の並び・1人あたりの割り方・年度の呼び方（本体の写し。正本は fudoki）
├── server/          # 本体への中継（Service Binding。手元の vite dev は公開の fudoki.dev）
├── middleware/      # /api/jurisdictions*・紋章・OG 画像を本体へ中継し、HTML に CSP を付ける
├── styles/          # Tailwind と色・字の token（fudoki の DESIGN.md・tokens.css の写し）
├── docs/            # この repo の設計・判断（tracked）
├── void.config.ts   # Worker 名（fudoki-spending）・spending.fudoki.dev・本体 Worker（fudoki）への Service Binding
└── vite.config.ts
```

データは本体の Worker から読む。この repo で予算を集計し直したり、どこかへ書き込んだりしない。足りないデータは本体の API に足してから読む。本体の同じ path（`/api/jurisdictions*`・`/jurisdictions/<code>/emblem.svg`・`receipt.png`）をそのまま中継するので、本体がこれらの path や応答の形を変えるときはこの repo も直す。分野の名前・並び・token は本体の写しなので、本体で変えたら合わせる。

## セットアップ

ツールは mise で管理している。

```bash
mise install
mise exec -- bun install
mise exec -- bun run dev     # vite dev
mise exec -- bun run check   # 型検査
mise exec -- bun run deploy  # build して Worker（fudoki-spending）へ出す
```

vite dev は Service Binding の先が手元に無いので、本体の公開の fudoki.dev に繋ぐ。

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
