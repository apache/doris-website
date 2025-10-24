---
{
    "title": "查询 tablet 信息",
    "language": "zh-CN"
}
---

## Request

`GET /tablets_json?limit={int}`

## Description

获取特定 BE 节点上指定数量的 tablet 的 tablet id 和 schema hash 信息

## Query parameters

* `limit`
    返回的 tablet 数量，选填，默认 1000 个，可填`all`返回全部 tablet。

## Request body

无

## Response

    ```json
    {
        msg: "OK",
        code: 0,
        data: {
            host: "10.38.157.107",
            tablets: [
                {
                    tablet_id: 11119,
                    schema_hash: 714349777
                },

                    ...

                {
                    tablet_id: 11063,
                    schema_hash: 714349777
                }
            ]
        },
        count: 30
    }
    ```
## Examples


    ```shell
    curl http://127.0.0.1:8040/api/tablets_json?limit=123

    ```

