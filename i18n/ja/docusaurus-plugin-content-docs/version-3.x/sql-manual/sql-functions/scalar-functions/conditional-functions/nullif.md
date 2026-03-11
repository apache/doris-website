---
{
  "title": "NULLIF",
  "description": "2つの入力値が等しい場合はNULLを返し、そうでない場合は最初の入力値を返します。",
  "language": "ja"
}
---
## デスクリプション

2つの入力値が等しい場合は`NULL`を返し、そうでなければ最初の入力値を返します。この関数は以下の`CASE WHEN`式と等価です：

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```
## Syntax

```sql
NULLIF(<expr1>, <expr2>)
```
## パラメータ

| Parameter | デスクリプション |
|-----------|-------------|
| `<expr1>` | 比較する最初の入力値。 |
| `<expr2>` | 最初の値と比較する2番目の入力値。 |

## Return Value

- `<expr1>`が`<expr2>`と等しい場合、`NULL`を返します。
- それ以外の場合、`<expr1>`の値を返します。

## Examples

```sql
SELECT NULLIF(1, 1);
```
```text
+--------------+
| NULLIF(1, 1) |
+--------------+
|         NULL |
+--------------+
```
```sql
SELECT NULLIF(1, 0);
```
```text
+--------------+
| NULLIF(1, 0) |
+--------------+
|            1 |
+--------------+
```
