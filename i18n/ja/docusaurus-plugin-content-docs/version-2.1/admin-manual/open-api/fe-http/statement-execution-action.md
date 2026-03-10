---
{
  "title": "ステートメント実行アクション",
  "language": "ja",
  "description": "Statement Execution Actionは、ステートメントを実行して結果を返すために使用されます。"
}
---
# Statement Execution Action


## リクエスト

```
POST /api/query/<ns_name>/<db_name>
```
## 説明

Statement Execution Actionは、ステートメントを実行し、結果を返すために使用されます。
    
## Path parameters

* `<db_name>`

    データベース名を指定します。このデータベースは現在のセッションのデフォルトデータベースとして扱われます。SQLのテーブル名でデータベース名が修飾されていない場合、このデータベースが使用されます。

## Query parameters

なし

## Request body

```
{
    "stmt" : "select * from tbl1"
}
```
* sql フィールドは具体的な SQL

### Response

* 結果セットを返す

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "type": "result_set",
            "data": [
                [1],
                [2]
            ],
            "meta": [{
                "name": "k1",
                "type": "INT"
            }],
            "status": {},
            "time": 10
        },
        "count": 0
    }
    ```
* typeフィールドは`result_set`で、これは結果セットが返されることを意味します。結果はmetaフィールドとdataフィールドに基づいて取得し表示する必要があります。metaフィールドは返される列情報を記述します。dataフィールドは結果行を返します。各行の列タイプはmetaフィールドの内容によって判定する必要があります。statusフィールドはアラーム行数、ステータスコードなどのMySQLの情報を返します。timeフィールドは実行時間を返し、単位はミリ秒です。

* 実行結果を返す

    ```
    {
        "msg": "success",
        "code": 0,
        "data": {
            "type": "exec_status",
            "status": {}
        },
        "count": 0,
        "time": 10
    }
    ```
* typeフィールドは`exec_status`で、これは実行結果が返されることを意味します。現在、戻り結果が受信された場合、ステートメントが正常に実行されたことを意味します。
