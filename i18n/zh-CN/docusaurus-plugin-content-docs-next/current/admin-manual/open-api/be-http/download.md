---
{
    "title": "下载 load 日志",
    "language": "zh-CN",
    "description": "下载 load 错误日志文件。"
}
---

## 请求路径

`GET /api/_load_error_log?token={string}&file={string}`

## 描述

下载 load 错误日志文件。

## 请求参数

* `file`
    文件路径

* `token`
    token         

## 请求体

无

## 响应

    文件

## 示例


    ```shell
    curl "http://127.0.0.1:8040/api/_load_error_log?file=a&token=1"
    ```

