---
{
  "title": "IS_IPV4_MAPPED",
  "description": "この関数は、INET6ATON()によって返されるバイナリ文字列として数値形式で表現されたIPv6アドレスを受け取ります。",
  "language": "ja"
}
---
## 説明
この関数は、INET6_ATON()によって返される、バイナリ文字列として数値形式で表現されたIPv6アドレスを受け取ります。INET6_ATONはIPV6_STRING_TO_NUM_OR_NULLとも呼ばれます。
- IPv4マップドアドレスは`::ffff:ipv4_address`の形式を持ちます。

## 構文

```sql
IS_IPV4_MAPPED(INET6_ATON(<ipv4_addr>))
```
## パラメータ
| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<ipv4_addr>`      | IPv4互換アドレスで、'::ipv4_address'のような形式です  |


## Return Value
引数が有効なIPv4マップIPv6アドレスの場合は1を、そうでなければ0を返します。
- 入力がNULLの場合、関数はNULLを返します。


## Example

```sql
SELECT IS_IPV4_MAPPED(INET6_ATON('::ffff:10.0.5.9')) AS re1, IS_IPV4_MAPPED(INET6_ATON('::10.0.5.9')) AS re2;
```
```text
+------+------+
| re1  | re2  |
+------+------+
|    1 |    0 |
+------+------+
```
