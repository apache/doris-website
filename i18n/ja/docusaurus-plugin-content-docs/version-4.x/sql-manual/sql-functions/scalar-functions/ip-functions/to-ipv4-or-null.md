---
{
    "title": "TO_IPV4_OR_NULL",
    "language": "ja",
    "description": "IPv4 アドレスの文字列表現を受け取り、IPv4 型の値を返します。無効な入力または NULL 入力の場合は NULL を返します。"
}
---

## 説明
IPv4 アドレスの文字列表現を受け取り、IPv4 型の値を返します。無効な入力または NULL 入力の場合は NULL を返します。

## 構文
```sql
TO_IPV4_OR_NULL(<ipv4_str>)
```

### パラメータ
- `<ipv4_str>`: 文字列型の IPv4 アドレス

### 戻り値
戻り値の型: IPv4

戻り値の意味:
- IPv4 型の値を返します。そのバイナリ表現は `ipv4_string_to_num` の戻り値と同じです
- 入力が NULL または無効な IPv4 アドレスの場合は NULL を返します

### 使用上の注意
- `to_ipv4_or_null` は `IPv4` 型を返すため、`IPv4` 列を持つテーブルでの使用に適しています
- 無効な入力でも例外を発生させず、代わりに NULL を返します

## 例

IPv4 文字列 `255.255.255.255` を `IPv4` 型に変換します。
```sql
SELECT to_ipv4_or_null('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```

NULL 入力の場合は NULL を返します。
```sql
SELECT to_ipv4_or_null(NULL) as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```

無効な IPv4 文字列の場合は NULL を返します。
```sql
SELECT to_ipv4_or_null('256.1.1.1') as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```

### キーワード

TO_IPV4_OR_NULL
