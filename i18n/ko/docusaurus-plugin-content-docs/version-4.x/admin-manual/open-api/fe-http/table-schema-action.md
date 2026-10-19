---
{
    "title": "테이블 스키마 작업",
    "language": "ko",
    "description": "지정한 테이블의 구조 정보를 가져오는 데 사용합니다. 현재 Spark/Flink Doris Connector에서 이 인터페이스를 사용합니다."
}
---

# 테이블 스키마 작업 {#table-schema-action}

## 요청 {#request}

`GET /api/<db>/<table>/_schema`

## 설명 {#description}

지정한 테이블의 구조 정보를 가져오는 데 사용합니다. 현재 Spark/Flink Doris Connector에서 이 인터페이스를 사용합니다. Doris 테이블 구조 정보를 가져옵니다.

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
* http 인터페이스의 반환 결과는 다음과 같습니다:
```
{
	"msg": "success",
	"code": 0,
	"data": {
		"properties": [{
			"type": "INT",
			"name": "k1",
			"comment": "",
			"aggregation_type":""
		}, {
			"type": "INT",
			"name": "k2",
			"comment": "",
			"aggregation_type":"MAX"
		}],
		"keysType":UNIQUE_KEYS,
		"status": 200
	},
	"count": 0
}
```
* http v2 인터페이스의 반환 결과는 다음과 같습니다:
```
{
	"msg": "success",
	"code": 0,
	"data": {
		"properties": [{
			"type": "INT",
			"name": "k1",
			"comment": ""
		}, {
			"type": "INT",
			"name": "k2",
			"comment": ""
		}],
		"keysType":UNIQUE_KEYS,
		"status": 200
	},
	"count": 0
}
```
참고: 차이점은 `http` 방식이 `aggregation_type` 필드를 `http v2` 방식보다 더 많이 반환한다는 것입니다. `http v2`는 `enable_http_server_v2`를 설정하여 활성화합니다. 매개변수에 대한 자세한 설명은 [FE 매개변수 설정](../../config/fe-config.md)을 참조하세요.

## 예제 {#examples}

1. http 인터페이스를 통해 지정한 테이블의 구조 정보를 가져옵니다.

    ```
    GET /api/db1/tbl1/_schema
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"properties": [{
    			"type": "INT",
    			"name": "k1",
    			"comment": "",
    			"aggregation_type":""
    		}, {
    			"type": "INT",
    			"name": "k2",
    			"comment": "",
    			"aggregation_type":"MAX"
    		}],
    		"keysType":UNIQUE_KEYS,
    		"status": 200
    	},
    	"count": 0
    }
    ```
2. http v2 인터페이스를 통해 지정한 테이블의 구조 정보를 가져옵니다.

    ```
    GET /api/db1/tbl1/_schema
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"properties": [{
    			"type": "INT",
    			"name": "k1",
    			"comment": ""
    		}, {
    			"type": "INT",
    			"name": "k2",
    			"comment": ""
    		}],
    		"keysType":UNIQUE_KEYS,
    		"status": 200
    	},
    	"count": 0
    }
    ```
