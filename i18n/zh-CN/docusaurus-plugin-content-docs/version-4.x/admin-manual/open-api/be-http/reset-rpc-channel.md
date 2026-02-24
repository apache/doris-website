---
{
    "title": "重置连接缓存",
    "language": "zh-CN",
    "description": "该功能用于重置 brpc 的连接缓存。"
}
---

## 请求路径

`GET /api/reset_rpc_channel/{endpoints}`

## 描述

该功能用于重置 brpc 的连接缓存。

## Path parameters

* `endpoints`
    支持如下形式：
   
    - `all`
   
    - `host1:port1,host2:port2`

## 请求体

无

## 响应

    ```json
    {
        "msg":"success",
        "code":0,
        "data": "no cached channel.",
        "count":0
    }
    ```
## 示例


    ```shell
    curl http://127.0.0.1:8040/api/reset_rpc_channel/all
    ```
    
    ```shell
    curl http://127.0.0.1:8040/api/reset_rpc_channel/1.1.1.1:8080,2.2.2.2:8080
    ```

