---
{
    "title": "Tablet の Compaction Score を確認する",
    "language": "ja",
    "description": "BE ノード上の Tablet の Compaction Score を確認し、スコア順に表示します。存算分離モードでは、必要に応じてメタデータを同期できます。"
}
---

# Tablet の Compaction Score を確認する {#view-tablet-compaction-score}

## 概要 {#description}

この読み取り専用 API を使用すると、単一の BE ノードで Compaction Score が高い Tablet を確認できます。Tablet のスコアは、その Tablet に属する Rowset のスコアの合計です。結果は `compaction_score` の降順に並びます。存算分離モードでは、クラスタ内のすべての Tablet ではなく、この BE が現在キャッシュしている稼働中の Tablet を調べます。

## 前提条件 {#prerequisites}

BE の HTTP ポート（デフォルトは 8040）に直接接続します。BE の設定 `enable_all_http_auth` が有効な場合は、グローバルな `ADMIN` 権限を持つ Doris アカウントを使用してください。例に示す認証情報は、そのアカウントのものに置き換えてください。

## リクエスト {#request}

```text
GET /api/compaction_score?top_n=<integer>&sync_meta=<boolean>
```

リクエストボディはありません。

## クエリパラメータ {#query-parameters}

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|---|---|---|---|---|
| `top_n` | 非負整数 | いいえ | 利用可能なすべての Tablet | スコアが高い順に、最大 N 個の Tablet を返します。`0` を指定すると `[]` を返します。値は符号付き 64 ビット整数の範囲内である必要があります。 |
| `sync_meta` | 真偽値：`true` または `false` | いいえ | `false` | 存算分離モードでのみ使用できます。`true` の場合、スコアを計算する前に、この BE がキャッシュしている稼働中の Tablet のメタデータと Rowset を Meta Service から同期します。存算一体モードでは、`sync_meta=false` を含め、このパラメータ自体を指定しないでください。 |

## 基本的な使い方 {#basic-usage}

次のリクエストでは、Tablet のデータを返さずに、接続とパラメータの処理を確認できます。

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=0'
```

```json
[]
```

## レスポンス {#response}

リクエストが成功すると、HTTP 200 と JSON 配列を返します。各要素には、値が文字列の以下のフィールドが含まれます。

| フィールド | 説明 |
|---|---|
| `tablet_id` | Tablet ID。 |
| `compaction_score` | Tablet に属する Rowset の Compaction Score の合計。 |

たとえば、最大 10 個の Tablet を返すには、次のようにリクエストします。

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=10'
```

次の出力は例です。ID、スコア、返される Tablet の数は BE の状態によって異なります。

```json
[
    {"compaction_score": "5", "tablet_id": "42595"},
    {"compaction_score": "4", "tablet_id": "10034"}
]
```

存算分離モードでは、スコアを計算する前に、キャッシュされている Tablet の最新のメタデータを取得できます。

```shell
curl -u '<user>:<password>' 'http://127.0.0.1:8040/api/compaction_score?top_n=10&sync_meta=true'
```

レスポンスは同じ JSON 形式で、スコアは同期後に計算されます。

## エラー処理と注意事項 {#error-handling-and-caveats}

- `top_n` を解析できない場合や負の値を指定した場合は、HTTP 400 を返します。例：`invalid argument: top_n=wrong`。
- 存算一体モードで空でない `sync_meta` を指定すると、HTTP 400 を返します：``param `sync_meta` is only available for cloud mode``。
- 存算分離モードで、空でない `sync_meta` に `true` または `false` 以外を指定すると、HTTP 400 を返します。例：`invalid argument: sync_meta=wrong`。
- メタデータの同期に失敗すると、HTTP 500 を返します。認証が有効な場合、認証情報がないか無効であれば、HTTP 401 または 403 を返すことがあります。
- `top_n` が制限するのはレスポンスの件数であり、調査または同期する Tablet の数ではありません。スコアはこの BE の Tablet の状態を示すもので、クラスタ全体のアトミックなスナップショットではありません。

## ベストプラクティス {#best-practices}

まず、小さな `top_n` とデフォルトの `sync_meta=false` を使用して、さらに調査する Tablet を特定します。最新のメタデータが必要な場合は `sync_meta=true` を使用してください。`top_n` を適用する前に、キャッシュされている稼働中の Tablet をすべて同期するため、レイテンシーと Meta Service の負荷が増える可能性があります。
