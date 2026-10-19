---
{
    "title": "BE 버전 정보",
    "language": "ko",
    "description": "BE 버전 정보를 제공합니다"
}
---

# BE 버전 정보 {#be-version-info}

## 요청 {#request}

`GET /api/be_version_info`

## 설명 {#description}

BE 버전 정보를 제공합니다

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

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
## 예제 {#examples}


    ```
    curl http://127.0.0.1:8040/api/be_version_info

    ```
