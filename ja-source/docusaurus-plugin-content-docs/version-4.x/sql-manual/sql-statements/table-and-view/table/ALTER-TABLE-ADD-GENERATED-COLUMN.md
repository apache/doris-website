---
{
  "title": "ALTER TABLE ADD GENERATED COLUMN",
  "description": "ALTER TABLE ADD COLUMNは、生成列の追加には対応していません。",
  "language": "ja"
}
---
ALTER TABLE ADD COLUMNは生成カラムの追加には対応しておらず、ALTER TABLE MODIFY COLUMNは生成カラム情報の変更には対応していません。
ALTER TABLE構文は、生成カラムの順序の変更、生成カラムの名前の変更、および生成カラムの削除には対応しています。

対応していないシナリオでは、以下のエラーが報告されます：

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
注意:
変更されたカラムの順序は、カラムの生成とTableの作成時に順序制限を満たす必要があります。
### RENAME COLUMN

```sql
ALTER TABLE products RENAME COLUMN total_value new_name;
```
注意:
Table内のカラム（生成カラムまたは通常のカラム）が他の生成カラムによって参照されている場合、この生成カラムの名前を変更する前に、他の生成カラムを削除する必要があります。
### DROP COLUMN

```sql
ALTER TABLE products DROP COLUMN total_value;
```
注意:
Table内のカラム（生成カラムまたは通常カラム）が他の生成カラムによって参照されている場合、参照されている生成カラムまたは通常カラムを削除する前に、まず他の生成カラムを削除する必要があります。
