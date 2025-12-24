---
{
    "title": "Log Action",
    "language": "en",
    "description": "GET is used to obtain the latest part of Doris's WARNING log, and the POST method is used to dynamically set the log level of FE."
}
---

# Log Action

## Request

```
GET /rest/v1/log
```

## Description

GET is used to obtain the latest part of Doris's WARNING log, and the POST method is used to dynamically set the log level of FE.
    
## Path parameters

None

## Query parameters

* `add_verbose`

    Optional parameters for the POST method. Enable the DEBUG level log of the specified package.
    
* `del_verbose`

    Optional parameters for the POST method. Turn off the DEBUG level log of the specified package.
    
## Request body

None

## Response
    
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
    
Among them, `data.LogContents.log` means the log content in the latest part of `fe.warn.log`.

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
