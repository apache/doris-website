---
{
    "title": "SHOW EXPORT",
    "language": "ja",
    "description": "この構文は、指定したエクスポートジョブの実行状態を表示するために使用します。"
}
---

## 説明

この構文は、指定したエクスポートジョブの実行状態を表示するために使用します。

## 構文

```sql
SHOW EXPORT
[ FROM <db_name> ]
  [
    WHERE
      [ ID = <job_id> ]
      [ STATE = { "PENDING" | "EXPORTING" | "FINISHED" | "CANCELLED" } ]
      [ LABEL = <label> ]
   ]
[ ORDER BY <column_name> [ ASC | DESC ] [, column_name [ ASC | DESC ] ... ] ]
[ LIMIT <limit> ];
```

## 任意パラメータ

**1. `<db_name>`**: 任意のパラメータです。指定しない場合は、現在のデフォルトデータベースが使用されます。

**2. `<job_id>`**: 任意のパラメータです。表示するエクスポートジョブの ID を指定します。

**3. `<label>`**: 任意のパラメータです。表示するエクスポートジョブのラベルを指定します。

**4. `<column_name>`**: 任意のパラメータです。並べ替えに使用する列名を指定します。

**5. `<limit>`**: 任意のパラメータです。指定した場合は、一致するレコードを指定した件数だけ表示します。指定しない場合は、すべてのレコードを表示します。

## 返却結果

| 列 | データ型 | 説明 |
|-------------|-------------|-------------|
| JobId | string | ジョブの一意の ID |
| Label | string | エクスポートジョブのラベル。指定しない場合は、システムがデフォルトで生成します。 |
| State | string | ジョブの状態：<br> - `PENDING`：スケジュール待ち <br> - `EXPORTING`：データのエクスポート中 <br> - `FINISHED`：ジョブ成功 <br> - `CANCELLED`：ジョブ失敗 |
| Progress | string | ジョブの進捗。この進捗はクエリプラン単位で測定されます。たとえば、スレッドが 10 個あり、そのうち 3 個が完了した場合、進捗は 30% です。 |
| TaskInfo | json | JSON 形式で表示されるジョブ情報：<br> - db：データベース名 <br> - tbl：テーブル名 <br> - partitions：エクスポート対象として指定したパーティション。リストが `empty` の場合は、すべてのパーティションを意味します <br> - column_separator：エクスポートされるファイルの列区切り文字 <br> - line_delimiter：エクスポートされるファイルの行区切り文字 <br> - tablet num：対象となるタブレットの総数 <br> - broker：使用する Broker の名前 <br> - coord num：クエリプランの数 <br> - max_file_size：エクスポートされるファイルの最大サイズ <br> - delete_existing_files：エクスポート先ディレクトリにある既存のファイルとディレクトリを削除するかどうか <br> - columns：エクスポートする列。値が空の場合はすべての列をエクスポートします <br> - format：エクスポートするファイルの形式 |
| Path | string | リモートストレージ上のエクスポート先パス |
| CreateTime | string | ジョブの作成時刻 |
| StartTime | string | ジョブの開始時刻 |
| FinishTime | string | ジョブの終了時刻 |
| Timeout | int | ジョブのタイムアウト（秒単位）。時間は CreateTime から計算されます。 |
| ErrorMsg | string | ジョブでエラーが発生した場合は、その原因がここに表示されます。 |
| OutfileInfo | string | エクスポートジョブが成功した場合は、`SELECT INTO OUTFILE` の具体的な結果情報がここに表示されます。 |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明 |
|:-------------|:--------------------|:------------------------------------------------|
| SELECT_PRIV | データベース（Database） | データベースとテーブルに対する読み取りアクセス権が必要です。 |

## 例

- デフォルトデータベースのすべてのエクスポートジョブを表示します。

    ```sql
    SHOW EXPORT;
    ```

- 指定したデータベースのエクスポートジョブを、StartTime の降順で表示します。

    ```sql
     SHOW EXPORT FROM example_db ORDER BY StartTime DESC;
    ```

- 指定したデータベースで状態が「exporting」のエクスポートジョブを、StartTime の降順で表示します。

    ```sql
    SHOW EXPORT FROM example_db WHERE STATE = "exporting" ORDER BY StartTime DESC;
    ```

- 指定したデータベースの、job_id で指定したエクスポートジョブを表示します。

    ```sql
      SHOW EXPORT FROM example_db WHERE ID = job_id;
    ```

- 指定したデータベースの、ラベルで指定したエクスポートジョブを表示します。

    ```sql
     SHOW EXPORT FROM example_db WHERE LABEL = "mylabel";
    ```
