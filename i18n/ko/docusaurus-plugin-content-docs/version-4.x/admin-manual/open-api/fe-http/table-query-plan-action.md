---
{
    "title": "테이블 쿼리 계획 작업",
    "language": "ko",
    "description": "지정한 SQL에 해당하는 쿼리 계획을 가져옵니다."
}
---

# 테이블 쿼리 계획 작업 {#table-query-plan-action}

## 요청 {#request}

`POST /api/<db>/<table>/_query_plan`

## 설명 {#description}

지정한 SQL에 해당하는 쿼리 계획을 가져옵니다.

이 인터페이스는 현재 Spark-Doris-Connector에서 Spark가 Doris의 쿼리 계획을 가져오는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

* `<db>`

    데이터베이스를 지정합니다.
    
* `<table>`

    테이블을 지정합니다.

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

```
{
	"sql": "select * from db1.tbl1;"
}
```

## 응답 {#response}

```
{
	"msg": "success",
	"code": 0,
	"data": {
		"partitions": {
			"10039": {
				"routings": ["10.81.85.89:9062"],
				"version": 2,
				"versionHash": 982459448378619656,
				"schemaHash": 1294206575
			}
		},
		"opaqued_query_plan": "DAABDAACDwABDAAAAAEIAAEAAAAACAACAAAAAAgAAwAAAAAKAAT//////////w8ABQgAAAABAAAAAA8ABgIAAAABAAIACAAMABIIAAEAAAAADwACCwAAAAIAAAACazEAAAACazIPAAMIAAAAAgAAAAUAAAAFAgAEAQAAAA8ABAwAAAACDwABDAAAAAEIAAEAAAAQDAACDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABAAAAAAMAA8IAAEAAAAACAACAAAAAAAIABT/////CAAX/////wAADwABDAAAAAEIAAEAAAAQDAACDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABAAAAAAMAA8IAAEAAAABCAACAAAAAAAIABT/////CAAX/////wAADAAFCAABAAAABgwACAAADAAGCAABAAAAAA8AAgwAAAAAAAoABwAAAAAAAAAACgAIAAAAAAAAAAAADQACCgwAAAABAAAAAAAAJzcKAAEAAAAAAAAnNwoAAgAAAAAAAAACCgADDaJlqbrVdwgIAARNJAZvAAwAAw8AAQwAAAACCAABAAAAAAgAAgAAAAAMAAMPAAEMAAAAAQgAAQAAAAAMAAIIAAEAAAAFAAAACAAE/////wgABQAAAAQIAAYAAAAACAAHAAAAAAsACAAAAAJrMQgACQAAAAACAAoBAAgAAQAAAAEIAAIAAAAADAADDwABDAAAAAEIAAEAAAAADAACCAABAAAABQAAAAgABP////8IAAUAAAAICAAGAAAAAAgABwAAAAELAAgAAAACazIIAAkAAAABAgAKAQAPAAIMAAAAAQgAAQAAAAAIAAIAAAAMCAADAAAAAQoABAAAAAAAACc1CAAFAAAAAgAPAAMMAAAAAQoAAQAAAAAAACc1CAACAAAAAQgAAwAAAAIIAAQAAAAACwAHAAAABHRibDELAAgAAAAADAALCwABAAAABHRibDEAAAAMAAQKAAFfL5rpxl1I4goAArgs6f+h6eMxAAA=",
		"status": 200
	},
	"count": 0
}
```

이 중 `opaqued_query_plan`은 쿼리 계획을 바이너리 형식으로 표현한 값입니다.

## 예시 {#examples}

1. 지정한 SQL의 쿼리 계획 가져오기

    ```
    POST /api/db1/tbl1/_query_plan
    {
        "sql": "select * from db1.tbl1;"
    }
    
    Response:
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"partitions": {
    			"10039": {
    				"routings": ["192.168.1.1:9060"],
    				"version": 2,
    				"versionHash": 982459448378619656,
    				"schemaHash": 1294206575
    			}
    		},
    		"opaqued_query_plan": "DAABDAACDwABD...",
    		"status": 200
    	},
    	"count": 0
    }
    ```
