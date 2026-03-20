---
{
  "title": "XOR | 数値関数",
  "sidebar_label": "XOR",
  "description": "2つの数値のXOR値を返します。",
  "language": "ja"
}
---
# XOR

## デスクリプション

2つの数値のXOR値を返します。

## Syntax
`BOOLEAN xor BOOLEAN`

## Example

```sql
mysql >select true xor false,true xor true;
+------------------+-----------------+
| (TRUE XOR FALSE) | (TRUE XOR TRUE) |
+------------------+-----------------+
|                1 |               0 |
+------------------+-----------------+

```
## Keywords
	XOR
