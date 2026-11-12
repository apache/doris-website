---
{
    "title": "Информация о версии BE",
    "language": "ru",
    "description": "Предоставляет информацию о версии BE"
}
---

# Информация о версии BE {#be-version-info}

## Запрос {#request}

`GET /api/be_version_info`

## Описание {#description}

Предоставляет информацию о версии BE

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

Нет

## Ответ {#response}

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
## Примеры {#examples}


    ```
    curl http://127.0.0.1:8040/api/be_version_info
    
    ```
