---
{
    "title": "Получение информации об оборудовании",
    "language": "ru",
    "description": "Это действие позволяет получить информацию об оборудовании текущего FE."
}
---

# Получение информации об оборудовании {#hardware-info-action}

## Запрос {#request}

```
GET /rest/v1/hardware_info/fe/
```

## Описание {#description}

Это действие позволяет получить информацию об оборудовании текущего FE.

## Параметры пути {#path-parameters}

Отсутствуют

## Параметры запроса {#query-parameters}

Отсутствуют

## Тело запроса {#request-body}

Отсутствует

## Ответ {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"VersionInfo": {
			"Git": "git://host/core@5bc28f4c36c20c7b424792df662fc988436e679e",
			"Version": "trunk",
			"BuildInfo": "cmy@192.168.1",
			"BuildTime": "Tuesday, 05 September 2019 11:07:42 CST"
		},
		"HardwareInfo": {
			"NetworkParameter": "...",
			"Processor": "...",
			"OS": "...",
			"Memory": "...",
			"FileSystem": "...",
			"NetworkInterface": "...",
			"Processes": "...",
			"Disk": "..."
		}
	},
	"count": 0
}
```

* Каждое значение поля `HardwareInfo` представляет собой текстовую информацию об оборудовании, отображаемую в формате html.
