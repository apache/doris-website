---
{
  "title": "TO_IPV4",
  "language": "ja",
  "description": "IPv4アドレスの文字列形式を受け取り、IPv4型の値を返します。"
}
---
## to_ipv4

## 説明
IPv4アドレスの文字列形式を受け取り、IPv4型の値を返します。

## 構文

```sql
TO_IPV4(<ipv4_str>)
```
### パラメータ
- `<ipv4_str>`: 文字列型のIPv4アドレス

### 戻り値
戻り値の型: IPv4

戻り値の意味:
- IPv4型の値を返します。そのバイナリ形式は`ipv4_string_to_num`の戻り値と等価です
- 入力がNULLの場合、例外をスローします
- 無効なIPv4アドレスまたは`NULL`入力に対して例外をスローします

### 使用上の注意
- `to_ipv4` → `IPv4`型と等価で、`IPv4`カラムでテーブルを作成するシナリオに適しています

## 例

IPv4テキスト`255.255.255.255`を`IPv4`型に変換します。

```sql
SELECT to_ipv4('255.255.255.255') as v4;
+-----------------+
| v4              |
+-----------------+
| 255.255.255.255 |
+-----------------+
```
入力がNULLの場合、例外がスローされます

```sql
SELECT to_ipv4(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv4 must be String, not NULL
```
無効なIPv4テキストは例外をスローします。

```sql
SELECT to_ipv4('256.1.1.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value '256.1.1.1'
```
### キーワード

TO_IPV4
