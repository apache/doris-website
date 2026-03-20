---
{
  "title": "SHOW LOAD",
  "description": "この文は、指定されたインポートタスクの実行状況を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、指定されたインポートタスクの実行状況を表示するために使用されます。

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

> `PENDING`を指定すると、`LOAD = "PENDING"`ステータスのジョブにマッチすることを意味します。他のステータスキーワードについても同様です。

**5. `<col_name>`**

> ソート用の結果セット内のカラム名を指定します。

**6. `<expr>`**

> ソート用の式を使用します。

**7. `<position>`**

> `SELECT`リスト内のカラムの位置（1から開始）でソートします。

**8. `<limit>`**

> `LIMIT`が指定された場合、マッチした`limit`件のレコードを表示します。そうでなければ、すべてのレコードが表示されます。

**9. `<offset>`**

> クエリ結果をオフセット`offset`から表示開始することを指定します。デフォルトでは、オフセットは0です。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | Database | データベースTableのインポート権限が必要です。 |

## 戻り値

指定されたインポートタスクの詳細ステータスを返します。

## 例

1. デフォルトデータベース内のすべてのインポートタスクを表示します。

    ```sql
    SHOW LOAD;
    ```
2. ラベルに文字列"2014_01_02"を含む、指定されたデータベース内のインポートタスクを表示し、最も古い10個のタスクを表示する。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
    ```
3. 指定されたデータベースで、指定されたラベル "load_example_db_20140102" を持つインポートタスクを表示し、`LoadStartTime` の降順でソートします。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" ORDER BY LoadStartTime DESC;
    ```
4. 指定されたデータベース内で、指定されたラベル "load_example_db_20140102"、状態 "loading" を持つインポートタスクを表示し、`LoadStartTime` の降順でソートします。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" AND STATE = "loading" ORDER BY LoadStartTime DESC;
    ```
5. 指定されたデータベース内のインポートタスクを表示し、`LoadStartTime`で降順にソートして、オフセット5から10件のクエリ結果の表示を開始します。

    ```sql
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 5,10;
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 10 offset 5;
    ```
6. 小規模バッチインポート中にインポートステータスを確認するコマンド。

    ```text
    curl --location-trusted -u {user}:{passwd} http://{hostname}:{port}/api/{database}/_load_info?label={labelname}
    ```
