---
{
    "title": "クエリ統計アクション",
    "language": "ja",
    "description": "指定したカタログ、データベース、またはテーブルの統計情報を取得または削除します。Doris カタログの場合は defaultcluster を使用できます。"
}
---

## リクエスト

```
View  
get api/query_stats/<catalog_name>  
get api/query_stats/<catalog_name>/<db_name>  
get api/query_stats/<catalog_name>/<db_name>/<tbl_name>  
  
Clear  
delete api/query_stats/<catalog_name>/<db_name>  
delete api/query_stats/<catalog_name>/<db_name>/<tbl_name>
```

## 説明

指定したカタログ、データベース、またはテーブルの統計情報を取得または削除します。Doris カタログの場合は default_cluster を使用できます。

## パスパラメータ

* `<catalog_name>`
  指定するカタログ名
* 
* `<db_name>`
    指定するデータベース名

* `<tbl_name>`
    指定するテーブル名

## クエリパラメータ
* `summary`
    true の場合は概要情報のみを返します。それ以外の場合はテーブルの詳細な統計情報をすべて返します。GET リクエストでのみ使用します。

## リクエストボディ

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

## レスポンス

* 統計情報を返します。


## 例


2. curl を使用する

    ```
    curl --location -u root: 'http://127.0.0.1:8030/api/query_stats/default_cluster/test_query_db/baseall?summary=false'
    ```
