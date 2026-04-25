---
{
    "title": "Show Table Data Action",
    "language": "zh-CN",
    "description": "用于获取所有 internal 源下所有数据库所有表的数据量，或者指定数据库或指定表的数据量。单位字节。"
}
---

## Request

`GET /api/show_table_data`

## Description

用于获取所有 internal 源下所有数据库所有表的数据量，或者指定数据库或指定表的数据量。单位字节。
    
## Path parameters

无

## Query parameters

* `db`

    可选。如果指定，则获取指定数据库下表的数据量。

* `table`

    可选。如果指定，则获取指定表的数据量。

* `single_replica`

    可选。如果指定，则获取表单副本所占用的数据量。

## Request body

无

## Response

1. 指定数据库所有表的数据量。

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
    
2. 指定数据库指定表的数据量。

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

3. 指定数据库指定表单副本的数据量。

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
    
## Examples

1. 获取指定数据库的数据量

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

2. 指定数据库指定表的数据量。

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
3. 指定数据库指定表单副本的数据量。

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
