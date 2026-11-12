---
{
    "title": "Операции с журналом",
    "language": "ru",
    "description": "Метод GET используется для получения последнего фрагмента журнала Doris уровня WARNING, а метод POST используется для динамического изменения уровня журналирования FE."
}
---

# Операции с журналом {#log-action}

## Запрос {#request}

```
GET /rest/v1/log
```

## Описание {#description}

Метод GET используется для получения последнего фрагмента журнала Doris уровня WARNING, а метод POST используется для динамического изменения уровня журналирования FE.

## Параметры пути {#path-parameters}

Нет

## Параметры запроса {#query-parameters}

* `add_verbose`

    Необязательный параметр для метода POST. Включает журналирование уровня DEBUG для указанного пакета.
    
* `del_verbose`

    Необязательный параметр для метода POST. Отключает журналирование уровня DEBUG для указанного пакета.
    
## Тело запроса {#request-body}

Нет

## Ответ {#response}

```
GET /rest/v1/log

{
	"msg": "success",
	"code": 0,
	"data": {
		"LogContents": {
			"logPath": "/home/disk1/cmy/git/doris/core-for-ui/output/fe/log/fe.warn.log",
			"log": "<pre>2020-08-26 15:54:30,081 WARN (UNKNOWN 10.81.85.89_9213_1597652404352(-1)|1) [Catalog.notifyNewFETypeTransfer():2356] notify new FE type transfer: UNKNOWN</br>2020-08-26 15:54:32,089 WARN (RepNode 10.81.85.89_9213_1597652404352(-1)|61) [Catalog.notifyNewFETypeTransfer():2356] notify new FE type transfer: MASTER</br>2020-08-26 15:54:35,121 WARN (stateListener|73) [Catalog.replayJournal():2510] replay journal cost too much time: 2975 replayedJournalId: 232383</br>2020-08-26 15:54:48,117 WARN (leaderCheckpointer|75) [Catalog.replayJournal():2510] replay journal cost too much time: 2812 replayedJournalId: 232383</br></pre>",
			"showingLast": "603 bytes of log"
		},
		"LogConfiguration": {
			"VerboseNames": "org",
			"AuditNames": "slow_query,query",
			"Level": "INFO"
		}
	},
	"count": 0
}  
```

Здесь `data.LogContents.log` содержит последний фрагмент журнала `fe.warn.log`.

```
POST /rest/v1/log?add_verbose=org

{
	"msg": "success",
	"code": 0,
	"data": {
		"LogConfiguration": {
			"VerboseNames": "org",
			"AuditNames": "slow_query,query",
			"Level": "INFO"
		}
	},
	"count": 0
}
```
