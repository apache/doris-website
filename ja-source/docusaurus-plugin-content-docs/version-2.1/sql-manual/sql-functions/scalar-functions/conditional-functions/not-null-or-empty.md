---
{
  "title": "NOT_NULL_OR_EMPTY",
  "language": "ja",
  "description": "notnullorempty関数は、与えられた値がNULLでも空でもないかをチェックします。"
}
---
## 説明

`not_null_or_empty`関数は、指定された値がNULLでも空でもないかどうかをチェックします。入力値がNULLではなく、かつ空の文字列でもない場合はtrueを返し、そうでなければfalseを返します。

## 構文

```sql
NOT_NULL_OR_EMPTY (<str>)
```
## パラメータ

| Parameter | Description         |
| --------- | ------------------- |
| `<str>`   | チェックする文字列 |

## 戻り値

文字列が空文字列またはNULLの場合はfalseを返し、それ以外の場合はtrueを返します。

## 例

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
