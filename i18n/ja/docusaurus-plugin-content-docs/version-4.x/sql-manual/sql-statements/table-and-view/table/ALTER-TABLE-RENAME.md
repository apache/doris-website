---
{
  "title": "ALTER TABLE RENAME",
  "description": "この文は既存のtableプロパティの特定の名前を変更するために使用されます。この操作は同期的です。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、既存のtableプロパティの特定の名前を変更するために使用されます。この操作は同期的であり、コマンドの戻りは実行の完了を示します。

grammar:

```sql
ALTER TABLE [database.]table alter_clause;
```
alter_clauseのrenameは以下の名前の変更をサポートします

1. Table名の変更

文法：

```sql
RENAME new_table_name;
```
2. rollup インデックス名を変更する

文法:

```sql
RENAME ROLLUP old_rollup_name new_rollup_name;
```
3. パーティション名を変更する

grammar:

```sql
RENAME PARTITION old_partition_name new_partition_name;
```
4. カラム名の変更

:::tip Tips
この機能は Apache Doris 1.2 バージョンから対応しています
:::

カラム名の変更



grammar:

```sql
RENAME COLUMN old_column_name new_column_name;
```
注意：

- Tableを作成する際は、プロパティで 'light_schema_change=true' を設定する必要があります。


## 例

1. table1 という名前のTableを table2 に変更する

```sql
ALTER TABLE table1 RENAME table2;
```
2. Table example_table 内の rollup1 という名前の rollup インデックスを rollup2 に変更する

```sql
ALTER TABLE example_table RENAME ROLLUP rollup1 rollup2;
```
3. Tableexample_table内のp1という名前のパーティションをp2に変更する

```sql
ALTER TABLE example_table RENAME PARTITION p1 p2;
```
4. Table example_table の c1 という名前の列を c2 に変更する

```sql
ALTER TABLE example_table RENAME COLUMN c1 c2;
```
## キーワード

```text
ALTER, TABLE, RENAME, ALTER TABLE
```
## ベストプラクティス
