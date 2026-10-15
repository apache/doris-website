---
{
    "title": "テーブルデータ容量の表示",
    "language": "ja",
    "description": "内部カタログ内のすべてのデータベースにあるすべてのテーブル、または指定したデータベースやテーブルのデータ容量を取得します。単位はバイトです。"
}
---

# テーブルデータ容量の表示

## リクエスト

`GET /api/show_table_data`

## 説明

内部カタログ内のすべてのデータベースにあるすべてのテーブル、または指定したデータベースやテーブルのデータ容量を取得します。単位はバイトです。
    
## パスパラメータ

NULL

## クエリパラメータ

* `db`

    省略可能。指定すると、そのデータベース内のテーブルのデータ容量を取得します。

* `table`

    省略可能。指定すると、そのテーブルのデータ容量を取得します。

* `single_replica`

    省略可能。指定すると、テーブルの単一レプリカのデータ容量を取得します。

## リクエストボディ

NULL

## レスポンス

1. 指定したデータベース内のすべてのテーブルのデータ容量。

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
    
2. 指定したデータベース内の指定したテーブルのデータ容量。

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

3. 指定したデータベース内の指定したテーブルの単一レプリカのデータ容量。

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
    
## 例

1. 指定したデータベース内のすべてのテーブルのデータ容量。

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

2. 指定したデータベース内の指定したテーブルのデータ容量。

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
3. 指定したデータベース内の指定したテーブルの単一レプリカのデータ容量。

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
