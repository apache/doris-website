---
{
    "title": "Query Stats Action",
    "language": "en",
    "description": "Get or delete the statistics information of the specified catalog database or table, if it is a doris catalog, you can use defaultcluster"
}
---

## Request

```
View  
get api/query_stats/<catalog_name>  
get api/query_stats/<catalog_name>/<db_name>  
get api/query_stats/<catalog_name>/<db_name>/<tbl_name>  
  
Clear  
delete api/query_stats/<catalog_name>/<db_name>  
delete api/query_stats/<catalog_name>/<db_name>/<tbl_name>
```

## Description

Get or delete the statistics information of the specified catalog database or table, if it is a doris catalog, you can use default_cluster

## Path parameters

* `<catalog_name>`
  specified catalog name
* 
* `<db_name>`
    specified database name

* `<tbl_name>`
    specified table name

## Query parameters
* `summary`
    if true, only return summary information, otherwise return all the detailed statistics information of the table, only used in get

## Request body

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

## Response

* return statistics information


## Example


2. use curl

    ```
    curl --location -u root: 'http://127.0.0.1:8030/api/query_stats/default_cluster/test_query_db/baseall?summary=false'
    ```
