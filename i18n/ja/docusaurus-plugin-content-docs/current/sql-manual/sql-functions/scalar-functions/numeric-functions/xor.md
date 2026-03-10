---
{
  "title": "XOR | 数値関数",
  "language": "ja",
  "description": "2つの数値のXOR値を返します。",
  "sidebar_label": "XOR"
}
---
# XOR

## 説明

2つの数値のXOR値を返します。

## 構文
`BOOLEAN xor BOOLEAN`

## 例

```sql
mysql >select true xor false,true xor true;
+------------------+-----------------+
| (TRUE XOR FALSE) | (TRUE XOR TRUE) |
+------------------+-----------------+
|                1 |               0 |
+------------------+-----------------+

```
## キーワード
	XOR
