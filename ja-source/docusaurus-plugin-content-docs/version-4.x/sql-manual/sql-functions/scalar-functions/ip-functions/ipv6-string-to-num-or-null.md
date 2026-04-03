---
{
  "title": "IPV6_STRING_TO_NUM_OR_NULL | Ip Functions\n\nIPV6_STRING_TO_NUM_OR_NULL | IP関数",
  "sidebar_label": "IPV6_STRING_TO_NUM_OR_NULL",
  "description": "IPv6NumToStringの逆関数で、IPアドレス文字列を受け取り、バイナリ形式のIPv6アドレスを返します。",
  "language": "ja"
}
---
# IPV6_STRING_TO_NUM_OR_NULL

## デスクリプション
IPv6NumToStringの逆関数で、IPアドレス文字列を受け取り、バイナリ形式のIPv6アドレスを返します。

## Alias
- INET6_ATON

## Syntax

```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```
## パラメータ
| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | String型のIPv6アドレス  |


## 戻り値
バイナリ形式のIPv6アドレスを返します。
- 不正なIPアドレスが入力された場合、`NULL`が返されます。
- 入力文字列に有効なIPv4アドレスが含まれている場合、そのIPv6相当値を返します。

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
