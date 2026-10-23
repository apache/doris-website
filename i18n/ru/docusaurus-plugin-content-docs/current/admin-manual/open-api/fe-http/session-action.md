---
{
    "title": "Получение информации о сеансах",
    "language": "ru",
    "description": "Эта операция позволяет получить информацию о текущем сеансе."
}
---

# Получение информации о сеансах {#session-action}

## Запрос {#request}

`GET /rest/v1/session`

`GET /rest/v1/session/all`

## Описание {#description}

Эта операция позволяет получить информацию о текущем сеансе.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

Нет

## Получение информации о текущем сеансе {#obtain-the-current-session-information}

`GET /rest/v1/session`

## Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"column_names": ["Id", "User", "Host", "Cluster", "Db", "Command", "Time", "State", "Info"],
		"rows": [{
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.89:31465",
			"Time": "230",
			"Id": "0",
			"Info": "",
			"Db": "db1"
		}]
	},
	"count": 2
}
```

## Получение информации о сеансах всех FE {#obtain-all-fe-session-information}

`GET /rest/v1/session/all`

## Ответ {#response-1}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"column_names": ["FE", "Id", "User", "Host", "Cluster", "Db", "Command", "Time", "State", "Info"],
		"rows": [{
		    "FE": "10.14.170.23",
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.89:31465",
			"Time": "230",
			"Id": "0",
			"Info": "",
			"Db": "db1"
		},
		{
            "FE": "10.14.170.24",
			"User": "root",
			"Command": "Sleep",
			"State": "",
			"Cluster": "default_cluster",
			"Host": "10.81.85.88:61465",
			"Time": "460",
			"Id": "1",
			"Info": "",
			"Db": "db1"
		}]
	},
	"count": 2
}
```

Возвращаемый результат совпадает с результатом `System Action` и представляет собой описание таблицы.
