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

Statement Execution Actionは、ステートメントを実行して結果を返すために使用されます。
    
## パスパラメータ

* `<db_name>`

    データベース名を指定します。このデータベースは、現在のセッションのデフォルトデータベースとして扱われます。SQLでのテーブル名がデータベース名を修飾していない場合、このデータベースが使用されます。

## クエリパラメータ

なし

## リクエストボディ

```
{
    "stmt" : "select * from tbl1"
}
```
* sql フィールドは具体的なSQL

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
* type フィールドは `result_set` で、これは結果セットが返されることを意味します。結果は meta フィールドと data フィールドに基づいて取得し表示する必要があります。meta フィールドは返される列情報を記述します。data フィールドは結果行を返します。各行の列タイプは meta フィールドの内容によって判断する必要があります。status フィールドはアラーム行数、ステータスコードなど MySQL の情報を返します。time フィールドは実行時間を返し、単位はミリ秒です。

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
* type フィールドは `exec_status` で、これは実行結果が返されることを意味します。現在、返却結果を受信した場合、ステートメントが正常に実行されたことを意味します。
