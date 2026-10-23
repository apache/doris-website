---
{
    "title": "Операция загрузки",
    "language": "ru",
    "description": "Upload Action в настоящее время в основном используется в веб-интерфейсе FE и позволяет пользователям загружать небольшие тестовые файлы."
}
---

# Операция загрузки {#upload-action}

:::caution Изменение поведения (4.1.4)

Из соображений безопасности все HTTP-эндпоинты Upload Action (`/api/<namespace>/<db>/<tbl>/upload`, `/api/<namespace>/<db>/<tbl>/upload/load`, `/api/<namespace>/<db>/<tbl>/upload/delete`) удалены начиная с версии **4.1.4**, а их вызов возвращает 404. Параметр конфигурации FE `http_load_submitter_max_worker_threads` также удалён.

Для загрузки небольших файлов используйте [Stream Load](../../../data-operate/import/import-way/stream-load-manual) или [INSERT INTO ... SELECT ... FROM S3/HDFS/LOCAL TVF](../../../sql-manual/sql-functions/table-valued-functions/s3).

В этом документе сохранено описание эндпоинтов для версий до 4.1.4.

:::

Upload Action в настоящее время в основном используется в веб-интерфейсе FE и позволяет пользователям загружать небольшие тестовые файлы.

## Отправка файла для загрузки {#upload-load-file}

Позволяет отправить файл на узел FE для последующей загрузки данных из него. В настоящее время поддерживаются только файлы размером до 100 МБ.

### Запрос {#request}

```
POST /api/<namespace>/<db>/<tbl>/upload
```

### Параметры пути {#path-parameters}

* `<namespace>`

    Пространство имён. В настоящее время поддерживается только `default_cluster`
        
* `<db>`

    Укажите базу данных
    
* `<tbl>`

    Укажите таблицу

### Параметры запроса {#query-parameters}

* `column_separator`

    Необязательный параметр, задающий разделитель столбцов в файле. Значение по умолчанию: `\t`
    
* `preview`

    Необязательный параметр. Если установлено значение `true`, в ответе будет показано до 10 строк данных, разделённых на столбцы в соответствии с `column_separator`.

### Тело запроса {#request-body}

Содержимое отправляемого файла. Значение Content-type: `multipart/form-data`

### Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
        "id": 1,
        "uuid": "b87824a4-f6fd-42c9-b9f1-c6d68c5964c2",
        "originFileName": "data.txt",
        "fileSize": 102400,
        "absPath": "/path/to/file/data.txt",
        "maxColNum" : 5
	},
	"count": 1
}
```

## Загрузка отправленного файла {#load-the-uploaded-file}

### Запрос {#request-1}

```
PUT /api/<namespace>/<db>/<tbl>/upload
```

### Параметры пути {#path-parameters-1}

* `<namespace>`

    Пространство имён. В настоящее время поддерживается только `default_cluster`
    
* `<db>`

    Укажите базу данных
    
* `<tbl>`

    Укажите таблицу

### Параметры запроса {#query-parameters-1}

* `file_id`

    Укажите идентификатор файла для загрузки, возвращаемый API отправки файла.

* `file_uuid`

    Укажите uuid файла, возвращаемый API отправки файла.
    
### Заголовки {#header}

Параметры заголовков совпадают с параметрами заголовков запроса Stream Load.

### Тело запроса {#request-body-1}

Отсутствует

### Ответ {#response-1}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"TxnId": 7009,
		"Label": "9dbdfb0a-120b-47a2-b078-4531498727cb",
		"Status": "Success",
		"Message": "OK",
		"NumberTotalRows": 3,
		"NumberLoadedRows": 3,
		"NumberFilteredRows": 0,
		"NumberUnselectedRows": 0,
		"LoadBytes": 12,
		"LoadTimeMs": 71,
		"BeginTxnTimeMs": 0,
		"StreamLoadPutTimeMs": 1,
		"ReadDataTimeMs": 0,
		"WriteDataTimeMs": 13,
		"CommitAndPublishTimeMs": 53
	},
	"count": 1
}
```

### Пример {#example}

```
PUT /api/default_cluster/db1/tbl1/upload?file_id=1&file_uuid=b87824a4-f6fd-42c9-b9f1-c6d68c5964c2
```
