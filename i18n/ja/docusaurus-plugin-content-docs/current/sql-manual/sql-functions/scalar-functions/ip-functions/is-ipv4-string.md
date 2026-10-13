---
{
    "title": "IS_IPV4_STRING",
    "language": "ja",
    "description": "入力文字列が有効な IPv4 アドレス形式かを判定します。有効な IPv4 アドレスの場合は 1、無効な場合は 0 を返します。"
}
---

## 説明
入力文字列が有効な IPv4 アドレス形式かを判定します。有効な IPv4 アドレスの場合は 1、無効な場合は 0 を返します。

## 別名
- IS_IPV4

## 構文
```sql
IS_IPV4_STRING(<ipv4_str>)
```

### パラメータ
- `<ipv4_str>`: 判定する文字列

### 戻り値
戻り値の型: BOOLEAN

戻り値の意味:
- 1 を返す場合、入力は有効な IPv4 アドレス形式です
- 0 を返す場合、入力は有効な IPv4 アドレス形式ではありません
- 入力が NULL の場合、NULL を返します

### 使用上の注意
- 文字列の形式が IPv4 アドレスの仕様（A.B.C.D 形式）に合っているかだけを判定します
- 実際の IP アドレス変換は行わず、形式のみを検証します
- NULL 入力に対応し、NULL を返します

## 例

有効な IPv4 アドレス形式を判定します。
```sql
SELECT is_ipv4_string('192.168.1.1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```

IPv4 アドレスの境界値を判定します。
```sql
SELECT 
  is_ipv4_string('0.0.0.0') as min_ip,
  is_ipv4_string('255.255.255.255') as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```

無効な IPv4 アドレス形式を判定します。
```sql
SELECT 
  is_ipv4_string('256.1.1.1') as invalid_range,
  is_ipv4_string('192.168.1') as missing_octet,
  is_ipv4_string('192.168.1.1.1') as extra_octet,
  is_ipv4_string('not-an-ip') as not_ip;
+---------------+----------------+--------------+--------+
| invalid_range | missing_octet | extra_octet | not_ip |
+---------------+----------------+--------------+--------+
| 0             | 0              | 0            | 0      |
+---------------+----------------+--------------+--------+
```

NULL 入力を判定します。
```sql
SELECT is_ipv4_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```

### キーワード

IS_IPV4_STRING

