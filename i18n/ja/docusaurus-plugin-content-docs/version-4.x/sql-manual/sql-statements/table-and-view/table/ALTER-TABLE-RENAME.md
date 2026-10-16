---
{
    "title": "ALTER TABLE RENAME",
    "language": "ja",
    "description": "既存テーブルに関する一部の名前を変更するためのステートメントです。この操作は同期的に実行されます。"
}
---

## 説明

このステートメントは、既存テーブルに関する一部の名前を変更します。操作は同期的に実行され、コマンドが返った時点で処理は完了しています。

構文:

```sql
ALTER TABLE [database.]table alter_clause;
```

名前の変更に使用する alter_clause では、次の名前を変更できます。

1. テーブル名を変更する

構文:

```sql
RENAME new_table_name;
```

2. ロールアップインデックス名を変更する

 構文:

```sql
RENAME ROLLUP old_rollup_name new_rollup_name;
```

3. パーティション名を変更する

構文:

```sql
RENAME PARTITION old_partition_name new_partition_name;
```

4. カラム名を変更する

:::tip ヒント
この機能は Apache Doris 1.2 以降でサポートされています。
:::

カラム名を変更する



構文:

```sql
RENAME COLUMN old_column_name new_column_name;
```

注意:

- テーブルの作成時に、プロパティに 'light_schema_change=true' を設定する必要があります。


## 例

1. テーブル table1 の名前を table2 に変更する

```sql
ALTER TABLE table1 RENAME table2;
```

2. テーブル example_table のロールアップインデックス rollup1 の名前を rollup2 に変更する

```sql
ALTER TABLE example_table RENAME ROLLUP rollup1 rollup2;
```

3. テーブル example_table のパーティション p1 の名前を p2 に変更する

```sql
ALTER TABLE example_table RENAME PARTITION p1 p2;
```

4. テーブル example_table のカラム c1 の名前を c2 に変更する

```sql
ALTER TABLE example_table RENAME COLUMN c1 c2;
```

## キーワード

```text
ALTER, TABLE, RENAME, ALTER TABLE
```

## ベストプラクティス

