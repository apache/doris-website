---
{
  "title": "IPV6_NUM_TO_STRING | Ip Functions",
  "sidebar_label": "IPV6_NUM_TO_STRING",
  "description": "IPv6アドレスをString型のバイナリ形式で受け取ります。このアドレスをテキスト形式の文字列として返します。",
  "language": "ja"
}
---
# IPV6_NUM_TO_STRING

## デスクリプション
String型のバイナリ形式のIPv6アドレスを受け取ります。このアドレスをテキスト形式の文字列として返します。
- IPv6でマップされたIPv4アドレスは::ffff:111.222.33.で始まります。

## Alias
- INET6_NTOA

## Syntax

```sql
IPV6_NUM_TO_STRING(<ipv6_num>)
```
## パラメータ
| Parameter | デスクリプション                                      |
|-----------|--------------------------------------------------|
| `<ipv6_num>`      | String型のバイナリ形式のIPv6アドレス  |

## Return Value
テキスト形式のipv6アドレスの文字列を返します。
- 入力文字列が有効なIPv6アドレスのバイナリエンコーディングでない場合、`NULL`が返されます。


## Example

```sql
select ipv6_num_to_string(unhex('2A0206B8000000000000000000000011')) as addr, ipv6_num_to_string("-23vno12i34nlfwlsj");
```
```text
+--------------+------------------------------------------+
| addr         | ipv6_num_to_string('-23vno12i34nlfwlsj') |
+--------------+------------------------------------------+
| 2a02:6b8::11 | NULL                                     |
+--------------+------------------------------------------+
```
