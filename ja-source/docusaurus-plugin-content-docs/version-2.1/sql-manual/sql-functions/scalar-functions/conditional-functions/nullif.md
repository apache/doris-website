---
{
  "title": "NULLIF",
  "language": "ja",
  "description": "2つの入力値が等しい場合はNULLを返し、そうでなければ最初の入力値を返します。"
}
---
## 説明

2つの入力値が等しい場合は`NULL`を返し、そうでない場合は最初の入力値を返します。この関数は以下の`CASE WHEN`式と同等です：

```sql
CASE
    WHEN <expr1> = <expr2> THEN NULL
    ELSE <expr1>
END
```
## 構文

```sql
NULLIF(<expr1>, <expr2>)
```
## パラメータ

| Parameter | Description |
|-----------|-------------|
| `<expr1>` | 比較する最初の入力値。 |
| `<expr2>` | 最初の値と比較する2番目の入力値。 |

## 戻り値

- `<expr1>`が`<expr2>`と等しい場合は`NULL`を返します。
- そうでなければ、`<expr1>`の値を返します。

## 例

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
