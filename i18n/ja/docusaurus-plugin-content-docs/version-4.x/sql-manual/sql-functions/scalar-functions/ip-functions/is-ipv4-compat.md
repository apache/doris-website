---
{
    "title": "IS_IPV4_COMPAT",
    "language": "ja",
    "description": "IPv6 アドレスが IPv4 互換アドレスかを判定します。"
}
---

## 説明
IPv6 アドレスが IPv4 互換アドレスかを判定します。IPv4 互換アドレスは、IPv6 ネットワークで IPv4 アドレスを表す特殊な IPv6 アドレス形式です。

## 構文
```sql
IS_IPV4_COMPAT(<ipv6_address>)
```

### パラメータ
- `<ipv6_address>`: IPv6 アドレスのバイナリ表現（VARCHAR 型、16 バイト）

### 戻り値
戻り値の型: BOOLEAN

戻り値の意味: 1 は IPv4 互換アドレス、0 は IPv4 互換アドレスではないことを示します

### 使用上の注意
- IPv4 互換アドレスの形式は `::IPv4` です。先頭の 12 バイトが 0 で、最後の 4 バイトに IPv4 アドレスが格納されます
- 入力には 16 バイトの IPv6 バイナリデータを指定してください
- この形式は、IPv6 への移行期向けに RFC 4291 で定義されています
- 最後の 4 バイトを 0 にすることはできません。0.0.0.0 は IPv4 ユニキャストアドレスではなく、RFC 4291 の IPv4 互換 IPv6 アドレスの定義を満たさないため、`::0.0.0.0` は有効な IPv4 互換アドレスではありません
- 入力パラメータが NULL の場合は NULL を返します

## 例

IPv4 互換アドレスを判定します。
```sql
SELECT is_ipv4_compat(INET6_ATON('::192.168.1.1')) as is_compat;
+-----------+
| is_compat |
+-----------+
| 1         |
+-----------+
```

IPv4 互換アドレスではないアドレスを判定します。
```sql
SELECT 
  is_ipv4_compat(INET6_ATON('2001:db8::1')) as standard_ipv6,
  is_ipv4_compat(INET6_ATON('::ffff:192.168.1.1')) as ipv4_mapped,
  is_ipv4_compat(INET6_ATON('::0.0.0.0')) as zero_ip;
+--------------+------------+---------+
| standard_ipv6| ipv4_mapped| zero_ip |
+--------------+------------+---------+
| 0            | 0          | 0       |
+--------------+------------+---------+
```

境界値を判定します。
```sql
SELECT 
  is_ipv4_compat(INET6_ATON('::0.0.0.0')) as min_ip,
  is_ipv4_compat(INET6_ATON('::255.255.255.255')) as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 0      | 1      |
+--------+--------+
```

入力パラメータが NULL の場合は NULL を返します。
```sql
SELECT is_ipv4_compat(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

### キーワード

IS_IPV4_COMPAT
