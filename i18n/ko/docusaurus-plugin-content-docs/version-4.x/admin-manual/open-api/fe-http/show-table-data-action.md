---
{
    "title": "테이블 데이터 조회 액션",
    "language": "ko",
    "description": "모든 내부 Catalog에 속한 모든 데이터베이스의 모든 테이블에 대한 데이터 크기 또는 지정한 데이터베이스나 테이블의 데이터 크기를 가져오는 데 사용합니다. 단위는 바이트입니다."
}
---

# 테이블 데이터 조회 액션 {#show-table-data-action}

## 요청 {#request}

`GET /api/show_table_data`

## 설명 {#description}

모든 내부 Catalog에 속한 모든 데이터베이스의 모든 테이블에 대한 데이터 크기 또는 지정한 데이터베이스나 테이블의 데이터 크기를 가져오는 데 사용합니다. 단위는 바이트입니다.

## 경로 매개변수 {#path-parameters}

NULL

## 쿼리 매개변수 {#query-parameters}

* `db`

    선택 사항입니다. 지정하면 지정한 데이터베이스에 속한 테이블의 데이터 크기를 가져옵니다.

* `table`

    선택 사항입니다. 지정하면 지정한 테이블의 데이터 크기를 가져옵니다.

* `single_replica`

    선택 사항입니다. 지정하면 테이블의 단일 복제본 데이터 크기를 가져옵니다.

## 요청 본문 {#request-body}

NULL

## 응답 {#response}

1. 지정한 데이터베이스에 속한 모든 테이블의 데이터 크기입니다.

    ```
    {
        "msg":"success",
        "code":0,
        "data":{
            "tpch":{
                "partsupp":9024548244,
                "revenue0":0,
                "customer":1906421482
            }
        },
        "count":0
    }
    ```
    
2. 지정한 데이터베이스에 속한 지정한 테이블의 데이터 크기입니다.

    ```
    {
        "msg":"success",
        "code":0,
        "data":{
            "tpch":{
                "partsupp":9024548244
            }
        },
        "count":0
    }
    ```

3. 지정한 데이터베이스에 속한 지정한 테이블의 단일 복제본 데이터 크기입니다.

    ```
    {
        "msg":"success",
        "code":0,
        "data":{
            "tpch":{
                "partsupp":3008182748
            }
        },
        "count":0
    }
    ```
    
## 예제 {#examples}

1. 지정한 데이터베이스에 속한 모든 테이블의 데이터 크기입니다.

    ```
    GET /api/show_table_data?db=tpch
    
    Response:
    {
        "msg":"success",
        "code":0,
        "data":{
            "tpch":{
                "partsupp":9024548244,
                "revenue0":0,
                "customer":1906421482
            }
        },
        "count":0
    }
    ```

2. 지정한 데이터베이스에 속한 지정한 테이블의 데이터 크기입니다.

    ```
    GET /api/show_table_data?db=tpch&table=partsupp
        
    Response:
    {
        "msg":"success",
        "code":0,
        "data":{
            "tpch":{
                "partsupp":9024548244
            }
        },
        "count":0
    }
    ```
3. 지정한 데이터베이스에 속한 지정한 테이블의 단일 복제본 데이터 크기입니다.

    ```
    GET /api/show_table_data?db=tpch&table=partsupp&single_replica=true
        
    Response:
    {
        "msg":"success",
        "code":0,
        "data":{
            "tpch":{
                "partsupp":3008182748
            }
        },
        "count":0
    }
    ```
