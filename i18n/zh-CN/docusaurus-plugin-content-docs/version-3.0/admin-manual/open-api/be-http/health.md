---
{
    "title": "BE 探活",
    "language": "zh-CN"
}
---

## Request

`GET /api/health`

## Description

给监控服务提供的探活接口，请求能响应代表 BE 状态正常。

## Query parameters
无    

## Request body
无

## Response

    ```json
    {"status": "OK","msg": ""}
    ```

## Examples


    ```shell
    curl http://127.0.0.1:8040/api/health
    ```

