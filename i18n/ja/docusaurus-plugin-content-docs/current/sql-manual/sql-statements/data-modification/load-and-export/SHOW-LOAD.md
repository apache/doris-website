---
{
    "title": "SHOW LOAD",
    "language": "ja",
    "description": "このステートメントは、指定したインポートタスクの実行状態を表示します。"
}
---

## 説明

このステートメントは、指定したインポートタスクの実行状態を表示します。

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

## オプションのパラメータ

**1. `<db_name>`**

> `db_name` を指定しない場合は、現在のデフォルトデータベースが使用されます。

**2. `<label_matcher>`**

> `LABEL LIKE = "<label_matcher>"` を使用すると、ラベルに `label_matcher` を含むインポートタスクに一致します。

**3. `<your_label>`**

> `LABEL = "<your_label>"` を使用すると、指定したラベルに完全一致します。

**4. STATE = { " PENDING " | " ETL " | " LOADING " | " FINISHED " | " CANCELLED " }**

> `PENDING` を指定すると、`STATE = "PENDING"` の状態にあるジョブに一致します。他の状態キーワードも同様です。

**5. `<col_name>`**

> ソートに使用する結果セット内の列名を指定します。

**6. `<expr>`**

> 式を使用してソートします。

**7. `<position>`**

> `SELECT` リスト内の列の位置（1 から始まります）でソートします。

**8. `<limit>`**

> `LIMIT` を指定すると、一致するレコードを `limit` 件表示します。指定しない場合は、すべてのレコードを表示します。

**9. `<offset>`**

> クエリ結果の表示を開始するオフセット `offset` を指定します。デフォルトのオフセットは 0 です。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :---------------- | :------------- | :---------------------------- |
| LOAD_PRIV | データベース | データベース内のテーブルに対するインポート権限が必要です。 |

## 戻り値

指定したインポートタスクの詳細な状態を返します。

## 例

1. デフォルトデータベース内のすべてのインポートタスクを表示します。

    ```sql
    SHOW LOAD;
    ```

2. 指定したデータベースで、ラベルに文字列 "2014_01_02" を含むインポートタスクを表示し、古い順に 10 件表示します。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
    ```

3. 指定したデータベースで、ラベルが "load_example_db_20140102" のインポートタスクを表示し、`LoadStartTime` の降順にソートします。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" ORDER BY LoadStartTime DESC;
    ```

4. 指定したデータベースで、ラベルが "load_example_db_20140102"、状態が "loading" のインポートタスクを表示し、`LoadStartTime` の降順にソートします。

    ```sql
    SHOW LOAD FROM example_db WHERE LABEL = "load_example_db_20140102" AND STATE = "loading" ORDER BY LoadStartTime DESC;
    ```

5. 指定したデータベース内のインポートタスクを `LoadStartTime` の降順にソートし、オフセット 5 から 10 件のクエリ結果を表示します。

    ```sql
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 5,10;
    SHOW LOAD FROM example_db ORDER BY LoadStartTime DESC limit 10 offset 5;
    ```

6. 小規模なバッチインポート中にインポート状態を確認するコマンドです。

    ```text
    curl --location-trusted -u {user}:{passwd} http://{hostname}:{port}/api/{database}/_load_info?label={labelname}
    ```
