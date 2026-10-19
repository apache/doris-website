---
{
    "title": "쿼리 통계 작업",
    "language": "ko",
    "description": "지정한 Catalog, 데이터베이스 또는 테이블의 통계 정보를 조회하거나 삭제합니다. Doris Catalog인 경우 defaultcluster를 사용할 수 있습니다."
}
---

## 요청 {#request}

```
View  
get api/query_stats/<catalog_name>  
get api/query_stats/<catalog_name>/<db_name>  
get api/query_stats/<catalog_name>/<db_name>/<tbl_name>  
  
Clear  
delete api/query_stats/<catalog_name>/<db_name>  
delete api/query_stats/<catalog_name>/<db_name>/<tbl_name>
```

## 설명 {#description}

지정한 Catalog, 데이터베이스 또는 테이블의 통계 정보를 조회하거나 삭제합니다. Doris Catalog인 경우 default_cluster를 사용할 수 있습니다.

## 경로 매개변수 {#path-parameters}

* `<catalog_name>`
  지정한 Catalog 이름
* 
* `<db_name>`
    지정한 데이터베이스 이름

* `<tbl_name>`
    지정한 테이블 이름

## 쿼리 매개변수 {#query-parameters}
* `summary`
    true이면 요약 정보만 반환하며, 그렇지 않으면 테이블의 상세 통계 정보를 모두 반환합니다. get에서만 사용합니다.

## 요청 본문 {#request-body}

```
GET /api/query_stats/default_cluster/test_query_db/baseall?summary=false
{
    "msg": "success",
    "code": 0,
    "data": {
        "summary": {
            "query": 2
        },
        "detail": {
            "baseall": {
                "summary": {
                    "query": 2
                }
            }
        }
    },
    "count": 0
}

```

## 응답 {#response}

* 통계 정보를 반환합니다.


## 예제 {#example}


2. curl 사용

    ```
    curl --location -u root: 'http://127.0.0.1:8030/api/query_stats/default_cluster/test_query_db/baseall?summary=false'
    ```
