---
{
    "title": "연결 작업",
    "language": "ko",
    "description": "연결 ID를 지정하면 해당 연결에서 현재 실행 중인 쿼리 또는 가장 최근에 실행이 완료된 쿼리의 ID를 반환합니다."
}
---

# 연결 작업 {#connection-action}

## 요청 {#request}

`GET /api/connection`

## 설명 {#description}

연결 ID를 지정하면 해당 연결에서 현재 실행 중인 쿼리 또는 가장 최근에 실행이 완료된 쿼리의 ID를 반환합니다.

연결 ID는 MySQL 명령 `show processlist;`의 id 열에서 확인할 수 있습니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `connection_id`

    지정한 연결 ID

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "OK",
	"code": 0,
	"data": {
		"query_id": "b52513ce3f0841ca-9cb4a96a268f2dba"
	},
	"count": 0
}
```

## 예제 {#examples}

1. 지정한 연결 ID에 해당하는 쿼리 ID 조회

    ```
    GET /api/connection?connection_id=101

    Response:
    {
    	"msg": "OK",
    	"code": 0,
    	"data": {
    		"query_id": "b52513ce3f0841ca-9cb4a96a268f2dba"
    	},
    	"count": 0
    }
    ```
