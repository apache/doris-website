---
{
  "title": "クエリ統計アクション",
  "language": "ja",
  "description": "指定されたカタログデータベースまたはテーブルの統計情報を取得または削除します。doris catalogの場合は、defaultclusterを使用できます。"
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

指定したカタログデータベースまたはテーブルの統計情報を取得または削除します。dorisカタログの場合は、default_clusterを使用できます

## パスパラメータ

* `<catalog_name>`
  指定したカタログ名
* 
* `<db_name>`
    指定したデータベース名

* `<tbl_name>`
    指定したテーブル名

## クエリパラメータ
* `summary`
    trueの場合、サマリー情報のみを返します。そうでない場合は、テーブルの詳細な統計情報をすべて返します。取得時のみ使用されます

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

* 統計情報を返します


## 例


2. curlを使用する

    ```
    curl --location -u root: 'http://127.0.0.1:8030/api/query_stats/default_cluster/test_query_db/baseall?summary=false'
    ```
