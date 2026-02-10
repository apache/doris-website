---
{
    "title": "填充坏副本",
    "language": "zh-CN",
    "description": "该功能用于使用一个空的 rowset 填充损坏的副本。"
}
---

## Request

`POST /api/pad_rowset?tablet_id={int}&start_version={int}&end_version={int}`

## Description

该功能用于使用一个空的 rowset 填充损坏的副本。

## Query parameters

* `tablet_id`
    table 的 id

* `start_version`
    起始版本

* `end_version`
    终止版本       


## Request body

无

## Response

    ```json
    {
        msg: "OK",
        code: 0
    }
    ```
## Examples


    ```shell
    curl -X POST "http://127.0.0.1:8040/api/pad_rowset?tablet_id=123456&start_version=1111111&end_version=1111112"

    ```

