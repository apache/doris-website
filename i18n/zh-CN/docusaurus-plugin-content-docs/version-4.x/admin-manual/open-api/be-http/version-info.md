---
{
    "title": "BE 版本信息",
    "language": "zh-CN",
    "description": "用于获取 be 节点的版本信息。"
}
---

## 请求路径

`GET /api/be_version_info`

## 描述

用于获取 be 节点的版本信息。
    
## Path parameters

无

## 请求参数

无

## 请求体

无

## 响应

    ```json
    {
        "msg":"success",
        "code":0,
        "data":{
            "beVersionInfo":{
                "dorisBuildVersionPrefix":"doris",
                "dorisBuildVersionMajor":0,
                "dorisBuildVersionMinor":0,
                "dorisBuildVersionPatch":0,
                "dorisBuildVersionRcVersion":"trunk",
                "dorisBuildVersion":"doris-0.0.0-trunk",
                "dorisBuildHash":"git://4b7b503d1cb3/data/doris/doris/be/../@a04f9814fe5a09c0d9e9399fe71cc4d765f8bff1",
                "dorisBuildShortHash":"a04f981",
                "dorisBuildTime":"Fri, 09 Sep 2022 07:57:02 UTC",
                "dorisBuildInfo":"root@4b7b503d1cb3"
            }
        },
        "count":0
    }
    ```
## 示例


    ```
    curl http://127.0.0.1:8040/api/be_version_info
    
    ```

