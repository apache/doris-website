---
{
    "title": "恢复 tablet",
    "language": "zh-CN",
    "description": "该功能用于恢复 trash 目录中被误删的 tablet 数据。"
}
---

## 请求路径

`POST /api/restore_tablet?tablet_id={int}&schema_hash={int}"`

## 描述

该功能用于恢复 trash 目录中被误删的 tablet 数据。

## 请求参数

* `tablet_id`
    需要恢复的 table 的 id

* `schema_hash`
    schema hash       


## 请求体

无

## 响应

    ```json
    {
        msg: "OK",
        code: 0
    }
    ```
## 示例


    ```
    curl -X POST "http://127.0.0.1:8040/api/restore_tablet?tablet_id=123456&schema_hash=1111111"

    ```

