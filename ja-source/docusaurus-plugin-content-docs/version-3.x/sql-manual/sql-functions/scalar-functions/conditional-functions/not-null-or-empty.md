---
{
  "title": "NOT_NULL_OR_EMPTY",
  "description": "notnullorempty 関数は、指定された値が NULL でも空でもないかどうかをチェックします。",
  "language": "ja"
}
---
## 説明

`not_null_or_empty`関数は、指定された値がNULLでも空でもないかどうかをチェックします。入力値がNULLでなく、かつ空文字列でない場合はtrueを返し、そうでない場合はfalseを返します。

## 構文

```sql
NOT_NULL_OR_EMPTY (<str>)
```
## パラメータ

| Parameter | デスクリプション |
| --------- | ----------- |
| `<str>`   | チェックする文字列 |

## Return Value

文字列が空文字列またはNULLの場合はfalseを返し、それ以外の場合はtrueを返します。

## Examples

```sql
select not_null_or_empty(null);
```
```text
+-------------------------+
| not_null_or_empty(NULL) |
+-------------------------+
|                       0 |
+-------------------------+
```
```sql
select not_null_or_empty("");
```
```text
+-----------------------+
| not_null_or_empty('') |
+-----------------------+
|                     0 |
+-----------------------+
```
```sql
select not_null_or_empty("a");
```
```text
+------------------------+
| not_null_or_empty('a') |
+------------------------+
|                      1 |
+------------------------+
```
