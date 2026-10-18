---
{
    "title": "FE 버전 정보 액션",
    "language": "ko",
    "description": "FE 호스트에서 FE 버전 정보를 가져옵니다."
}
---

# FE 버전 정보 액션 {#fe-version-info-action}

## 요청 {#request}

`GET /api/fe_version_info`

## 설명 {#description}

FE 호스트에서 FE 버전 정보를 가져옵니다.

## 경로 매개변수 {#path-parameters}

없음.

## 쿼리 매개변수 {#query-parameters}

없음.

## 요청 본문 {#request-body}

없음.

## 응답 {#response}

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
## 예제 {#examples}


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
