---
{
    "title": "ALTER TABLE ADD GENERATED COLUMN",
    "language": "ja",
    "description": "ALTER TABLE ADD COLUMN では生成列を追加できません。"
}
---

ALTER TABLE ADD COLUMN では生成列を追加できず、ALTER TABLE MODIFY COLUMN では生成列の情報を変更できません。
ALTER TABLE 構文では、生成列の順序変更、名前変更、削除がサポートされています。

サポートされていない操作では、次のエラーが返されます。

```sql
mysql> CREATE TABLE test_alter_add_column(a int, b int) properties("replication_num"="1");
Query OK, 0 rows affected (0.14 sec)
mysql> ALTER TABLE test_alter_add_column ADD COLUMN c int AS (a+b);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table add generated columns.
mysql> ALTER TABLE test_alter MODIFY COLUMN c int KEY AS (a+b+1);
ERROR 1105 (HY000): errCode = 2, detailMessage = Not supporting alter table modify generated columns.
```

### 列の並べ替え

```sql
ALTER TABLE products ORDER BY (product_id, total_value, price, quantity);
```

注意:
列の順序を変更した後も、生成列とテーブルの作成時に適用される列順序の制約を満たす必要があります。
### 列名の変更

```sql
ALTER TABLE products RENAME COLUMN total_value new_name;
```

注意:
テーブル内の列（生成列または通常の列）が他の生成列から参照されている場合は、その列の名前を変更する前に、参照元の生成列を削除する必要があります。
### 列の削除

```sql
ALTER TABLE products DROP COLUMN total_value;
```

注意:
テーブル内の列（生成列または通常の列）が他の生成列から参照されている場合は、参照されている列を削除する前に、参照元の生成列を削除する必要があります。
