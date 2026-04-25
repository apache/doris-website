---
{
    "title": "Be Version Info",
    "language": "en",
    "description": "Provide BE version info"
}
---

# Be Version Info

## Request

`GET /api/be_version_info`

## Description

Provide BE version info

## Query parameters

None

## Request body

None

## Response

    ```
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
## Examples


    ```
    curl http://127.0.0.1:8040/api/be_version_info
    
    ```

