---
{
    "title": "Query Profile Action 컨트롤러 | Fe Http",
    "language": "ko",
    "description": "Query Profile Action은 쿼리 프로파일을 가져오는 데 사용됩니다.",
    "sidebar_label": "Query Profile Action 컨트롤러"
}
---

# Query Profile Action {#query-profile-action}

## 요청 {#request}

```
GET /rest/v1/query_profile/<query_id>
```

## 설명 {#description}

Query Profile Action은 쿼리 프로파일을 가져오는 데 사용됩니다.

## 경로 매개변수 {#path-parameters}

* `<query_id>`

    선택적 매개변수입니다. 지정하지 않으면 최근 쿼리 목록을 반환합니다. 지정하면 해당 쿼리의 프로파일을 반환합니다.

## 쿼리 매개변수 {#query-parameters}

없음

## 요청 본문 {#request-body}

없음

## 응답 {#response}

* `<query_id>`를 지정하지 않은 경우

    ```
    GET /rest/v1/query_profile/
    {
    	"msg": "success",
    	"code": 0,
    	"data": {
    		"href_column": ["Query ID"],
    		"column_names": ["Query ID", "User", "Default Db", "Sql Statement", "Query Type", "Start Time", "End Time", "Total", "Query State"],
    		"rows": [{
    			"User": "root",
    			"__hrefPath": ["/query_profile/d73a8a0b004f4b2f-b4829306441913da"],
    			"Query Type": "Query",
    			"Total": "5ms",
    			"Default Db": "default_cluster:db1",
    			"Sql Statement": "select * from tbl1",
    			"Query ID": "d73a8a0b004f4b2f-b4829306441913da",
    			"Start Time": "2020-09-03 10:07:54",
    			"Query State": "EOF",
    			"End Time": "2020-09-03 10:07:54"
    		}, {
    			"User": "root",
    			"__hrefPath": ["/query_profile/fd706dd066824c21-9d1a63af9f5cb50c"],
    			"Query Type": "Query",
    			"Total": "6ms",
    			"Default Db": "default_cluster:db1",
    			"Sql Statement": "select * from tbl1",
    			"Query ID": "fd706dd066824c21-9d1a63af9f5cb50c",
    			"Start Time": "2020-09-03 10:07:54",
    			"Query State": "EOF",
    			"End Time": "2020-09-03 10:07:54"
    		}]
    	},
    	"count": 3
    }
    ```

    반환 결과는 `System Action`과 동일한 테이블 형식입니다.

* `<query_id>`를 지정한 경우

    ```
    GET /rest/v1/query_profile/<query_id>

    {
    	"msg": "success",
    	"code": 0,
    	"data": "Query:</br>&nbsp;&nbsp;&nbsp;&nbsp;Summary:</br>...",
    	"count": 0
    }
    ```

    `data`는 프로파일의 텍스트 내용입니다.
