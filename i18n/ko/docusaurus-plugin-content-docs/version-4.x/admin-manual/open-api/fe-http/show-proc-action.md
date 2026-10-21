---
{
    "title": "Proc 조회 액션",
    "language": "ko",
    "description": "PROC 정보를 조회하는 데 사용합니다."
}
---

# Proc 조회 액션 {#show-proc-action}

## 요청 {#request}

`GET /api/show_proc`

## 설명 {#description}

PROC 정보를 조회하는 데 사용합니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* path

    Proc 경로를 지정합니다.
    
* forward

    Master FE로 전달하여 실행할지 여부

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": [
		proc infos ...
	],
	"count": 0
}
```

## 예제 {#examples}

1. `/statistic` 정보 조회

    ```
    GET /api/show_proc?path=/statistic
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": [
    		["10003", "default_cluster:db1", "2", "3", "3", "3", "3", "0", "0", "0"],
    		["10013", "default_cluster:doris_audit_db__", "1", "4", "4", "4", "4", "0", "0", "0"],
    		["Total", "2", "3", "7", "7", "7", "7", "0", "0", "0"]
    	],
    	"count": 0
    }
    ```
    
2. Master로 전달하여 실행

    ```
    GET /api/show_proc?path=/statistic&forward=true
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": [
    		["10003", "default_cluster:db1", "2", "3", "3", "3", "3", "0", "0", "0"],
    		["10013", "default_cluster:doris_audit_db__", "1", "4", "4", "4", "4", "0", "0", "0"],
    		["Total", "2", "3", "7", "7", "7", "7", "0", "0", "0"]
    	],
    	"count": 0
    }
    ```
