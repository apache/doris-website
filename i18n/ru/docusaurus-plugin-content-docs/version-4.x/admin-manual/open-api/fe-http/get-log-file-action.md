---
{
    "title": "Получение файла журнала FE",
    "language": "ru",
    "description": "Пользователи могут получать файлы журналов FE через HTTP-интерфейс."
}
---

# Получение файла журнала FE {#get-fe-log-file}

## Запрос {#request}

`HEAD /api/get_log_file`

`GET /api/get_log_file`

## Описание {#description}

Пользователи могут получать файлы журналов FE через HTTP-интерфейс.

Запрос HEAD используется для получения списка файлов журналов указанного типа. Запрос GET используется для скачивания указанного файла журнала.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `type`

    Укажите тип журнала. Поддерживаются следующие типы:
    
    * `fe.audit.log`: Журнал аудита Frontend.

* `file`

    Укажите имя файла


## Тело запроса {#request-body}

Нет

## Ответ {#response}

* `HEAD`

    ```
    HTTP/1.1 200 OK
    file_infos: {"fe.audit.log":24759,"fe.audit.log.20190528.1":132934}
    content-type: text/html
    connection: keep-alive
    ```
    
    В заголовке ответа перечислены все текущие файлы журналов указанного типа и размер каждого файла.
    
* `GET`

    Скачивание указанного файла журнала в текстовом формате
    
## Примеры {#examples}

1. Получение списка файлов журналов соответствующего типа

    ```
    HEAD /api/get_log_file?type=fe.audit.log
    
    Response:
    
    HTTP/1.1 200 OK
    file_infos: {"fe.audit.log":24759,"fe.audit.log.20190528.1":132934}
    content-type: text/html
    connection: keep-alive
    ```
    
    В заголовке ответа поле `file_infos` содержит список файлов и размер каждого файла (в байтах) в формате JSON
    
2. Скачивание файла журнала
    
    ```
    GET /api/get_log_file?type=fe.audit.log&file=fe.audit.log.20190528.1
    
    Response:
    
    < HTTP/1.1 200
    < Vary: Origin
    < Vary: Access-Control-Request-Method
    < Vary: Access-Control-Request-Headers
    < Content-Disposition: attachment;fileName=fe.audit.log
    < Content-Type: application/octet-stream;charset=UTF-8
    < Transfer-Encoding: chunked
    
    ... File Content ...
    ```
