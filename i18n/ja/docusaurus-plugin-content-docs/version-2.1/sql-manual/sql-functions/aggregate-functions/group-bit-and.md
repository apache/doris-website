---
{
  "title": "GROUP_BIT_AND",
  "language": "ja",
  "description": "単一の整数列または式内のすべての値に対してbitwise AND演算を実行します。"
}
---
## 説明

単一の整数列または式のすべての値に対してビット単位のAND演算を実行します。

## 構文

```sql
GROUP_BIT_AND(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | すべてのINT型をサポート |

## 戻り値

整数値を返します。

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
select group_bit_and(value) from group_bit;
```
```text
+------------------------+
| group_bit_and(`value`) |
+------------------------+
|                      0 |
+------------------------+
```
