---
{
    "title": "ALTER TABLE ROLLUP",
    "language": "ja",
    "description": "このステートメントは、既存のテーブルに対するロールアップの変更に使用します。ロールアップは非同期操作です。"
}
---

## 説明

このステートメントは、既存のテーブルに対するロールアップの変更に使用します。ロールアップは非同期操作であり、タスクの送信に成功すると処理が返ります。その後、[SHOW ALTER](../../../../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE) コマンドで進捗を確認できます。

構文:

```sql
ALTER TABLE [database.]table alter_clause;
```

ロールアップの alter_clause は、次の操作をサポートします。

1. ロールアップインデックスを作成する

構文:

```sql
ADD ROLLUP rollup_name (column_name1, column_name2, ...)
[FROM from_index_name]
[PROPERTIES ("key"="value", ...)]
```

プロパティ: タイムアウト時間を設定できます。デフォルトのタイムアウト時間は 1 日です。

2. ロールアップインデックスを一括作成する

構文:

```sql
ADD ROLLUP [rollup_name (column_name1, column_name2, ...)
                    [FROM from_index_name]
                    [PROPERTIES ("key"="value", ...)],...]
```

注意:

- from_index_name を指定しない場合、デフォルトでベースインデックスから作成されます。
- ロールアップテーブルの列は、from_index に存在する列でなければなりません。
- properties でストレージ形式を指定できます。詳細は [CREATE TABLE](./CREATE-TABLE) を参照してください。

3. ロールアップインデックスを削除する

 構文:

```sql
DROP ROLLUP rollup_name [PROPERTIES ("key"="value", ...)]
```

4. ロールアップインデックスを一括削除する

構文:

```sql
DROP ROLLUP [rollup_name [PROPERTIES ("key"="value", ...)],...]
```

注意:

- ベースインデックスは削除できません。

## 例

1. ベースインデックス (k1,k2,k3,v1,v2) を基に、列指向ストレージのインデックス example_rollup_index を作成します。

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1, v2);
```

2. インデックス example_rollup_index (k1,k3,v1,v2) を基に、インデックス example_rollup_index2 を作成します。

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index2 (k1, v1)
FROM example_rollup_index;
```

3. ベースインデックス (k1,k2,k3,v1) を基に、ロールアップのタイムアウトを一時間に設定したインデックス example_rollup_index3 を作成します。

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1)
PROPERTIES("timeout" = "3600");
```

4. インデックス example_rollup_index2 を削除します。

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2;
```

5. ロールアップインデックスを一括削除します。

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2,example_rollup_index3;
```

## キーワード

```text
ALTER, TABLE, ROLLUP, ALTER TABLE
```

## ベストプラクティス
