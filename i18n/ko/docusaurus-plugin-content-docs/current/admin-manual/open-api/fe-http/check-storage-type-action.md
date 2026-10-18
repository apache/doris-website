---
{
    "title": "스토리지 유형 확인 작업",
    "language": "ko",
    "description": "지정한 데이터베이스에 있는 테이블의 저장 형식이 행 저장 형식인지 확인하는 데 사용됩니다. (행 저장 형식은 더 이상 사용이 권장되지 않습니다.)"
}
---

# 스토리지 유형 확인 작업 {#check-storage-type-action}

## 요청 {#request}

`GET /api/_check_storagetype`

## 설명 {#description}

지정한 데이터베이스에 있는 테이블의 저장 형식이 행 저장 형식인지 확인하는 데 사용됩니다. (행 저장 형식은 더 이상 사용이 권장되지 않습니다.)

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `db`

    데이터베이스를 지정합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"tbl2": {},
		"tbl1": {}
	},
	"count": 0
}
```

테이블 이름 뒤에 내용이 있으면 저장 형식이 행 저장 형식인 기본 테이블 또는 rollup 테이블이 표시됩니다.

## 예시 {#examples}

1. 지정한 데이터베이스에 있는 다음 테이블의 저장 형식이 행 형식인지 확인합니다.

    ```
    GET /api/_check_storagetype

    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"tbl2": {},
    		"tbl1": {}
    	},
    	"count": 0
    }
    ```
