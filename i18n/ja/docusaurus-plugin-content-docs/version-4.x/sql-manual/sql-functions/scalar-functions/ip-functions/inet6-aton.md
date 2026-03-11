---
{
  "title": "IPV6_STRING_TO_NUM_OR_NULL | Ip Functions",
  "sidebar_label": "IPV6_STRING_TO_NUM_OR_NULL",
  "description": "ipv6stringtonumornullの別名。",
  "language": "ja"
}
---
# IPV6_STRING_TO_NUM_OR_NULL

## inet6_aton

`ipv6_string_to_num_or_null`のエイリアスです。

## デスクリプション
IPv6テキストアドレスを16バイトのバイナリ表現に変換します。

## Syntax

```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```
### パラメータ
- `<ipv6_string>`: 文字列型のIPv6アドレス

### 戻り値
戻り値の型: VARCHAR (16バイトバイナリ、null許可)

戻り値の意味:
- IPv6の16バイトバイナリエンコーディングを返します
- 入力がNULLの場合、`NULL`を返します
- 無効なIPv6文字列の場合、`NULL`を返します
- 入力がIPv4テキストの場合、等価なIPv6アドレス（`::ffff:<ipv4>`）を返します

### 使用上の注意
- `ipv6_string_to_num_or_null`と一貫した動作をします：無効な入力に対して`NULL`を返します
- MySQLの`INET6_ATON`構文との互換性のために一般的に使用されます

## 例

IPv6テキスト`1111::ffff`を16バイトバイナリ（16進数で表示）に変換します。

```sql
select hex(ipv6_string_to_num_or_null('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```
IPv4テキストは自動的にIPv6（`::ffff:<ipv4>`）にマッピングされ、16バイトのバイナリとして返されます。

```sql
select hex(ipv6_string_to_num_or_null('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```
パラメータがNULLの場合はNULLを返します

```sql
select hex(ipv6_string_to_num_or_null(NULL)) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```
無効な入力に対してはNULLを返します（例外は発生しません）。

```sql
select hex(ipv6_string_to_num_or_null('notaaddress')) as invalid;
+----------+
| invalid  |
+----------+
| NULL     |
+----------+
```
### Keywords

INET6_ATON, IPV6_STRING_TO_NUM_OR_NULL
