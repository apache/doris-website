---
{
    "title": "metrics 信息",
    "language": "zh-CN",
    "description": "prometheus 监控采集接口"
}
---

## 请求路径

`GET /metrics?type={enum}&with_tablet={bool}`

## 描述

prometheus 监控采集接口

## 请求参数

* `type`
    输出方式，选填，默认全部输出，另有以下取值：
    
    - `core`: 只输出核心采集项
    
    - `json`: 以 json 格式输出

* `with_tablet`
    是否输出 tablet 相关的采集项，选填，默认`false`。

## 请求体

无

## 响应

    ```json
    doris_be__max_network_receive_bytes_rate LONG 60757
    doris_be__max_network_send_bytes_rate LONG 16232
    doris_be_process_thread_num LONG 1120
    doris_be_process_fd_num_used LONG 336
    ，，，

    ```
## 示例


    ```shell
        curl "http://127.0.0.1:8040/metrics?type=json&with_tablet=true"
    ```

