---
{
  "title": "IS_IP_ADDRESS_IN_RANGE",
  "language": "ja",
  "description": "IP（IPv4またはIPv6）アドレスがCIDR記法で表されたネットワークに含まれているかどうかを判定する。"
}
---
## 説明
IPアドレス（IPv4またはIPv6）がCIDR記法で表されたネットワークに含まれるかどうかを判定します。

## 構文

```sql
IS_IP_ADDRESS_IN_RANGE(ip_str, cidr_prefix)
```
## パラメータ
| パラメータ | 説明                                      |
|-----------|--------------------------------------------------|
| `<ip_str>`      | String型のIPv4またはIPv6アドレス |
| `<cidr_prefix>`      | CIDRプレフィックス |


## 戻り値
CIDR記法で表されるネットワークにアドレスが含まれる場合はtrueを返し、そうでなければfalseを返します。
- 入力がNULLの場合、関数はNULLを返します。


## 例

```sql
SELECT is_ip_address_in_range('127.0.0.1', '127.0.0.0/8') as v4, is_ip_address_in_range('::ffff:192.168.0.1', '::ffff:192.168.0.4/128') as v6, is_ip_address_in_range('127.0.0.1', NULL) as nil;
```
```text
+------+------+------+
| v4   | v6   | nil  |
+------+------+------+
|    1 |    0 | NULL |
+------+------+------+
```
