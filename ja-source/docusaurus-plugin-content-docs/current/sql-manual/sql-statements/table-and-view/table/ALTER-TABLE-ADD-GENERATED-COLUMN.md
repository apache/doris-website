---
{
  "title": "ALTER TABLE ADD GENERATED COLUMN",
  "language": "ja",
  "description": "ALTER TABLE ADD COLUMNは生成列の追加をサポートしていません、"
}
---
ALTER TABLE ADD COLUMNは生成列の追加をサポートしておらず、ALTER TABLE MODIFY COLUMNは生成列情報の変更をサポートしていません。
ALTER TABLE構文は、生成列の順序の変更、生成列の名前の変更、および生成列の削除をサポートしています。

サポートされていないシナリオについては、以下のエラーが報告されます：

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
注意：
変更されたカラムの順序は、カラムの生成およびテーブルの作成時に順序制限を満たす必要があります。
### RENAME COLUMN

```sql
ALTER TABLE products RENAME COLUMN total_value new_name;
```
注意:
テーブル内のカラム（generated columnまたは通常のカラム）が他のgenerated columnによって参照されている場合、このgenerated columnの名前を変更する前に、他のgenerated columnを削除する必要があります。
### DROP COLUMN

```sql
ALTER TABLE products DROP COLUMN total_value;
```
注意:
テーブル内のカラム（generated columnまたは通常のカラム）が他のgenerated columnによって参照されている場合、参照されているgenerated columnまたは通常のカラムを削除する前に、まず他のgenerated columnを削除する必要があります。
