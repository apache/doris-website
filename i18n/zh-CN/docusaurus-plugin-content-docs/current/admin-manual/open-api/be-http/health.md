---
{
    "title": "BE 探活",
    "language": "zh-CN",
    "description": "给监控服务提供的探活接口，请求能响应代表 BE 状态正常。"
}
---

## 请求路径

`GET /api/health`

## 描述

给监控服务提供的探活接口，请求能响应代表 BE 状态正常。

## 请求参数
无    

## 请求体
无

## 响应

    ```json
    {"status": "OK","msg": ""}
    ```

## 示例


    ```shell
    curl http://127.0.0.1:8040/api/health
    ```

