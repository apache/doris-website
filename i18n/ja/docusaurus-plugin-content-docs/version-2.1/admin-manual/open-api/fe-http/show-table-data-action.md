---
{
  "title": "テーブルデータ表示アクション",
  "language": "ja",
  "description": "全ての内部カタログ配下の全てのデータベースの全てのテーブルのデータサイズ、または指定されたデータベースやテーブルのデータサイズを取得するために使用される。単位はbyte。"
}
---
# Show table Data Action

## Request

`GET /api/show_table_data`

## 説明

すべての内部カタログ配下のすべてのデータベース内のすべてのテーブルのデータサイズ、または指定されたデータベースまたはテーブルのデータサイズを取得するために使用されます。単位はbyteです。
    
## パスパラメータ

NULL

## クエリパラメータ

* `db`

    オプション。指定された場合、指定されたデータベース配下のテーブルのデータサイズを取得します。

* `table`

    オプション。指定された場合、指定されたテーブルのデータサイズを取得します。

* `single_replica`

    オプション。指定された場合、テーブルの単一レプリカのデータサイズを取得します。

## リクエストボディ

NULL

## レスポンス

1. 指定されたデータベース内のすべてのテーブルのデータサイズ。

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
2. 指定されたdbの指定されたテーブルのデータサイズ。

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
指定されたdbの指定されたテーブルの単一レプリカのデータサイズ。

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

1. 指定されたデータベース内のすべてのテーブルのデータサイズ。

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
2. 指定されたdbの指定されたテーブルのデータサイズ。

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
3. 指定されたdbの指定されたテーブルの単一レプリカのデータサイズ。

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
