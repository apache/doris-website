---
{
  "title": "メタを表示",
  "language": "ja",
  "description": "タブレットのメタ情報を表示"
}
---
# View Meta

## リクエスト

`GET /api/meta/header/{tablet_id}?byte_to_base64={bool}`

## 説明

タブレットのメタ情報を表示します

## パスパラメータ

* `tablet_id`
    タブレットのID

## クエリパラメータ

* `byte_to_base64`
    base64でエンコードするかどうか。オプション、デフォルトは`false`です。

## リクエストボディ

なし

## レスポンス

    ```
    {
        "table_id": 148107,
        "partition_id": 148104,
        "tablet_id": 148193,
        "schema_hash": 2090621954,
        "shard_id": 38,
        "creation_time": 1673253868,
        "cumulative_layer_point": -1,
        "tablet_state": "PB_RUNNING",
        ...
    }
    ```
## 例

    ```
    curl "http://127.0.0.1:8040/api/meta/header/148193&byte_to_base64=true"

    ```
