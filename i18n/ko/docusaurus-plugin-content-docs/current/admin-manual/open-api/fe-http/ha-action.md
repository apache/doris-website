---
{
    "title": "HA Action",
    "language": "ko",
    "description": "HA Action은 FE 클러스터의 고가용성 그룹 정보를 조회하는 데 사용됩니다."
}
---

# HA Action {#ha-action}

## 요청 {#request}

```
GET /rest/v1/ha
```

## 설명 {#description}

HA Action은 FE 클러스터의 고가용성 그룹 정보를 조회하는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"Observernodes": [],
		"CurrentJournalId": [{
			"Value": 433648,
			"Name": "FrontendRole"
		}],
		"Electablenodes": [{
			"Value": "host1",
			"Name": "host1"
		}],
		"allowedFrontends": [{
			"Value": "name: 192.168.1.1_9213_1597652404352, role: FOLLOWER, 192.168.1.1:9213",
			"Name": "192.168.1.1_9213_1597652404352"
		}],
		"removedFrontends": [],
		"CanRead": [{
			"Value": true,
			"Name": "Status"
		}],
		"databaseNames": [{
			"Value": "433436 ",
			"Name": "DatabaseNames"
		}],
		"FrontendRole": [{
			"Value": "MASTER",
			"Name": "FrontendRole"
		}],
		"CheckpointInfo": [{
			"Value": 433435,
			"Name": "Version"
		}, {
			"Value": "2020-09-03T02:07:37.000+0000",
			"Name": "lastCheckPointTime"
		}]
	},
	"count": 0
}
```
