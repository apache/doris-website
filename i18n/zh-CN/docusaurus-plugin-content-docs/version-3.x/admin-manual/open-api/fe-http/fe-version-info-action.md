---
{
    "title": "Fe Version Info Action",
    "language": "zh-CN",
    "description": "用于获取 fe 节点的版本信息。"
}
---

## Request

`GET /api/fe_version_info`

## Description

用于获取 fe 节点的版本信息。
    
## Path parameters

无

## Query parameters

无

## Request body

无

## Response

    ```
    {
        "msg":"success",
        "code":0,
        "data":{
            "feVersionInfo":{
                "dorisBuildVersionPrefix":"doris",
                "dorisBuildVersionMajor":0,
                "dorisBuildVersionMinor":0,
                "dorisBuildVersionPatch":0,
                "dorisBuildVersionRcVersion":"trunk",
                "dorisBuildVersion":"doris-0.0.0-trunk",
                "dorisBuildHash":"git://4b7b503d1cb3/data/doris/doris/be/../@a04f9814fe5a09c0d9e9399fe71cc4d765f8bff1",
                "dorisBuildShortHash":"a04f981",
                "dorisBuildTime":"Fri, 09 Sep 2022 07:57:02 UTC",
                "dorisBuildInfo":"root@4b7b503d1cb3",
                "dorisJavaCompileVersion":"openjdk full version \"1.8.0_332-b09\""
            }
        },
        "count":0
    }
    ```
## Examples


    ```
    GET /api/fe_version_info
    
    Response:
    {
        "msg":"success",
        "code":0,
        "data":{
            "feVersionInfo":{
                "dorisBuildVersionPrefix":"doris",
                "dorisBuildVersionMajor":0,
                "dorisBuildVersionMinor":0,
                "dorisBuildVersionPatch":0,
                "dorisBuildVersionRcVersion":"trunk",
                "dorisBuildVersion":"doris-0.0.0-trunk",
                "dorisBuildHash":"git://4b7b503d1cb3/data/doris/doris/be/../@a04f9814fe5a09c0d9e9399fe71cc4d765f8bff1",
                "dorisBuildShortHash":"a04f981",
                "dorisBuildTime":"Fri, 09 Sep 2022 07:57:02 UTC",
                "dorisBuildInfo":"root@4b7b503d1cb3",
                "dorisJavaCompileVersion":"openjdk full version \"1.8.0_332-b09\""
            }
        },
        "count":0
    }
    ```

