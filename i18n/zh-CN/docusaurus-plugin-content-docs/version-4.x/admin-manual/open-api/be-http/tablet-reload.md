---
{
    "title": "重加载 tablet",
    "language": "zh-CN",
    "description": "该功能用于重加载 tablet 数据。"
}
---

## 请求路径

`GET /api/reload_tablet?tablet_id={int}&schema_hash={int}&path={string}"`

## 描述

该功能用于重加载 tablet 数据。

## 请求参数

* `tablet_id`
    需要重加载的 table 的 id

* `schema_hash`
    schema hash      

* `path`
    文件路径     


## 请求体

无

## 响应

    ```shell
    load header succeed
    ```
## 示例


    ```shell
    curl "http://127.0.0.1:8040/api/reload_tablet?tablet_id=123456&schema_hash=1111111&path=/abc"

    ```

