---
{
    "title": "행 수 작업",
    "language": "ko",
    "description": "지정된 테이블의 행 수 통계를 수동으로 갱신하는 데 사용됩니다. 행 수 통계를 갱신하는 동안,"
}
---

# 행 수 작업 {#row-count-action}

## 요청 {#request}

`GET /api/rowcount`

## 설명 {#description}

지정된 테이블의 행 수 통계를 수동으로 갱신하는 데 사용됩니다. 행 수 통계를 갱신하면서 테이블과 rollup의 행 수도 JSON 형식으로 반환합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `db`

    데이터베이스 지정

* `table`

    테이블 지정

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl1": 10000
	},
	"count": 0
}
```

## 예제 {#examples}

1. 지정된 테이블의 행 수 갱신 및 조회

    ```
    GET /api/rowcount?db=example_db&table=tbl1

    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"tbl1": 10000
    	},
    	"count": 0
    }
    ```
