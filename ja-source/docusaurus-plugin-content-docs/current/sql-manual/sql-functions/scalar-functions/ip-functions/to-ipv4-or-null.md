---
{
  "title": "TO_IPV4_OR_NULL",
  "language": "ja",
  "description": "IPv4アドレスの文字列形式を受け取り、IPv4型の値を返します。無効な入力またはNULL入力の場合、NULLを返します。"
}
---
## to_ipv4_or_null

## 説明
IPv4アドレスの文字列形式を受け取り、IPv4型の値を返します。無効な入力またはNULL入力の場合、NULLを返します。

## 構文

```sql
TO_IPV4_OR_NULL(<ipv4_str>)
```
### パラメータ
- `<ipv4_str>`: 文字列型のIPv4アドレス

### 戻り値
戻り値の型: IPv4

戻り値の意味:
- `ipv4_string_to_num`の戻り値と同等のバイナリ形式を持つIPv4型の値を返す
- 入力がNULLまたは無効なIPv4アドレスの場合はNULLを返す

### 使用上の注意
- `to_ipv4_or_null` → `IPv4`型と同等で、`IPv4`カラムを持つテーブルを作成するシナリオに適している
- 無効な入力に対して例外をスローせず、代わりにNULLを返す

## 例

IPv4テキスト`255.255.255.255`を`IPv4`型に変換する。

```sql
SELECT to_ipv4_or_null('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```
入力がNULLの場合、NULLを返します。

```sql
SELECT to_ipv4_or_null(NULL) as v4;
+------+
| v4   |
+------+
| NULL |
+------+
```
無効なIPv4テキストはNULLを返します。

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
