---
{
  "title": "SHOW LOAD",
  "language": "ja",
  "description": "このステートメントは、指定されたimportタスクの実行ステータスを表示するために使用されます。"
}
---
## 説明

このステートメントは、指定されたインポートタスクの実行ステータスを表示するために使用されます。

## 構文

```sql
SHOW LOAD
[FROM <db_name>]
[
   WHERE
   [LABEL  = [ "<your_label>" | LIKE "<label_matcher>"]]
   [ STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " } ]
]
[ORDER BY { <col_name> | <expr> | <position> }]
[LIMIT <limit>[OFFSET <offset>]];
```
## オプションパラメータ

**1. `<db_name>`**

> `db_name`が指定されていない場合、現在のデフォルトデータベースが使用されます。

**2. `<label_matcher>`**

> `LABEL LIKE = "<label_matcher>"`を使用する場合、ラベルに`label_matcher`を含むインポートタスクにマッチします。

**3. `<your_label>`**

> `LABEL = "<your_label>"`を使用する場合、指定されたラベルに正確にマッチします。

**4. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> `PENDING`を指定すると、`LOAD = "PENDING"`ステータスのジョブにマッチします。他のステータスキーワードについても同様です。

**5. `<col_name>`**

> ソート用の結果セットの列名を指定します。

**6. `<expr>`**

> ソート用の式を使用します。

**7. `<position>`**

> `SELECT`リストの列の位置（1から開始）でソートします。

**8. `<limit>`**

> `LIMIT`が指定されている場合、`limit`個のマッチしたレコードを表示します。指定されていない場合、すべてのレコードが表示されます。

**9. `<offset>`**

> クエリ結果の表示を`offset`から開始するように指定します。デフォルトでは、オフセットは0です。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Database | データベーステーブルのインポート権限が必要です。 |

## 戻り値

指定されたインポートタスクの詳細ステータスを返します。

## 例

1. デフォルトデータベースのすべてのインポートタスクを表示します。

    ```sql
    SHOW LOAD;
    ```
2. ラベルに文字列「2014_01_02」を含む、指定されたデータベース内のインポートタスクを表示し、最も古い10件のタスクを表示する。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
    ```
3. 指定されたデータベース内で、指定されたラベル"load_example_db_20140102"を持つインポートタスクを表示し、`LoadStartTime`で降順にソートします。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" ORDER BY LoadStartTime DESC;
    ```
4. 指定されたデータベース内で、指定されたラベル"load_example_db_20140102"、状態"loading"を持つインポートタスクを表示し、`LoadStartTime`で降順にソートします。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" AND STATE = "loading" ORDER BY LoadStartTime DESC;
    ```
5. 指定されたデータベース内のインポートタスクを表示し、`LoadStartTime`で降順にソートして、オフセット5から10件のクエリ結果の表示を開始します。

    ```sql
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 5,10;
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 10 offset 5;
    ```
6. 小バッチインポート中にインポートステータスを確認するコマンド。

    ```text
    curl --location-trusted -u {user}:{passwd} http://{hostname}:{port}/api/{database}/_load_info?label={labelname}
    ```
