---
{
  "title": "タブレット配布を表示",
  "language": "ja",
  "description": "BEノードの異なるディスク間における各パーティション下のタブレットの分散を取得する"
}
---
# View Tablet Distribution

## Request

`GET /api/tablets_distribution?group_by={enum}&partition_id={int}`

## 説明

BEノード上の異なるディスク間で各パーティション下のタブレットの分散を取得します

## クエリパラメータ

* `group_by`
    `partition`のみサポートします

* `partition_id`
    指定されたパーティションのID、オプションでデフォルトは全パーティションです。

## リクエストボディ

なし

## レスポンス

    ```
    {
        msg: "OK",
        code: 0,
        data: {
            host: "***",
            tablets_distribution: [
                {
                    partition_id:***,
                    disks:[
                        {
                            disk_path:"***",
                            tablets_num:***,
                            tablets:[
                                {
                                    tablet_id:***,
                                    schema_hash:***,
                                    tablet_size:***
                                },

                                ...

                            ]
                        },

                        ...

                    ]
                }
            ]
        },
        count: ***
    }
    ```
## 例

    ```
    curl "http://127.0.0.1:8040/api/tablets_distribution?group_by=partition&partition_id=123"

    ```
