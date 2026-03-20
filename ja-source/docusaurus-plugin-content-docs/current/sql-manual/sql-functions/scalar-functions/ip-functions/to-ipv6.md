---
{
  "title": "TO_IPV6",
  "language": "ja",
  "description": "IPv6アドレスの文字列形式を受け取り、IPv6型の値を返します。"
}
---
## to_ipv6

## 説明
IPv6アドレスの文字列形式を受け取り、IPv6型の値を返します。この値のバイナリ形式は、`ipv6_string_to_num`関数の戻り値のバイナリ形式と等しくなります。

## 構文

```sql
TO_IPV6(<ipv6_str>)
```
### パラメータ
- `<ipv6_str>`: String型のIPv6アドレス

### 戻り値
戻り値の型: IPv6

戻り値の意味:
- IPv6型の値を返す
- 入力がNULLの場合は例外をスロー
- 無効なIPv6アドレスまたは`NULL`入力に対して例外をスロー

### 使用上の注意
- `to_ipv6` → `IPv6`型に相当し、`IPv6`カラムでテーブルを作成するシナリオに適している

## 例

IPv6テキスト`2001:1b70:a1:610::b102:2`を`IPv6`型に変換する。

```sql
SELECT to_ipv6('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```
入力がNULLの場合は例外をスローします

```sql
SELECT to_ipv6(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv6 must be String, not NULL
```
無効なIPv6テキストは例外をスローします。

```sql
SELECT to_ipv6('not-an-ip');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv6 value
```
### キーワード

TO_IPV6
