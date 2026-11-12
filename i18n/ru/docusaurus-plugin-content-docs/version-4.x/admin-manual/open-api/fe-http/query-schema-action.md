---
{
    "title": "Операция получения схемы запроса",
    "language": "ru",
    "description": "Операция получения схемы запроса позволяет получить оператор создания таблицы, используемой в заданном SQL-запросе. Её можно использовать для локального тестирования некоторых сценариев запросов."
}
---

# Операция получения схемы запроса {#query-schema-action}


## Запрос {#request}

```
POST /api/query_schema/<ns_name>/<db_name>
```

## Описание {#description}

Операция получения схемы запроса позволяет получить оператор создания таблицы, используемой в заданном SQL-запросе. Её можно использовать для локального тестирования некоторых сценариев запросов.

Этот API появился в версии 1.2.

## Параметры пути {#path-parameters}

* `<db_name>`

    Укажите имя базы данных. Эта база данных будет использоваться по умолчанию в текущем сеансе, если имя таблицы в SQL не дополнено именем базы данных.

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

```
text/plain

sql
```

* Поле "sql" содержит строку SQL.

## Ответ {#response}

* Возвращаемое значение

    ```
    CREATE TABLE `tbl1` (
      `k1` int(11) NULL,
      `k2` int(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`k1`, `k2`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`k1`) BUCKETS 3
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "in_memory" = "false",
    "storage_format" = "V2",
    "disable_auto_compaction" = "false"
    );
    
    CREATE TABLE `tbl2` (
      `k1` int(11) NULL,
      `k2` int(11) NULL
    ) ENGINE=OLAP
    DUPLICATE KEY(`k1`, `k2`)
    COMMENT 'OLAP'
    DISTRIBUTED BY HASH(`k1`) BUCKETS 3
    PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "in_memory" = "false",
    "storage_format" = "V2",
    "disable_auto_compaction" = "false"
    );
    ```

## Пример {#example}

1. Запишите SQL в локальный файл 1.sql

    ```
    select tbl1.k2 from tbl1 join tbl2 on tbl1.k1 = tbl2.k1;
    ```
    
2. С помощью curl получите оператор создания таблицы.

    ```
    curl -X POST -H 'Content-Type: text/plain'  -uroot: http://127.0.0.1:8030/api/query_schema/internal/db1 -d@1.sql
    ```
