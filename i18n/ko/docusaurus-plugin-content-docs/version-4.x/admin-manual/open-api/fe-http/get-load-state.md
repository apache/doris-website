---
{
    "title": "데이터 적재 상태 조회",
    "language": "ko",
    "description": "지정한 레이블의 데이터 적재 트랜잭션 상태를 반환합니다. 지정한 트랜잭션의 상태를 JSON 형식의 문자열로 반환합니다. 레이블: "
}
---

# 데이터 적재 상태 조회 {#get-load-state}

## 요청 {#request}

`GET /api/<db>/get_load_state`

## 설명 {#description}

지정한 레이블의 데이터 적재 트랜잭션 상태를 반환합니다.
지정한 트랜잭션의 상태를 JSON 형식의 문자열로 반환합니다:
	레이블: 지정한 레이블입니다.
	요청 상태: 이 요청의 성공 여부입니다.
	메시지: 오류 메시지입니다.
	트랜잭션 상태:
		UNKNOWN/PREPARE/COMMITTED/VISIBLE/ABORTED

## 경로 매개변수 {#path-parameters}

* `<db>`

    데이터베이스를 지정합니다.

## 쿼리 매개변수 {#query-parameters}

* `label`

    레이블을 지정합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": "VISIBLE",
	"count": 0
}
```

레이블이 존재하지 않으면 다음을 반환합니다:

```
{
	"msg": "success",
	"code": 0,
	"data": "UNKNOWN",
	"count": 0
}
```

## 예시 {#examples}

1. 지정한 레이블의 데이터 적재 트랜잭션 상태를 조회합니다.

    ```
    GET /api/example_db/get_load_state?label=my_label

    {
    	"msg": "success",
    	"code": 0,
    	"data": "VISIBLE",
    	"count": 0
    }
    ```
