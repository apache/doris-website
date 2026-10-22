---
{
    "title": "Действия с профилем запроса | Fe Http",
    "language": "ru",
    "description": "Документация REST API Doris FE для работы с профилями запросов. Поддерживает получение информации о запросах, профилей выполнения и статистики в реальном времени через HTTP, а также мониторинг и управление выполняющимися запросами.",
    "sidebar_label": "Действия с профилем запроса"
}
---

# Действия с профилем запроса {#query-profile-action}

## Запрос {#request}

`GET /rest/v2/manager/query/query_info`

`GET /rest/v2/manager/query/trace_id/{trace_id}`

`GET /rest/v2/manager/query/sql/{query_id}`

`GET /rest/v2/manager/query/profile/text/{query_id}`

`GET /rest/v2/manager/query/profile/graph/{query_id}`

`GET /rest/v2/manager/query/profile/json/{query_id}`

`GET /rest/v2/manager/query/profile/fragments/{query_id}`

`GET /rest/v2/manager/query/current_queries`

`GET /rest/v2/manager/query/kill/{query_id}`

`GET /rest/v2/manager/query/statistics/{trace_id}` (4.0.0+)

## Получение информации о запросах {#get-the-query-information}

`GET /rest/v2/manager/query/query_info`

### Описание {#description}

Возвращает информацию о запросах SELECT для всех узлов FE в кластере.

### Параметры запроса {#query-parameters}

* `query_id`

    Необязательный параметр, задающий идентификатор запроса, информацию о котором нужно вернуть. По умолчанию возвращается информация обо всех запросах.
    
* `search`

    Необязательный параметр, задающий строку для поиска в информации о запросах. В настоящее время поддерживается только сопоставление строк.

* `is_all_node`
  
    Необязательный параметр. Если true, возвращается информация о запросах всех узлов FE; если false, возвращается информация о запросах текущего узла FE. По умолчанию true.


### Ответ {#response}

```json
{
   "msg": "success",  
    "code": 0,  
    "data": {  
        "column_names": [  
            "Query ID",  
            "FE Node",  
            "Query User",  
            "Execution Database",  
            "Sql",  
            "Query Type",  
            "Start Time",  
            "End Time",  
            "Execution Duration",  
            "Status"  
        ],  
        "rows": [  
            [  
                ...  
            ]  
        ]  
    },  
    "count": 0  
}
```

:::info Примечание

Начиная с версии Doris 1.2 пользователи Admin и Root могут просматривать все запросы. Обычные пользователи могут просматривать только запросы, отправленные ими самими.

:::



### Примеры {#examples}

```json
GET /rest/v2/manager/query/query_info

{
    "msg": "success",  
    "code": 0,  
    "data": {  
        "column_names": [  
            "Query ID",  
            "FE Node",  
            "Query User",  
            "Execution Database",  
            "Sql",  
            "Query Type",  
            "Start Time",  
            "End Time",  
            "Execution Duration",  
            "Status"  
        ],  
        "rows": [  
            [  
                "d7c93d9275334c35-9e6ac5f295a7134b",  
                "127.0.0.1:8030",  
                "root",  
                "default_cluster:testdb",  
                "select c.id, c.name, p.age, p.phone, c.date, c.cost from cost c join people p on c.id = p.id where p.age > 20 order by c.id",  
                "Query",  
                "2021-07-29 16:59:12",  
                "2021-07-29 16:59:12",  
                "109ms",  
                "EOF"  
            ]  
        ]  
    },  
    "count": 0  
}
```

## Получение идентификатора запроса по Trace ID {#get-query-id-by-trace-id}

`GET /rest/v2/manager/query/trace_id/{trace_id}`

### Описание {#description-1}

Возвращает идентификатор запроса по Trace ID.

Перед выполнением запроса задайте уникальный Trace ID:

`set session_context="trace_id:your_trace_id";`

После выполнения запроса в той же сессии его идентификатор можно получить по Trace ID.

### Параметры пути {#path-parameters}

* `{trace_id}`

    Trace ID, заданный пользователем.

### Параметры запроса {#query-parameters-1}

### Ответ {#response-1}

```json
{
    "msg": "success", 
    "code": 0, 
    "data": "fb1d9737de914af1-a498d5c5dec638d3", 
    "count": 0
}
```

:::note Информация

Начиная с версии Doris 1.2 пользователи admin и root могут просматривать все запросы. Обычные пользователи могут просматривать только запросы, отправленные ими самими. Если указанный Trace ID не существует или у пользователя нет прав доступа, возвращается Bad Request:

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::


## Получение SQL и текстового профиля указанного запроса {#get-the-sql-and-text-profile-for-the-specified-query}

`GET /rest/v2/manager/query/sql/{query_id}`

`GET /rest/v2/manager/query/profile/text/{query_id}`

### Описание {#description-2}

Возвращает SQL и текстовый профиль запроса с указанным идентификатором.

### Параметры пути {#path-parameters-1}

* `query_id`

    Идентификатор запроса.

### Параметры запроса {#query-parameters-2}

* `is_all_node`
  
    Необязательный параметр. Если true, запрос с указанным идентификатором ищется на всех узлах FE; если false, поиск выполняется на узлах FE, к которым установлено текущее подключение. По умолчанию true.

### Ответ {#response-2}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "sql": ""
    },
    "count": 0
}
```

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "profile": ""
    },
    "count": 0
}
```

:::note Информация

Начиная с версии Doris 1.2 пользователи admin и root могут просматривать все запросы. Обычные пользователи могут просматривать только запросы, отправленные ими самими. Если указанный Trace ID не существует или у пользователя нет прав доступа, возвращается Bad Request:

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```

:::

### Примеры {#examples-1}

1. Получение SQL.

    ```json
    GET /rest/v2/manager/query/sql/d7c93d9275334c35-9e6ac5f295a7134b
    
    Response:
    {
        "msg": "success",
        "code": 0,
        "data": {
            "sql": "select c.id, c.name, p.age, p.phone, c.date, c.cost from cost c join people p on c.id = p.id where p.age > 20 order by c.id"
        },
        "count": 0
    }
    ```

## Получение информации о фрагментах и экземплярах указанного запроса {#get-the-specified-query-fragment-and-instance-information}

`GET /rest/v2/manager/query/profile/fragments/{query_id}`

:::caution

Начиная с версии 2.1.1 этот API устарел. Профиль по-прежнему можно скачать по адресу http://<fe_ip>:<fe_http_port>/QueryProfile

:::

### Описание {#description-3}

Возвращает имя фрагмента, идентификатор экземпляра, IP-адрес и порт хоста, а также время выполнения для запроса с указанным идентификатором.

### Параметры пути {#path-parameters-2}

* `query_id`

    Идентификатор запроса.

### Параметры запроса {#query-parameters-3}

* `is_all_node`
  
    Необязательный параметр. Если true, запрос с указанным идентификатором ищется на всех узлах FE; если false, поиск выполняется на узлах FE, к которым установлено текущее подключение. По умолчанию true.

### Ответ {#response-3}

```json
{
    "msg": "success",
    "code": 0,
    "data": [
        {
            "fragment_id": "",
            "time": "",
            "instance_id": {
                "": {
                  "host": "",
                  "active_time": ""
                }
            }
        }
    ],
    "count": 0
}
```

:::note Информация

Начиная с версии Doris 1.2 пользователи admin и root могут просматривать все запросы. Обычные пользователи могут просматривать только запросы, отправленные ими самими. Если указанный Trace ID не существует или у пользователя нет прав доступа, возвращается Bad Request:

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::


### Примеры {#examples-2}

```json
GET /rest/v2/manager/query/profile/fragments/d7c93d9275334c35-9e6ac5f295a7134b

Response:
{
    "msg": "success",
    "code": 0,
    "data": [
        {
            "fragment_id": "0",
            "time": "36.169ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134e": {
                    "host": "172.19.0.4:9060",
                    "active_time": "36.169ms"
                }
            }
        },
        {
            "fragment_id": "1",
            "time": "20.710ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134c": {
                    "host": "172.19.0.5:9060",
                    "active_time": "20.710ms"
                }
            }
        },
        {
            "fragment_id": "2",
            "time": "7.83ms",
            "instance_id": {
                "d7c93d9275334c35-9e6ac5f295a7134d": {
                    "host": "172.19.0.6:9060",
                    "active_time": "7.83ms"
                },
                "d7c93d9275334c35-9e6ac5f295a7134f": {
                    "host": "172.19.0.7:9060",
                    "active_time": "10.873ms"
                }
            }
        }
    ],
    "count": 0
}
```

## Получение древовидного профиля указанного запроса {#get-the-specified-query-id-tree-profile-information}

`GET /rest/v2/manager/query/profile/graph/{query_id}`

### Описание {#description-4}

Возвращает древовидный профиль запроса с указанным идентификатором, как и команда `show query profile`.

### Параметры пути {#path-parameters-3}

* `query_id`

    Идентификатор запроса.

### Параметры запроса {#query-parameters-4}

* `fragment_id` и `instance_id`

    Необязательные параметры. Нужно либо указать оба параметра, либо не указывать ни один.  
    Если оба параметра не указаны, возвращается упрощённое дерево профилей, что эквивалентно `show query profile '/query_id'`;  
    Если указаны оба параметра, возвращается подробное дерево профилей, что эквивалентно `show query profile '/query_id/fragment_id/instance_id'`.

* `is_all_node`
  
    Необязательный параметр. Если true, информация о запросе с указанным идентификатором запрашивается на всех узлах FE; если false, информация запрашивается на узлах FE, к которым установлено текущее подключение. По умолчанию true.

### Ответ {#response-4}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "graph":""
    },
    "count": 0
}
```

:::note Информация

Начиная с версии Doris 1.2 пользователи admin и root могут просматривать все запросы. Обычные пользователи могут просматривать только запросы, отправленные ими самими. Если указанный Trace ID не существует или у пользователя нет прав доступа, возвращается Bad Request:

```json
{
    "msg": "Bad Request", 
    "code": 403, 
    "data": "error messages",
    "count": 0
}
```
:::



## Выполняющиеся запросы {#current-running-queries}

`GET /rest/v2/manager/query/current_queries`

### Описание {#description-5}

Возвращает выполняющиеся запросы со статистикой выполнения. Эта конечная точка использует то же представление статистики, что и `SHOW PROC "/current_queries"` и `SHOW PROC "/current_query_stmts"`, предоставляя сведения о ходе выполнения задач и метрики ресурсов (scan/cpu/memory/shuffle/spill/cache). Доступно с версии 4.1.1+.

### Параметры пути {#path-parameters-4}

### Параметры запроса {#query-parameters-5}

* `is_all_node`
  
    Необязательный параметр. Если true, возвращаются выполняющиеся запросы со всех FE. По умолчанию true.

### Ответ {#response-5}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "columnNames": [
            "Frontend", "QueryId", "ConnectionId", "Catalog", "Database",
            "User", "ExecTime", "SqlHash", "Statement",
            "ScanRows", "ScanBytes", "ProcessRows", "CpuMs",
            "MaxPeakMemoryBytes", "CurrentUsedMemoryBytes", "WorkloadGroupId",
            "ShuffleSendBytes", "ShuffleSendRows",
            "ScanBytesFromLocalStorage", "ScanBytesFromRemoteStorage",
            "SpillWriteBytesToLocalStorage", "SpillReadBytesFromLocalStorage",
            "BytesWriteIntoCache",
            "TotalTasks", "FinishedTasks", "Progress"
        ],
        "rows": [
            [
                "172.19.0.3", "108e47ab438a4560-ab1651d16c036491", "2", "internal",
                "testdb", "root", "6074",
                "1a35f62f4b14b9d7961b057b77c3102f", "select sleep(60)",
                "0", "0.00", "0", "0",
                "0.00", "0.00", "0",
                "0.00", "0",
                "0.00", "0.00",
                "0.00", "0.00",
                "0.00",
                "1", "1", "100%"
            ]
        ]
    },
    "count": 0
}
```

| Столбец | Описание |
| ------ | ----------- |
| Frontend | Узел FE, обрабатывающий запрос |
| QueryId | Уникальный идентификатор запроса |
| ConnectionId | Идентификатор соединения MySQL |
| Catalog | Имя Catalog |
| Database | Имя схемы/базы данных |
| User | Пользователь, отправивший запрос |
| ExecTime | Время выполнения в миллисекундах |
| SqlHash | Хеш MD5 инструкции SQL |
| Statement | Текст инструкции SQL |
| ScanRows | Общее число строк, просканированных в хранилище |
| ScanBytes | Общее число байтов, просканированных в хранилище |
| ProcessRows | Строки, обработанные конвейером выполнения |
| CpuMs | Затраченное процессорное время в миллисекундах |
| MaxPeakMemoryBytes | Максимальный объём памяти, использованный во время выполнения |
| CurrentUsedMemoryBytes | Объём памяти, используемой запросом в данный момент |
| WorkloadGroupId | Идентификатор группы рабочей нагрузки |
| ShuffleSendBytes | Общее число байтов, отправленных через shuffle |
| ShuffleSendRows | Общее число строк, отправленных через shuffle |
| ScanBytesFromLocalStorage | Число байтов, просканированных в локальном хранилище |
| ScanBytesFromRemoteStorage | Число байтов, просканированных в удалённом хранилище (например, HDFS, S3) |
| SpillWriteBytesToLocalStorage | Число байтов, записанных на локальный диск при spill |
| SpillReadBytesFromLocalStorage | Число байтов, прочитанных обратно с локального диска после spill |
| BytesWriteIntoCache | Число байтов, записанных в кеш |
| TotalTasks | Общее число задач конвейера выполнения для этого запроса |
| FinishedTasks | Число завершённых задач конвейера выполнения |
| Progress | Рассчитанный прогресс выполнения запроса (FinishedTasks / TotalTasks) |

## Отмена запроса {#cancel-query}

`POST /rest/v2/manager/query/kill/{query_id}`

### Описание {#description-6}

Отменяет запрос указанного соединения.

### Параметры пути {#path-parameters-5}

* `{query_id}`

    Идентификатор запроса. Его можно получить через API `trance_id`.

### Параметры запроса {#query-parameters-6}

### Ответ {#response-6}

```json
{
    "msg": "success",
    "code": 0,
    "data": null,
    "count": 0
}
```

## Получение прогресса выполнения запроса по Trace ID {#get-query-progress-by-trace-id}

`GET /rest/v2/manager/query/statistics/{trace_id}` (4.0.0+)

### Описание {#description-7}

Возвращает статистику выполняющегося запроса по Trace ID. Этот API можно вызывать периодически, чтобы отслеживать ход выполнения запроса.

### Параметры пути {#path-parameters-6}

* `{trace_id}`

    Trace ID. Заданный пользователем Trace ID, установленный с помощью `SET session_context="trace_id:xxxx"`.

### Ответ {#response-7}

```json
{
    "msg": "success",
    "code": 0,
    "data": {
        "scanRows": 1234567,
        "scanBytes": 987654321,
        "returnedRows": 12345,
        "processRows": 2345678,
        "cpuMs": 15600,
        "maxPeakMemoryBytes": 536870912,
        "currentUsedMemoryBytes": 268435456,
        "shuffleSendBytes": 104857600,
        "shuffleSendRows": 50000,
        "scanBytesFromLocalStorage": 734003200,
        "scanBytesFromRemoteStorage": 253651121,
        "spillWriteBytesToLocalStorage": 0,
        "spillReadBytesFromLocalStorage": 0,
        "bytesWriteIntoCache": 0,
        "totalTasksNum": 74,
        "finishedTasksNum": 51,
        "progress": "68%"
    },
    "count": 0
}
```
