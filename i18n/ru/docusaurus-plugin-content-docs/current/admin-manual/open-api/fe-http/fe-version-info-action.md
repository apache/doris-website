---
{
    "title": "Операция получения информации о версии FE",
    "language": "ru",
    "description": "Получение информации о версии FE с узла FE."
}
---

# Операция получения информации о версии FE {#fe-version-info-action}

## Запрос {#request}

`GET /api/fe_version_info`

## Описание {#description}

Получение информации о версии FE с узла FE.

## Параметры пути {#path-parameters}

Нет.

## Параметры запроса {#query-parameters}

Нет.

## Тело запроса {#request-body}

Нет.

## Ответ {#response}

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
## Примеры {#examples}


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
