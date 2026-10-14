---
{
    "title": "TO_IPV4",
    "language": "ja",
    "description": "IPv4 アドレスの文字列表現を受け取り、IPv4 型の値を返します。"
}
---

## 説明
IPv4 アドレスの文字列表現を受け取り、IPv4 型の値を返します。

## 構文
```sql
TO_IPV4(<ipv4_str>)
```

### パラメータ
- `<ipv4_str>`: 文字列型の IPv4 アドレス

### 戻り値
戻り値の型: IPv4

戻り値の意味:
- IPv4 型の値を返します。そのバイナリ表現は `ipv4_string_to_num` の戻り値と同じです
- 入力が NULL の場合は例外を発生させます
- 無効な IPv4 アドレスまたは `NULL` 入力の場合は例外を発生させます

### 使用上の注意
- `to_ipv4` は `IPv4` 型を返すため、`IPv4` 列を持つテーブルでの使用に適しています

## 例

IPv4 文字列 `255.255.255.255` を `IPv4` 型に変換します。
```sql
SELECT to_ipv4('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

NULL 入力の場合は例外を発生させます
```sql
SELECT to_ipv4(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv4 must be String, not NULL
```

無効な IPv4 文字列の場合は例外を発生させます。
```sql
SELECT to_ipv4('256.1.1.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value '256.1.1.1'
```

### キーワード

TO_IPV4
