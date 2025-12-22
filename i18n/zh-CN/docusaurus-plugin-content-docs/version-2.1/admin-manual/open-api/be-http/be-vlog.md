---
{
    "title": "调整 BE VLOG",
    "language": "zh-CN",
    "description": "该功能用于动态调整 BE 端 VLOG 日志。"
}
---

## Request

`POST /api/glog/adjust?module=<module_name>&level=<level_number>`

## Description

该功能用于动态调整 BE 端 VLOG 日志。

## Query parameters

* `module_name`
    要设置 VLOG 的模块，对应 BE 无后缀名的文件名

* `level_number`
    VLOG 级别，从 1 到 10，另外 -1 为关闭

## Request body

无

## Response

    ```json
    {
        msg: "adjust vlog of xxx from -1 to 10 succeed",
        code: 0
    }
    ```

## Examples

    ```bash
    curl -X POST "http://127.0.0.1:8040/api/glog/adjust?module=vrow_distribution&level=-1"
    ```
