---
{
    "title": "XOR",
    "language": "ja",
    "description": "二つの数値の XOR 値を返します。",
    "sidebar_label": "XOR"
}
---

# XOR

## 説明

二つの数値の XOR 値を返します。

## 構文
`BOOLEAN xor BOOLEAN`

## 使用例

```sql
mysql> select true xor false, true xor true;
```

```text
+------------------+-----------------+
| (TRUE XOR FALSE) | (TRUE XOR TRUE) |
+------------------+-----------------+
|                1 |               0 |
+------------------+-----------------+
```

## キーワード
	XOR
