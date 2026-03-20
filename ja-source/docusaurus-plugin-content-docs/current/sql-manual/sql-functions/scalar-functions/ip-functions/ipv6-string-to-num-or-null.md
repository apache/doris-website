---
{
  "title": "IPV6_STRING_TO_NUM_OR_NULL | IP関数",
  "language": "ja",
  "description": "IPv6NumToStringの逆関数で、IPアドレス文字列を受け取り、バイナリ形式のIPv6アドレスを返します。",
  "sidebar_label": "IPV6_STRING_TO_NUM_OR_NULL"
}
---
# IPV6_STRING_TO_NUM_OR_NULL

## 説明
IPv6NumToStringの逆関数で、IPアドレス文字列を受け取り、バイナリ形式のIPv6アドレスを返します。

## エイリアス
- INET6_ATON

## 構文

```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```
## パラメータ
| Parameter | Description                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | String型のIPv6アドレス  |


## 戻り値
バイナリ形式のIPv6アドレスを返します。
- 不正なIPアドレスが入力された場合、`NULL`が返されます。
- 入力文字列に有効なIPv4アドレスが含まれている場合、そのIPv6相当のアドレスを返します。

## 例

```sql
select hex(ipv6_string_to_num_or_null('1111::ffff')) as r1, hex(ipv6_string_to_num_or_null('192.168.0.1')) as r2, hex(ipv6_string_to_num_or_null('notaaddress')) as r3;
```
```text
+----------------------------------+----------------------------------+------+
| r1                               | r2                               | r3   |
+----------------------------------+----------------------------------+------+
| 1111000000000000000000000000FFFF | 00000000000000000000FFFFC0A80001 | NULL |
+----------------------------------+----------------------------------+------+
```
