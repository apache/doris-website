---
{
    "title": "데이터 표시 작업",
    "language": "ko",
    "description": "클러스터의 전체 데이터 용량 또는 지정한 데이터베이스의 데이터 용량을 가져오는 데 사용합니다. 단위는 바이트입니다."
}
---

# 데이터 표시 작업 {#show-data-action}

## 요청 {#request}

`GET /api/show_data`

## 설명 {#description}

클러스터의 전체 데이터 용량 또는 지정한 데이터베이스의 데이터 용량을 가져오는 데 사용합니다. 단위는 바이트입니다.

## 경로 매개변수 {#path-parameters}

없음

## 쿼리 매개변수 {#query-parameters}

* `db`

    선택 사항입니다. 지정하면 해당 데이터베이스의 데이터 용량을 가져옵니다.

## 요청 본문 {#request-body}

없음

## 응답 {#response}

1. 지정한 데이터베이스의 데이터 용량

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```
    
2. 전체 데이터 용량

    ```
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"__total_size": 381
    	},
    	"count": 0
    }
    ```
    
## 예시 {#examples}

1. 지정한 데이터베이스의 데이터 용량 가져오기

    ```
    GET /api/show_data?db=db1
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"default_cluster:db1": 381
    	},
    	"count": 0
    }
    ```

2. 클러스터의 전체 데이터 용량 가져오기

    ```
    GET /api/show_data
        
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"__total_size": 381
    	},
    	"count": 0
    }
    ```
