---
{
    "title": "下载 load 日志",
    "language": "zh-CN"
}
---

## Request

`GET /api/_load_error_log?token={string}&file={string}`

## Description

下载 load 错误日志文件。

## Query parameters

* `file`
    文件路径

* `token`
    token         

## Request body

无

## Response

    文件

## Examples


    ```shell
    curl "http://127.0.0.1:8040/api/_load_error_log?file=a&token=1"
    ```

