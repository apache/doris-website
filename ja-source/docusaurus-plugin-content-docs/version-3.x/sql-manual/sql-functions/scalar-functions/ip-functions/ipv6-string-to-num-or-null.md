---
{
  "title": "IPV6_STRING_TO_NUM_OR_NULL",
  "description": "IPv6NumToStringの逆関数で、IPアドレスのStringを受け取り、バイナリ形式のIPv6アドレスを返します。",
  "language": "ja"
}
---
## 概要
IPv6NumToStringの逆関数で、IPアドレスの文字列を受け取り、バイナリ形式のIPv6アドレスを返します。

## エイリアス
- INET6_ATON

## 構文

```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```
## パラメータ
| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | String型のIPv6アドレス  |


## Return Value
バイナリ形式のIPv6アドレスを返します。
- 不正なIPアドレスが入力された場合、`NULL`が返されます。
- 入力文字列に有効なIPv4アドレスが含まれている場合、そのIPv6等価値を返します。

## Example

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
