---
{
    "title": "런타임 정보 조회 작업",
    "language": "ko",
    "description": "FE JVM의 런타임 정보를 가져오는 데 사용됩니다"
}
---

# 런타임 정보 조회 작업 {#show-runtime-info-action}

## 요청 {#request}

`GET /api/show_runtime_info`

## 설명 {#description}

FE JVM의 런타임 정보를 가져오는 데 사용됩니다

## 경로 매개변수 {#path-parameters}

없음

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
		"free_mem": "855642056",
		"total_mem": "1037959168",
		"thread_cnt": "98",
		"max_mem": "1037959168"
	},
	"count": 0
}
```

## 예시 {#examples}

1. 현재 FE 노드의 JVM 정보 가져오기

    ```
    GET /api/show_runtime_info
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"free_mem": "855642056",
    		"total_mem": "1037959168",
    		"thread_cnt": "98",
    		"max_mem": "1037959168"
    	},
    	"count": 0
    }
    ```
