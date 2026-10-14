---
{
    "title": "TO_IPV6",
    "language": "ja",
    "description": "IPv6 アドレスの文字列表現を受け取り、IPv6 型の値を返します。"
}
---

## 説明
IPv6 アドレスの文字列表現を受け取り、IPv6 型の値を返します。この値のバイナリ表現は、`ipv6_string_to_num` 関数の戻り値のバイナリ表現と同じです。

## 構文
```sql
TO_IPV6(<ipv6_str>)
```

### パラメータ
- `<ipv6_str>`: 文字列型の IPv6 アドレス

### 戻り値
戻り値の型: IPv6

戻り値の意味:
- IPv6 型の値を返します
- 入力が NULL の場合は例外を発生させます
- 無効な IPv6 アドレスまたは `NULL` 入力の場合は例外を発生させます

### 使用上の注意
- `to_ipv6` は `IPv6` 型を返すため、`IPv6` 列を持つテーブルでの使用に適しています

## 例

IPv6 文字列 `2001:1b70:a1:610::b102:2` を `IPv6` 型に変換します。
```sql
SELECT to_ipv6('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```

NULL 入力の場合は例外を発生させます
```sql
SELECT to_ipv6(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv6 must be String, not NULL
```

無効な IPv6 文字列の場合は例外を発生させます。
```sql
SELECT to_ipv6('not-an-ip');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```

### キーワード

TO_IPV6
