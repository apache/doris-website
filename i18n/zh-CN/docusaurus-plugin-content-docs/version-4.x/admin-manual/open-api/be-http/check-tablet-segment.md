---
{
    "title": "检查 tablet 文件丢失",
    "language": "zh-CN",
    "description": "在 BE 节点上，可能会因为一些异常情况导致数据文件丢失，但是元数据显示正常，这种副本异常不会被 FE 检测到，也不能被修复。 当用户查询时，会报错failed to initialize storage reader。该接口的功能是检测出当前 BE 节点上所有存在文件丢失的 tablet。"
}
---

## 请求路径

`GET /api/check_tablet_segment_lost?repair={bool}`

## 描述

在 BE 节点上，可能会因为一些异常情况导致数据文件丢失，但是元数据显示正常，这种副本异常不会被 FE 检测到，也不能被修复。
当用户查询时，会报错`failed to initialize storage reader`。该接口的功能是检测出当前 BE 节点上所有存在文件丢失的 tablet。

## 请求参数

* `repair`

    - 设置为`true`时，存在文件丢失的 tablet 都会被设为`SHUTDOWN`状态，该副本会被作为坏副本处理，进而能够被 FE 检测和修复。
    
    - 设置为`false`时，只会返回所有存在文件丢失的 tablet，并不做任何处理。

## 请求体

无

## 响应

    返回值是当前BE节点上所有存在文件丢失的tablet

    ```
    {
        status: "Success",
        msg: "Succeed to check all tablet segment",
        num: 3,
        bad_tablets: [
            11190,
            11210,
            11216
        ],
        set_bad: true,
        host: "172.3.0.101"
    }
    ```

## 示例


    ```shell
    curl http://127.0.0.1:8040/api/check_tablet_segment_lost?repair=false
    ```

