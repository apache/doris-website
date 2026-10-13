---
{
    "title": "IS_IPV4_MAPPED",
    "language": "ja",
    "description": "IPv6 アドレスが IPv4 マップアドレスかを判定します。"
}
---

## 説明
IPv6 アドレスが IPv4 マップアドレスかを判定します。IPv4 マップアドレスは、IPv6 ネットワークで IPv4 アドレスを表す特殊な IPv6 アドレス形式です。

## 構文
```sql
IS_IPV4_MAPPED(<ipv6_address>)
```

### パラメータ
- `<ipv6_address>`: IPv6 アドレスのバイナリ表現（VARCHAR 型、16 バイト）

### 戻り値
戻り値の型: BOOLEAN

戻り値の意味: 1 は IPv4 マップアドレス、0 は IPv4 マップアドレスではないことを示します

### 使用上の注意
- IPv4 マップアドレスの形式は `::ffff:IPv4` です。先頭の 10 バイトが 0、11-12 バイト目が 0xFFFF で、最後の 4 バイトに IPv4 アドレスが格納されます
- 入力には 16 バイトの IPv6 バイナリデータを指定してください
- この形式は RFC 4291 で定義されており、IPv6 で IPv4 アドレスを表すために最も一般的に使われます
- 入力パラメータが NULL の場合は NULL を返します

## 例

IPv4 マップアドレスを判定します。
```sql
SELECT is_ipv4_mapped(INET6_ATON('::ffff:192.168.1.1')) as is_mapped;
+-----------+
| is_mapped |
+-----------+
| 1         |
+-----------+
```

IPv4 マップアドレスではないアドレスを判定します。
```sql
SELECT 
  is_ipv4_mapped(INET6_ATON('2001:db8::1')) as standard_ipv6,
  is_ipv4_mapped(INET6_ATON('::192.168.1.1')) as ipv4_compat;
+--------------+------------+
| standard_ipv6| ipv4_compat|
+--------------+------------+
| 0            | 0          |
+--------------+------------+
```

境界値を判定します。
```sql
SELECT 
  is_ipv4_mapped(INET6_ATON('::ffff:0.0.0.0')) as min_ip,
  is_ipv4_mapped(INET6_ATON('::ffff:255.255.255.255')) as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```

入力パラメータが NULL の場合は NULL を返します。
```sql
SELECT is_ipv4_mapped(NULL) as null_result;
+-------------+
| null_result |
+-------------+
|        NULL |
+-------------+
```

### キーワード

IS_IPV4_MAPPED
