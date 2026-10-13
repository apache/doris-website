---
{
    "title": "IS_IPV6_STRING",
    "language": "ja",
    "description": "入力文字列が有効な IPv6 アドレス形式かを判定します。有効な IPv6 アドレスの場合は 1、無効な場合は 0 を返します。"
}
---

## 説明
入力文字列が有効な IPv6 アドレス形式かを判定します。有効な IPv6 アドレスの場合は 1、無効な場合は 0 を返します。

## 別名
- IS_IPV6

## 構文
```sql
IS_IPV6_STRING(<ipv6_str>)
```

### パラメータ
- `<ipv6_str>`: 判定する文字列

### 戻り値
戻り値の型: BOOLEAN

戻り値の意味:
- 1 を返す場合、入力は有効な IPv6 アドレス形式です
- 0 を返す場合、入力は有効な IPv6 アドレス形式ではありません
- 入力が NULL の場合、NULL を返します

### 使用上の注意
- 文字列の形式が IPv6 アドレスの仕様に合っているかだけを判定します
- 実際の IP アドレス変換は行わず、形式のみを検証します
- NULL 入力に対応し、NULL を返します

## 例

有効な IPv6 アドレス形式を判定します。
```sql
SELECT is_ipv6_string('2001:db8::1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```

さまざまな IPv6 アドレス形式を判定します。
```sql
SELECT 
  is_ipv6_string('::1') as localhost,
  is_ipv6_string('2001:db8::1') as standard,
  is_ipv6_string('2001:db8:0:0:0:0:0:1') as expanded;
+-----------+----------+----------+
| localhost | standard | expanded |
+-----------+----------+----------+
| 1         | 1        | 1        |
+-----------+----------+----------+
```

無効な IPv6 アドレス形式を判定します。
```sql
SELECT 
  is_ipv6_string('2001:db8::1::2') as double_colon,
  is_ipv6_string('2001:db8:1') as too_short,
  is_ipv6_string('2001:db8:1:2:3:4:5:6:7') as too_long,
  is_ipv6_string('not-an-ipv6') as not_ipv6;
+--------------+-----------+----------+----------+
| double_colon | too_short | too_long | not_ipv6 |
+--------------+-----------+----------+----------+
| 0            | 0         | 0        | 0        |
+--------------+-----------+----------+----------+
```

NULL 入力を判定します。
```sql
SELECT is_ipv6_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```

### キーワード

IS_IPV6_STRING
