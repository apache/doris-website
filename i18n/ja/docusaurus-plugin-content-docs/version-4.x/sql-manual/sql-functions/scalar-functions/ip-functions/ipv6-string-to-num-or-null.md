---
{
    "title": "IPV6_STRING_TO_NUM_OR_NULL | IP 関数",
    "language": "ja",
    "description": "IPV6_NUM_TO_STRING の逆関数です。IP アドレス文字列を受け取り、IPv6 アドレスをバイナリ形式で返します。",
    "sidebar_label": "IPV6_STRING_TO_NUM_OR_NULL"
}
---

# IPV6_STRING_TO_NUM_OR_NULL

## 説明
IPV6_NUM_TO_STRING の逆関数です。IP アドレス文字列を受け取り、IPv6 アドレスをバイナリ形式で返します。

## 別名
- INET6_ATON

## 構文
```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```

## パラメータ
| パラメータ | 説明 |
| --- | --- |
| `<ipv6_string>` | 文字列型の IPv6 アドレス |


## 戻り値
IPv6 アドレスをバイナリ形式で返します。
- 無効な IP アドレスを入力すると、`NULL` を返します。
- 入力文字列が有効な IPv4 アドレスの場合、対応する IPv6 アドレスを返します。

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

