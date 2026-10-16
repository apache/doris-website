---
{
    "title": "CUT_IPV6",
    "language": "ja",
    "description": "IPv4 マップドアドレスか通常の IPv6 アドレスかに応じて末尾の指定バイト数を切り落とし、IPv6 アドレス文字列を返します。"
}
---

## 説明
IPv4 マップドアドレスか通常の IPv6 アドレスかに応じて、IPv6 アドレス末尾の指定バイト数を切り落とし、短縮した IPv6 アドレス文字列を返します。

## 構文
```sql
CUT_IPV6(<ipv6_address>, <bytes_to_cut_for_ipv6>, <bytes_to_cut_for_ipv4>)
```

### パラメータ
- `<ipv6_address>`: IPv6 型のアドレスです。
- `<bytes_to_cut_for_ipv6>`: 通常の IPv6 アドレスから切り落とすバイト数です (TINYINT 型)。
- `<bytes_to_cut_for_ipv4>`: IPv4 マップドアドレスから切り落とすバイト数です (TINYINT 型)。

### 戻り値
戻り値の型: VARCHAR

戻り値の意味:
- 短縮した IPv6 アドレス文字列を返します。
- 入力が IPv4 マップドアドレスの場合は、`bytes_to_cut_for_ipv4` パラメータを使用します。
- 入力が通常の IPv6 アドレスの場合は、`bytes_to_cut_for_ipv6` パラメータを使用します。
- `<ipv6_address>`、`<bytes_to_cut_for_ipv6>`、`<bytes_to_cut_for_ipv4>` のいずれかが NULL の場合は NULL を返します。

### 使用上の注意
- IPv6 アドレスが IPv4 マップドアドレス (形式: `::ffff:IPv4`) かどうかを自動で判定します。
- アドレスの種類に応じて、切り落とすバイト数を選びます。
- アドレス末尾から指定したバイト数をゼロに置き換えます。
- パラメータの値は 16 (IPv6 アドレスの総バイト数) を超えられません。

## 例

通常の IPv6 アドレスの末尾のバイトを切り落とす。
```sql
SELECT cut_ipv6(to_ipv6('2001:db8::1'), 4, 4) as cut_result;
+------------------+
| cut_result       |
+------------------+
| 2001:db8::       |
+------------------+
```

IPv4 マップドアドレスの末尾のバイトを切り落とす。
```sql
SELECT cut_ipv6(to_ipv6('::ffff:192.168.1.1'), 4, 4) as cut_result;
+----------------+
| cut_result     |
+----------------+
| ::ffff:0.0.0.0 |
+----------------+
```

異なる切り落としバイト数を指定する。
```sql
SELECT 
  cut_ipv6(to_ipv6('2001:db8::1'), 8, 4) as ipv6_cut_8,
  cut_ipv6(to_ipv6('::ffff:192.168.1.1'), 4, 8) as ipv4_cut_8;
+------------+------------+
| ipv6_cut_8 | ipv4_cut_8 |
+------------+------------+
| 2001:db8:: | ::         |
+------------+------------+
```

NULL パラメータは NULL を返す。
```sql 
select cut_ipv6(NULL, NULL, NULL);
+----------------------------+
| cut_ipv6(NULL, NULL, NULL) |
+----------------------------+
| NULL                       |
+----------------------------+

select cut_ipv6(to_ipv6("::"), NULL, 0);
+----------------------------------+
| cut_ipv6(to_ipv6("::"), NULL, 0) |
+----------------------------------+
| NULL                             |
+----------------------------------+

select cut_ipv6(to_ipv6("::"), 4, NULL);
+----------------------------------+
| cut_ipv6(to_ipv6("::"), 4, NULL) |
+----------------------------------+
| NULL                             |
+----------------------------------+
```

範囲外のパラメータ値は例外を発生させる。
```sql
SELECT cut_ipv6(to_ipv6('2001:db8::1'), 17, 4);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal value for argument 2 TINYINT of function cut_ipv6

SELECT cut_ipv6(to_ipv6('2001:db8::1'), 4, 122);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal value for argument 3 TINYINT of function cut_ipv6
```

### キーワード

CUT_IPV6
