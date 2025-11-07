---
{
    "title": "View Tablet Distribution",
    "language": "en"
}
---

# View Tablet Distribution

## Request

`GET /api/tablets_distribution?group_by={enum}&partition_id={int}`

## Description

Get the distribution of tablets under each partition between different disks on BE node

## Query parameters

* `group_by`
    only supports `partition`

* `partition_id`
    ID of the specified partition，Optional with default all partition。

## Request body

None

## Response

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
## Examples


    ```
    curl "http://127.0.0.1:8040/api/tablets_distribution?group_by=partition&partition_id=123"

    ```

