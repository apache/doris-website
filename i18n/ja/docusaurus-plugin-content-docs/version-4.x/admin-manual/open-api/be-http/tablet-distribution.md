---
{
    "title": "タブレットの分布を表示",
    "language": "ja",
    "description": "BE ノード上で、各パーティションのタブレットがディスクごとにどのように分布しているかを取得します"
}
---

# タブレットの分布を表示

## リクエスト

`GET /api/tablets_distribution?group_by={enum}&partition_id={int}`

## 説明

BE ノード上で、各パーティションのタブレットがディスクごとにどのように分布しているかを取得します。

## クエリパラメータ

* `group_by`
    `partition` のみをサポートします。

* `partition_id`
    指定するパーティションの ID。省略可能で、省略した場合はすべてのパーティションが対象です。

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
