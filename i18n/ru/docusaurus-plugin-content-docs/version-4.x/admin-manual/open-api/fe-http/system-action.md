---
{
    "title": "Системное действие",
    "language": "ru",
    "description": "Системное действие позволяет получать информацию о встроенной в Doris системе Proc."
}
---

# Системное действие {#system-action}

## Запрос {#request}

```
GET /rest/v1/system
```

## Описание {#description}

Системное действие позволяет получать информацию о встроенной в Doris системе Proc.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `path`

    Необязательный параметр, указывающий путь в proc

## Тело запроса {#request-body}

Нет

## Ответ {#response}

Возьмём в качестве примера `/dbs/10003/10054/partitions/10053/10055`:

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"href_columns": ["TabletId", "MetaUrl", "CompactionStatus"],
		"column_names": ["TabletId", "ReplicaId", "BackendId", "SchemaHash", "Version", "VersionHash", "LstSuccessVersion", "LstSuccessVersionHash", "LstFailedVersion", "LstFailedVersionHash", "LstFailedTime", "DataSize", "RowCount", "State", "LstConsistencyCheckTime", "CheckVersion", "CheckVersionHash", "VersionCount", "PathHash", "MetaUrl", "CompactionStatus"],
		"rows": [{
			"SchemaHash": "1294206575",
			"LstFailedTime": "\\N",
			"LstFailedVersion": "-1",
			"MetaUrl": "URL",
			"__hrefPaths": ["http://192.168.100.100:8030/rest/v1/system?path=/dbs/10003/10054/partitions/10053/10055/10056", "http://192.168.100.100:8043/api/meta/header/10056", "http://192.168.100.100:8043/api/compaction/show?tablet_id=10056"],
			"CheckVersionHash": "-1",
			"ReplicaId": "10057",
			"VersionHash": "4611804212003004639",
			"LstConsistencyCheckTime": "\\N",
			"LstSuccessVersionHash": "4611804212003004639",
			"CheckVersion": "-1",
			"Version": "6",
			"VersionCount": "2",
			"State": "NORMAL",
			"BackendId": "10032",
			"DataSize": "776",
			"LstFailedVersionHash": "0",
			"LstSuccessVersion": "6",
			"CompactionStatus": "URL",
			"TabletId": "10056",
			"PathHash": "-3259732870068082628",
			"RowCount": "21"
		}]
	},
	"count": 1
}
```

В разделе данных `column_names` содержит информацию о заголовках столбцов, а `href_columns` указывает, какие столбцы таблицы содержат гиперссылки. Каждый элемент массива `rows` представляет одну строку. Поле `__hrefPaths` содержит не данные таблицы, а URL гиперссылок, которые по порядку соответствуют столбцам в `href_columns`.
