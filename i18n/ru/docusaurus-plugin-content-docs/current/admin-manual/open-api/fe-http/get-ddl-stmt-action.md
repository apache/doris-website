---
{
    "title": "Получение DDL-оператора",
    "language": "ru",
    "description": "Позволяет получить операторы создания таблицы, создания разделов и rollup для указанной таблицы."
}
---

# Получение DDL-оператора {#get-ddl-statement-action}

## Запрос {#request}

`GET /api/_get_ddl`

## Описание {#description}

Позволяет получить операторы создания таблицы, создания разделов и rollup для указанной таблицы.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `db`

    Укажите базу данных

* `table`
    
    Укажите таблицу

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
	"msg": "OK",
	"code": 0,
	"data": {
		"create_partition": ["ALTER TABLE `tbl1` ADD PARTITION ..."],
		"create_table": ["CREATE TABLE `tbl1` ..."],
		"create_rollup": ["ALTER TABLE `tbl1` ADD ROLLUP ..."]
	},
	"count": 0
}
```

## Примеры {#examples}

1. Получение DDL-оператора указанной таблицы

    ```
    GET /api/_get_ddl?db=db1&table=tbl1
    
    Response
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"create_partition": [],
    		"create_table": ["CREATE TABLE `tbl1` (\n  `k1` int(11) NULL COMMENT \"\",\n  `k2` int(11) NULL COMMENT \"\"\n) ENGINE=OLAP\nDUPLICATE KEY(`k1`, `k2`)\nCOMMENT \"OLAP\"\nDISTRIBUTED BY HASH(`k1`) BUCKETS 1\nPROPERTIES (\n\"replication_num\" = \"1\",\n\"version_info\" = \"1,0\",\n\"in_memory\" = \"false\",\n\"storage_format\" = \"DEFAULT\"\n);"],
    		"create_rollup": []
    	},
    	"count": 0
    }
    ```
