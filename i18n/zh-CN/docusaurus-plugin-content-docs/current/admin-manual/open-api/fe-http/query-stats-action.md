---
{
    "title": "Query Stats Action",
    "language": "zh-CN",
    "description": "获取或者删除指定的 catalog 数据库或者表中的统计信息，如果是 doris catalog 可以使用 defaultcluster"
}
---

## Request

```
查看
get api/query_stats/<catalog_name>
get api/query_stats/<catalog_name>/<db_name>
get api/query_stats/<catalog_name>/<db_name>/<tbl_name>

清空
delete api/query_stats/<catalog_name>/<db_name>
delete api/query_stats/<catalog_name>/<db_name>/<tbl_name>
```

## Description

获取或者删除指定的 catalog 数据库或者表中的统计信息，如果是 doris catalog 可以使用 default_cluster
    
## Path parameters

* `<catalog_name>`

    指定的 catalog 名称
* `<db_name>`

    指定的数据库名称
* `<tbl_name>`

    指定的表名称

## Query parameters
* `summary`
如果为 true 则只返回 summary 信息，否则返回所有的表的详细统计信息，只在 get 时使用

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

* 返回结果集


## Example


2. 使用 curl 命令获取统计信息

    ```
    curl --location -u root: 'http://127.0.0.1:8030/api/query_stats/default_cluster/test_query_db/baseall?summary=false'
    ```
