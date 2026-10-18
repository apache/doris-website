---
{
    "title": "세션 액션",
    "language": "ko",
    "description": "세션 액션은 현재 세션 정보를 조회하는 데 사용됩니다."
}
---

# 세션 액션 {#session-action}

## 요청 {#request}

`GET /rest/v1/session`

`GET /rest/v1/session/all`

## 설명 {#description}

세션 액션은 현재 세션 정보를 조회하는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 현재 세션 정보 조회 {#obtain-the-current-session-information}

`GET /rest/v1/session`

## 응답 {#response}

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

## 모든 FE의 세션 정보 조회 {#obtain-all-fe-session-information}

`GET /rest/v1/session/all`

## 응답 {#response-1}

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

반환 결과는 `System Action`과 동일하며, 테이블에 대한 설명입니다.
