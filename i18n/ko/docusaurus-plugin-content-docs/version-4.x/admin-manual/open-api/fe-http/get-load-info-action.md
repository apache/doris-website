---
{
    "title": "데이터 적재 정보 조회 액션",
    "language": "ko",
    "description": "지정한 레이블의 데이터 적재 작업 정보를 조회합니다."
}
---

# 데이터 적재 정보 조회 액션 {#get-load-info-action}

## 요청 {#request}

`GET /api/<db>/_load_info`

## 설명 {#description}

지정한 레이블의 데이터 적재 작업 정보를 조회합니다.

## 경로 매개변수 {#path-parameters}

* `<db>`

    데이터베이스를 지정합니다.

## 쿼리 매개변수 {#query-parameters}

* `label`

    데이터 적재 레이블을 지정합니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"dbName": "default_cluster:db1",
		"tblNames": ["tbl1"],
		"label": "my_label",
		"clusterName": "default_cluster",
		"state": "FINISHED",
		"failMsg": "",
		"trackingUrl": ""
	},
	"count": 0
}
```

## 예제 {#examples}

1. 지정한 레이블의 데이터 적재 작업 정보 조회

    ```
    GET /api/example_db/_load_info?label=my_label

    Response
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"dbName": "default_cluster:db1",
    		"tblNames": ["tbl1"],
    		"label": "my_label",
    		"clusterName": "default_cluster",
    		"state": "FINISHED",
    		"failMsg": "",
    		"trackingUrl": ""
    	},
    	"count": 0
    }
    ```
