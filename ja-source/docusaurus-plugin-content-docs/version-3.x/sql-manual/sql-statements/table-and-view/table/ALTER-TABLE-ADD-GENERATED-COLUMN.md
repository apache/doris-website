---
{
  "title": "ALTER TABLE ADD GENERATED COLUMN",
  "description": "ALTER TABLE ADD COLUMNは、生成列の追加にはサポートされていません。",
  "language": "ja"
}
---
ALTER TABLE ADD COLUMNは生成されたカラムの追加をサポートしておらず、ALTER TABLE MODIFY COLUMNは生成されたカラム情報の変更をサポートしていません。
ALTER TABLE構文は、生成されたカラムの順序の変更、生成されたカラム名の変更、および生成されたカラムの削除をサポートしています。

サポートされていないシナリオでは、以下のエラーが報告されます：

```sql
mysql> CREATE TABLE test_alter_add_column(a int, b int) properties("replication_num"="1");
Query OK, 0 rows affected (0.14 sec)
mysql> ALTER TABLE test_alter_add_column ADD COLUMN c int AS (a+b);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table add generated columns.
mysql> ALTER TABLE test_alter MODIFY COLUMN c int KEY AS (a+b+1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table modify generated columns.
```
### REORDER COLUMN

```sql
ALTER TABLE products ORDER BY (product_id, total_value, price, quantity);
```
注記:
変更されたカラム順序は、カラム生成およびTable作成時の順序制限を満たす必要があります。
### RENAME COLUMN

```sql
ALTER TABLE products RENAME COLUMN total_value new_name;
```
注意:
Table内のカラム（生成カラムまたは通常のカラム）が他の生成カラムから参照されている場合、この生成カラムの名前を変更する前に、他の生成カラムを削除する必要があります。
### DROP COLUMN

```sql
ALTER TABLE products DROP COLUMN total_value;
```
注意：
Table内のカラム（生成カラムまたは通常カラム）が他の生成カラムから参照されている場合、参照されている生成カラムまたは通常カラムを削除する前に、まず他の生成カラムを削除する必要があります。
