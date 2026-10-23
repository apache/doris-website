---
{
    "title": "Проверка состояния",
    "language": "ru",
    "description": "Возвращает количество работающих узлов BE в кластере и количество недоступных узлов BE."
}
---

# Проверка состояния {#health-action}

## Запрос {#request}

`GET /api/health`

## Описание {#description}

Возвращает количество работающих узлов BE в кластере и количество недоступных узлов BE.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

Нет

## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"online_backend_num": 10,
		"total_backend_num": 10
	},
	"count": 0
}
```
