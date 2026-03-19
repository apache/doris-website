---
{
  "title": "IFNULL",
  "language": "ja",
  "description": "<expr1>がNULLでない場合は<expr1>を返し、そうでなければ<expr2>を返します。"
}
---
## 説明

`<expr1>`が`NULL`でない場合は`<expr1>`を返し、そうでなければ`<expr2>`を返します。

## エイリアス

- NVL

## 構文

```sql
IFNULL(<expr1>, <expr2>)
```
## パラメータ

| Parameter  | Description |
|-----------|-------------|
| `<expr1>` | `NULL`をチェックする最初の式。 |
| `<expr2>` | `<expr1>`が`NULL`の場合に返す値。 |

## 戻り値

- `<expr1>`が`NULL`でない場合、`<expr1>`を返します。
- そうでない場合、`<expr2>`を返します。

## 例

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
