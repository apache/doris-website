---
{
  "title": "TO_IPV4",
  "description": "IPv4アドレスの文字列形式を受け取り、IPv4型の値を返します。",
  "language": "ja"
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
- IPv4型の値を返します。そのバイナリ形式は`ipv4_string_to_num`の戻り値と同等です
- 入力がNULLの場合は例外をスローします
- 無効なIPv4アドレスまたは`NULL`入力の場合は例外をスローします

### 使用上の注意
- `to_ipv4`と同等 → `IPv4`型。`IPv4`カラムでTableを作成するシナリオに適しています

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
入力がNULLの場合は例外をスローします

```sql
SELECT to_ipv4(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]The arguments of function to_ipv4 must be String, not NULL
```
無効なIPv4テキストは例外をスローします。

```sql
SELECT to_ipv4('256.1.1.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value '256.1.1.1'
```
### Keywords

TO_IPV4
