---
{
    "title": "로그 작업",
    "language": "ko",
    "description": "GET은 Doris의 WARNING 로그에서 가장 최근 내용을 가져오는 데 사용되며, POST 메서드는 FE의 로그 수준을 동적으로 설정하는 데 사용됩니다."
}
---

# 로그 작업 {#log-action}

## 요청 {#request}

```
GET /rest/v1/log
```

## 설명 {#description}

GET은 Doris의 WARNING 로그에서 가장 최근 내용을 가져오는 데 사용되며, POST 메서드는 FE의 로그 수준을 동적으로 설정하는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `add_verbose`

    POST 메서드의 선택적 매개변수입니다. 지정한 패키지의 DEBUG 수준 로그를 활성화합니다.

* `del_verbose`

    POST 메서드의 선택적 매개변수입니다. 지정한 패키지의 DEBUG 수준 로그를 비활성화합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

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

여기서 `data.LogContents.log`는 `fe.warn.log`에서 가장 최근에 기록된 로그 내용을 나타냅니다.

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
