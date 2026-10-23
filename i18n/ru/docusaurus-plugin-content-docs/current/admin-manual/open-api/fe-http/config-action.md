---
{
    "title": "Действие Config",
    "language": "ru",
    "description": "Действие Config используется для получения информации о текущей конфигурации FE."
}
---

# Действие Config {#config-action}

## Запрос {#request}

```
GET /rest/v1/config/fe/
```

## Описание {#description}

Действие Config используется для получения информации о текущей конфигурации FE.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `conf_item`

    Необязательный параметр. Возвращает указанный элемент конфигурации FE.

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"column_names": ["Name", "Value"],
		"rows": [{
			"Value": "DAY",
			"Name": "sys_log_roll_interval"
		}, {
			"Value": "23",
			"Name": "consistency_check_start_time"
		}, {
			"Value": "4096",
			"Name": "max_mysql_service_task_threads_num"
		}, {
			"Value": "1000",
			"Name": "max_unfinished_load_job"
		}, {
			"Value": "100",
			"Name": "max_routine_load_job_num"
		}, {
			"Value": "SYNC",
			"Name": "master_sync_policy"
		}]
	},
	"count": 0
}
```

Возвращаемый результат совпадает с результатом `System Action`. Он представляет собой описание таблицы.
