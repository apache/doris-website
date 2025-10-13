---
{
    "title": "查询 tablet 分布",
    "language": "zh-CN"
}
---

## Request

`GET /api/tablets_distribution?group_by={enum}&partition_id={int}`

## Description

获取 BE 节点上每一个 partition 下的 tablet 在不同磁盘上的分布情况

## Query parameters

* `group_by`
    分组，当前只支持`partition`

* `partition_id`
    指定 partition 的 id，选填，默认返回所有 partition。

## Request body

无

## Response

    ```json
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
## Examples


    ```shell
    curl "http://127.0.0.1:8040/api/tablets_distribution?group_by=partition&partition_id=123"

    ```

