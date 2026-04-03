---
{
  "title": "IFNULL",
  "description": "<expr1>がNULLでない場合は<expr1>を返し、そうでない場合は<expr2>を返します。",
  "language": "ja"
}
---
## デスクリプション

`<expr1>`が`NULL`でない場合は`<expr1>`を返し、そうでなければ`<expr2>`を返します。

## Alias

- NVL

## Syntax

```sql
IFNULL(<expr1>, <expr2>)
```
## パラメータ

| Parameter  | デスクリプション |
|-----------|-------------|
| `<expr1>` | `NULL`かどうかをチェックする最初の式。 |
| `<expr2>` | `<expr1>`が`NULL`の場合に返される値。 |

## Return Value

- `<expr1>`が`NULL`でない場合は`<expr1>`を返す。
- そうでない場合は`<expr2>`を返す。

## Examples

```sql
SELECT IFNULL(1, 0);
```
```text
+--------------+
| IFNULL(1, 0) |
+--------------+
|            1 |
+--------------+
```
```sql
SELECT IFNULL(NULL, 10);
```
```text
+------------------+
| IFNULL(NULL, 10) |
+------------------+
|               10 |
+------------------+
```
