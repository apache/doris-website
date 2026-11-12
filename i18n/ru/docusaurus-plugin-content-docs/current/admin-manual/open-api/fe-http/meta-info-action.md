---
{
    "title": "Получение метаданных | Fe Http",
    "language": "ru",
    "description": "Meta Info Action используется для получения метаданных кластера, например списка баз данных, структуры таблиц и т. д.",
    "sidebar_label": "Получение метаданных"
}
---

# Получение метаданных {#meta-info-action}

Meta Info Action используется для получения метаданных кластера, например списка баз данных, структуры таблиц и т. д.

## Список баз данных {#list-database}

### Запрос {#request}

```
GET /api/meta/namespaces/<ns_name>/databases
```

### Описание {#description}

Получение списка имён всех баз данных в алфавитном порядке.

### Параметры пути {#path-parameters}

Нет

### Параметры запроса {#query-parameters}

* `limit`

    Ограничивает количество возвращаемых строк результата
    
* `offset`

    Параметр постраничного вывода, который необходимо использовать вместе с `limit`
    
### Тело запроса {#request-body}

Нет

### Ответ {#response}

```
{
	"msg": "OK",
	"code": 0,
	"data": [
	   "db1", "db2", "db3", ...  
	],
	"count": 3
}
```

* В поле data возвращается список имён баз данных.

## Список таблиц {#list-table}

### Запрос {#request-1}

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables
```

### Описание {#description-1}

Получение списка таблиц указанной базы данных в алфавитном порядке.

### Параметры пути {#path-parameters-1}

* `<db_name>`

    Указывает базу данных

### Параметры запроса {#query-parameters-1}

* `limit`

    Ограничивает количество возвращаемых строк результата
    
* `offset`

    Параметр постраничного вывода, который необходимо использовать вместе с `limit`

### Тело запроса {#request-body-1}

Нет

### Ответ {#response-1}

```
{
	"msg": "OK",
	"code": 0,
	"data": [
	   "tbl1", "tbl2", "tbl3", ...  
	],
	"count": 0
}
```

* В поле data возвращается список имён таблиц.

## Сведения о схеме {#schema-info}

### Запрос {#request-2}

```
GET /api/meta/namespaces/<ns_name>/databases/<db_name>/tables/<tbl_name>/schema
```

### Описание {#description-2}

Получение сведений о структуре указанной таблицы в указанной базе данных.

### Параметры пути {#path-parameters-2}

* `<db_name>`

    Указывает имя базы данных
    
* `<tbl_name>`

    Указывает имя таблицы

### Параметры запроса {#query-parameters-2}

* `with_mv`

    Необязательный параметр. Если он не указан, по умолчанию возвращается структура базовой таблицы. Если указан, также возвращаются все индексы rollup.

### Тело запроса {#request-body-2}

Нет

### Ответ {#response-2}

```
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema

{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": {
			"schema": [{
					"Field": "k1",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				},
				{
					"Field": "k2",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				}
			],
			"is_base": true
		}
	},
	"count": 0
}
```

```
GET /api/meta/namespaces/default/databases/db1/tables/tbl1/schema?with_mv=1

{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": {
			"schema": [{
					"Field": "k1",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				},
				{
					"Field": "k2",
					"Type": "INT",
					"Null": "Yes",
					"Extra": "",
					"Default": null,
					"Key": "true"
				}
			],
			"is_base": true
		},
		"rollup1": {
			"schema": [{
				"Field": "k1",
				"Type": "INT",
				"Null": "Yes",
				"Extra": "",
				"Default": null,
				"Key": "true"
			}],
			"is_base": false
		}
	},
	"count": 0
}
```

* В поле data возвращаются сведения о структуре базовой таблицы или таблицы rollup.
