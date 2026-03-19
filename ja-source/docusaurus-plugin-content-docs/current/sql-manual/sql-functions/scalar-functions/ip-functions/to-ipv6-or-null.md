---
{
  "title": "TO_IPV6_OR_NULL",
  "language": "ja",
  "description": "IPv6アドレスの文字列形式を受け取り、IPv6型の値を返します。無効な入力またはNULL入力の場合、NULLを返します。"
}
---
## to_ipv6_or_null

## 説明
IPv6アドレスの文字列形式を受け取り、IPv6型の値を返します。無効な入力またはNULL入力の場合、NULLを返します。

## 構文

```sql
TO_IPV6_OR_NULL(<ipv6_str>)
```
### パラメータ
- `<ipv6_str>`: 文字列型のIPv6アドレス

### 戻り値
戻り値の型: IPv6 (Nullable)

戻り値の意味:
- IPv6型の値を返す。そのバイナリ形式は`ipv6_string_to_num`関数の戻り値のバイナリ形式と等しい
- 入力がNULLまたは無効なIPv6アドレスの場合はNULLを返す

### 使用上の注意
- `to_ipv6_or_null` → `IPv6`型と同等で、`IPv6`カラムでテーブルを作成するシナリオに適している
- 無効な入力に対して例外をスローせず、代わりにNULLを返す

## 例

IPv6テキスト`2001:1b70:a1:610::b102:2`を`IPv6`型に変換する。

```sql
SELECT to_ipv6_or_null('2001:1b70:a1:610::b102:2') as v6;
+-------------------------------+
| v6                            |
+-------------------------------+
| 2001:1b70:a1:610::b102:2      |
+-------------------------------+
```
入力がNULLの場合、NULLを返します。

```sql
SELECT to_ipv6_or_null(NULL) as v6;
+------+
| v6   |
+------+
| NULL |
+------+
```
無効なIPv6テキストはNULLを返します。

```sql
SELECT to_ipv6_or_null('not-an-ip') as v6;
+------+
| v6   |
+------+
| NULL |
+------+
```
### キーワード

TO_IPV6_OR_NULL
