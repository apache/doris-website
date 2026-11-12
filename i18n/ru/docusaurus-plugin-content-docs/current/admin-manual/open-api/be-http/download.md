---
{
    "title": "Скачивание журнала ошибок загрузки",
    "language": "ru",
    "description": "Скачивание файла журнала ошибок загрузки"
}
---

# Скачивание журнала ошибок загрузки {#download-log-about-load-error}

## Запрос {#request}

`GET /api/_load_error_log?token={string}&file={string}`

## Описание {#description}

Скачивание файла журнала ошибок загрузки

## Параметры запроса {#query-parameters}

* `file`
    Путь к журналу

* `token`
    Токен         

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

    File of log

## Примеры {#examples}


    ```
    curl "http://127.0.0.1:8040/api/_load_error_log?file=a&token=1"
    ```
