---
{
  "title": "GROUP_BIT_XOR",
  "language": "ja",
  "description": "単一の整数列または式内のすべての値に対してビットごとのxor演算を実行します。"
}
---
## 説明

単一の整数列または式内のすべての値に対してビット単位のxor演算を実行します。

## 構文

```sql
GROUP_BIT_XOR(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | すべてのINT型をサポート |

## 戻り値

整数値を返します

## 例

```sql
select * from group_bit;
```
```text
+-------+
| value |
+-------+
|     3 |
|     1 |
|     2 |
|     4 |
+-------+
```
```sql
select group_bit_xor(value) from group_bit;
```
```text
+------------------------+
| group_bit_xor(`value`) |
+------------------------+
|                      4 |
+------------------------+
```
