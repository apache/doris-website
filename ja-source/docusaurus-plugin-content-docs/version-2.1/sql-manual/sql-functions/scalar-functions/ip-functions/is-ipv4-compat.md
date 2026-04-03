---
{
  "title": "IS_IPV4_COMPAT",
  "language": "ja",
  "description": "この関数は、INET6ATON()によって返されるバイナリ文字列として数値形式で表現されたIPv6アドレスを受け取ります。"
}
---
## 説明
この関数は、INET6_ATON()によって返される、バイナリ文字列として数値形式で表現されたIPv6アドレスを受け取ります。INET6_ATONはIPV6_STRING_TO_NUM_OR_NULLとも呼ばれます。
- IPv4互換アドレスは`::ipv4_address`の形式です

## 構文

```sql
IS_IPV4_COMPAT(INET6_ATON(<ipv4_addr>))
```
## パラメータ
| パラメータ | 説明                                      |
|-----------|--------------------------------------------------|
| `<ipv4_addr>`      | IPv4互換アドレス、'::ipv4_address'のような形式  |


## 戻り値
引数が有効なIPv4互換IPv6アドレスの場合は1を返し、そうでなければ0を返します。
- 入力がNULLの場合、関数はNULLを返します。


## 例

```sql
SELECT IS_IPV4_COMPAT(INET6_ATON('::ffff:10.0.5.9')) AS re1, IS_IPV4_COMPAT(INET6_ATON('::10.0.5.9')) AS re2;
```
```text
+------+------+
| re1  | re2  |
+------+------+
|    0 |    1 |
+------+------+
```
