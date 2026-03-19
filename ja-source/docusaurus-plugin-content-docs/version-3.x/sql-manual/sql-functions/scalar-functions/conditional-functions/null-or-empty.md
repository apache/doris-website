---
{
  "title": "NULL_OR_EMPTY",
  "description": "nullorempty関数は、与えられた値がNULLまたは空文字列かどうかをチェックします。入力値がNULLまたは空文字列の場合、trueを返します。",
  "language": "ja"
}
---
## 説明

`null_or_empty`関数は、指定された値がNULLまたは空文字列かどうかをチェックします。入力値がNULLまたは空文字列の場合はtrueを返し、そうでない場合はfalseを返します。

## 構文

```sql
NULL_OR_EMPTY (<str>)
```
## パラメータ

| Parameter | デスクリプション            |
| --------- | ---------------------- |
| `<str>`   | チェックする文字列。   |

## 戻り値

文字列が空文字列またはNULLの場合はtrueを返し、それ以外の場合はfalseを返します。

## 例

```sql
select null_or_empty(null);
```
```text
+---------------------+
| null_or_empty(NULL) |
+---------------------+
|                   1 |
+---------------------+
```
```sql
select null_or_empty("");
```
```text
+-------------------+
| null_or_empty('') |
+-------------------+
|                 1 |
+-------------------+
```
```sql
select null_or_empty("a");
```
```text
+--------------------+
| null_or_empty('a') |
+--------------------+
|                  0 |
+--------------------+
```
