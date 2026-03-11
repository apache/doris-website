---
{
  "title": "FACTORIAL",
  "description": "xの階乗を返します。xが0から20の範囲内（0と20を含む）にない場合はNULLを返します。",
  "language": "ja"
}
---
## 説明

`x`の階乗を返します。`x`が`0`から`20`の範囲（`0`と`20`を含む）にない場合は`NULL`を返します。

## 構文

```sql
FACTORIAL(<x>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<x>` | 階乗を計算する値 |

## Return Value

パラメータ `x` の階乗値。

## Special Cases

- `x` が 0 の場合、1 を返す
- `x` が範囲 [0, 20] にない場合、`NULL` を返す
- `x` が NULL の場合、NULL を返す

## Examples

```sql
select factorial(0);
```
```text
+--------------+
| factorial(0) |
+--------------+
|            1 |
+--------------+
```
```sql
select factorial(-1);
```
```text
+---------------+
| factorial(-1) |
+---------------+
|          NULL |
+---------------+
```
```sql
select factorial(21);
```
```text
+---------------+
| factorial(21) |
+---------------+
|          NULL |
+---------------+
```
```sql
select factorial(20);
```
```text
+---------------------+
| factorial(20)       |
+---------------------+
| 2432902008176640000 |
+---------------------+
```
```sql
select factorial(NULL);
```
```text
+-----------------+
| factorial(NULL) |
+-----------------+
|            NULL |
+-----------------+
```
