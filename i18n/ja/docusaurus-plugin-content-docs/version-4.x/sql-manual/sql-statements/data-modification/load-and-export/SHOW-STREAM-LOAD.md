---
{
    "title": "SHOW STREAM LOAD",
    "language": "ja",
    "description": "指定した Stream Load タスクの実行状況を表示するステートメントです"
}
---

## 説明

このステートメントは、指定した Stream Load タスクの実行状況を表示します。

構文:

```sql
SHOW STREAM LOAD
[FROM db_name]
[
  WHERE
  [LABEL [ = "your_label" | LIKE "label_matcher"]]
  [STATUS = ["SUCCESS"|"FAIL"]]
]
[ORDER BY...]
[LIMIT limit][OFFSET offset];
```

補足:

1. デフォルトでは、BE は Stream Load の記録を保存しません。記録を確認するには、BE で設定項目 `enable_stream_load_record=true` を有効にする必要があります。詳細は [BE の設定項目](../../../../admin-manual/config/be-config) を参照してください。
2. db_name を指定しない場合は、現在のデフォルトのデータベースが使用されます。
3. LABEL LIKE を使用した場合は、Stream Load タスクのラベルに label_matcher が含まれるタスクに一致します。
4. LABEL = を使用した場合は、指定したラベルに完全一致します。
5. STATUS を指定した場合は、STREAM LOAD のステータスに一致するタスクを抽出します。
6. ORDER BY を使用すると、任意の列の組み合わせで並べ替えられます。
7. LIMIT を指定した場合は、一致したレコードのうち、指定した件数を表示します。指定しない場合は、すべて表示します。
8. OFFSET を指定した場合は、指定したオフセット位置からクエリ結果を表示します。デフォルトのオフセットは 0 です。

## 例

1. デフォルトのデータベースのすべての Stream Load タスクを表示します。

   ```sql
     SHOW STREAM LOAD;
   ```

2. 指定したデータベースで、ラベルに文字列 "2014_01_02" が含まれる Stream Load タスクのうち、最も古い 10 件を表示します。

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
   ```

3. 指定したデータベースで、ラベルが "load_example_db_20140102" の Stream Load タスクを表示します。

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE LABEL = "load_example_db_20140102";
   ```

4. 指定したデータベースで、ステータスが "success" の Stream Load タスクを表示し、StartTime の降順に並べ替えます。

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE STATUS = "success" ORDER BY StartTime DESC;
   ```

5. 指定したデータベースのロードタスクを StartTime の降順に並べ替え、オフセット 5 から 10 件のクエリ結果を表示します。

   ```sql
   SHOW STREAM LOAD FROM example_db ORDER BY StartTime DESC limit 5,10;
   SHOW STREAM LOAD FROM example_db ORDER BY StartTime DESC limit 10 offset 5;
   ```

## キーワード

SHOW, STREAM, LOAD

