---
{
  "title": "FROM_HEX",
  "description": "入力バイナリデータをhexadecimal encodingを使用して変換された文字列に変換します。",
  "language": "ja"
}
---
## 説明

入力されたバイナリデータを16進エンコーディングを使用して変換された文字列に変換します。

## エイリアス

FROM_BINARY

## 構文

```sql
FROM_HEX ( <varbinary> )
```
## パラメータ

| Parameter | デスクリプション |
|-------|--------------|
| `<varbinary>` | 入力パラメータはバイナリデータです |

## Return value

入力バイナリデータを16進数エンコーディングを使用して文字列に変換します。

## Example

```sql
SELECT FROM_HEX(NULL);
```
```text
+----------------+
| FROM_HEX(NULL) |
+----------------+
| NULL           |
+----------------+
```
```sql
SELECT FROM_HEX(X'AB');
```
```text
+-----------------+
| FROM_HEX(X'AB') |
+-----------------+
| AB              |
+-----------------+
```
```sql
select *, from_binary(varbinary_c) from mysql_all_type_test.test_varbinary_db.test_varbinary
```
```text
+------+----------------------------+--------------------------+
| id   | varbinary_c                | from_binary(varbinary_c) |
+------+----------------------------+--------------------------+
|    1 | 0x48656C6C6F20576F726C64   | 48656C6C6F20576F726C64   |
|    2 | 0x48656C6C6F20576F726C6421 | 48656C6C6F20576F726C6421 |
|    3 | 0x48656C6C6F20576F726C6421 | 48656C6C6F20576F726C6421 |
|    4 | NULL                       | NULL                     |
|    5 | 0xAB                       | AB                       |
+------+----------------------------+--------------------------+
```
