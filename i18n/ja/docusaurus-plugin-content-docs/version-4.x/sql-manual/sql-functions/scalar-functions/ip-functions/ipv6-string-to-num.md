---
{
    "title": "IPV6_STRING_TO_NUM",
    "language": "ja",
    "description": "IP アドレス文字列を受け取り、IPv6 アドレスをバイナリ形式で返す IPV6_NUM_TO_STRING の逆関数です。"
}
---

## 説明
IPV6_NUM_TO_STRING の逆関数です。IP アドレス文字列を受け取り、IPv6 アドレスをバイナリ形式で返します。

## 構文
```sql
IPV6_STRING_TO_NUM(<ipv6_string>)
```

### パラメータ
- `<ipv6_string>`: 文字列型の IPv6 アドレス

### 戻り値
戻り値の型: VARCHAR（16 バイトのバイナリ）

戻り値の意味:
- IPv6 アドレスを 16 バイトのバイナリ形式で返します
- 入力が NULL または無効な IP アドレスの場合は例外が発生します
- 入力が有効な IPv4 文字列の場合は、対応する IPv6 アドレス（`::ffff:<ipv4>`）を返します

### 使用上の注意
- 標準的な IPv6 文字列をサポートします（省略表記や `::` を使わない表記を含みます）
- 入力が有効な IPv4 文字列の場合は、IPv4 マップド IPv6 表現に変換して返します
- CIDR、ポート、角括弧などの拡張形式はサポートしません

## 例

IPv6 文字列 `1111::ffff` を 16 バイトのバイナリ値に変換します（十六進数で表示）。
```sql
select hex(ipv6_string_to_num('1111::ffff')) as v6;
+----------------------------------+
| v6                               |
+----------------------------------+
| 1111000000000000000000000000FFFF |
+----------------------------------+
```

IPv4 文字列は自動的に IPv6（`::ffff:<ipv4>`）にマッピングされ、16 バイトのバイナリ値として返されます。
```sql
select hex(ipv6_string_to_num('192.168.0.1')) as mapped;
+----------------------------------+
| mapped                           |
+----------------------------------+
| 00000000000000000000FFFFC0A80001 |
+----------------------------------+
```

入力が NULL の場合は例外が発生します。
```sql
select hex(ipv6_string_to_num(NULL));
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv6 value like '::' first
```

無効な入力の場合は例外が発生します。
```sql
select hex(ipv6_string_to_num('notaaddress'));
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```

### キーワード

IPV6_STRING_TO_NUM
