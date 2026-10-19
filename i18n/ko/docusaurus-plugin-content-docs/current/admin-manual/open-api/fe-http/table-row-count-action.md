---
{
    "title": "테이블 행 수 조회 액션",
    "language": "ko",
    "description": "지정된 테이블의 행 수 통계를 가져오는 데 사용됩니다. 이 인터페이스는 현재 Spark-Doris-Connector에서 사용됩니다."
}
---

# 테이블 행 수 조회 액션 {#table-row-count-action}

## 요청 {#request}

`GET /api/<db>/<table>/_count`

## 설명 {#description}

지정된 테이블의 행 수 통계를 가져오는 데 사용됩니다. 이 인터페이스는 현재 Spark-Doris-Connector에서 사용됩니다. Spark는 이 인터페이스를 통해 Doris 테이블 통계를 가져옵니다.

## 경로 매개변수 {#path-parameters}

* `<db>`

    데이터베이스를 지정합니다.

* `<table>`

    테이블을 지정합니다.

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
		"size": 1,
		"status": 200
	},
	"count": 0
}
```

`data.size` 필드는 지정된 테이블의 행 수를 나타냅니다.

## 예제 {#examples}

1. 지정된 테이블의 행 수를 가져옵니다.

    ```
    GET /api/db1/tbl1/_count
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"size": 1,
    		"status": 200
    	},
    	"count": 0
    }
    ```
