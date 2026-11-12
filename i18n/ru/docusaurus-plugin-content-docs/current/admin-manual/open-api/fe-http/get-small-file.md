---
{
    "title": "Операция получения небольшого файла",
    "language": "ru",
    "description": "Скачивание файла из диспетчера небольших файлов по его идентификатору."
}
---

# Получение небольшого файла {#get-small-file}

## Запрос {#request}

`GET /api/get_small_file`

## Описание {#description}

Скачивание файла из диспетчера небольших файлов по его идентификатору.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `token`

    Токен кластера. Его можно посмотреть в файле `doris-meta/image/VERSION`.

* `file_id`
    
    Идентификатор файла, отображаемый в диспетчере файлов. Идентификатор файла можно посмотреть с помощью команды `SHOW FILE`.

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
< HTTP/1.1 200
< Vary: Origin
< Vary: Access-Control-Request-Method
< Vary: Access-Control-Request-Headers
< Content-Disposition: attachment;fileName=ca.pem
< Content-Type: application/json;charset=UTF-8
< Transfer-Encoding: chunked

... File Content ...
```

При ошибке возвращается:

```
{
	"msg": "File not found or is not content",
	"code": 1,
	"data": null,
	"count": 0
}
```

## Примеры {#examples}

1. Скачивание файла с указанным идентификатором

    ```
    GET /api/get_small_file?token=98e8c0a6-3a41-48b8-a72b-0432e42a7fe5&file_id=11002
    
    Response:
    
    < HTTP/1.1 200
    < Vary: Origin
    < Vary: Access-Control-Request-Method
    < Vary: Access-Control-Request-Headers
    < Content-Disposition: attachment;fileName=ca.pem
    < Content-Type: application/json;charset=UTF-8
    < Transfer-Encoding: chunked
    
    ... File Content ...
    ```
