---
{
  "title": "ALTER TABLE ROLLUP",
  "description": "この文は既存のtableに対してrollup変更操作を実行するために使用されます。rollupは非同期操作であり、",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、既存のtableに対してrollup変更操作を実行するために使用されます。rollupは非同期操作であり、タスクが正常に送信されるとタスクが返されます。その後、[SHOW ALTER](../../../../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE)コマンドを使用して進行状況を確認できます。

文法:

```sql
ALTER TABLE [database.]table alter_clause;
```
rollupのalter_clauseは以下の作成方法をサポートしています

1. rollupインデックスの作成

文法:

```sql
ADD ROLLUP rollup_name (column_name1, column_name2, ...)
[FROM from_index_name]
[PROPERTIES ("key"="value", ...)]
```
properties: タイムアウト時間の設定をサポートします。デフォルトのタイムアウト時間は1日です。

2. rollupインデックスをバッチで作成

grammar:

```sql
ADD ROLLUP [rollup_name (column_name1, column_name2, ...)
                    [FROM from_index_name]
                    [PROPERTIES ("key"="value", ...)],...]
```
注意:

- from_index_nameが指定されていない場合、デフォルトでベースインデックスから作成されます
- rollupTableの列は、from_indexに既に存在する列である必要があります
- propertiesでは、ストレージ形式を指定できます。詳細については、[CREATE TABLE](./CREATE-TABLE)を参照してください

3. rollupインデックスの削除

文法:

```sql
DROP ROLLUP rollup_name [PROPERTIES ("key"="value", ...)]
```
4. rollup indexのバッチ削除

文法：

```sql
DROP ROLLUP [rollup_name [PROPERTIES ("key"="value", ...)],...]
```
注意:

- ベースインデックスは削除できません

## Example

1. インデックスを作成: example_rollup_index、ベースインデックス(k1,k2,k3,v1,v2)に基づく。列指向ストレージ。

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1, v2);
```
2. インデックスを作成: example_rollup_index2、example_rollup_index (k1,k3,v1,v2) をベースとする

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index2 (k1, v1)
FROM example_rollup_index;
```
3. インデックスを作成する：example_rollup_index3、ベースインデックス（k1,k2,k3,v1）に基づき、カスタムrollupタイムアウトを1時間に設定。

```sql
ALTER TABLE example_db.my_table
ADD ROLLUP example_rollup_index(k1, k3, v1)
PROPERTIES("timeout" = "3600");
```
4. インデックスを削除する: example_rollup_index2

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2;
```
5. Batch Delete rollup index

```sql
ALTER TABLE example_db.my_table
DROP ROLLUP example_rollup_index2,example_rollup_index3;
```
### 

4. キーワード

```text
ALTER, TABLE, ROLLUP, ALTER TABLE
```
## ベストプラクティス
