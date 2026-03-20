---
{
  "title": "IPV4_STRING_TO_NUM",
  "language": "ja",
  "description": "A.B.C.D形式（ドット区切りの10進数）のIPv4アドレスを含む文字列を受け取ります。"
}
---
## ipv4_string_to_num

## 詳細
A.B.C.D形式（ドット区切りの10進数）のIPv4アドレスを含む文字列を受け取ります。ネットワークバイト順（ビッグエンディアン）でのアドレスの数値を、IPv4アドレスに対応する整数として返します。

## Syntax

```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```
### パラメータ
- `<ipv4_string>`: IPv4文字列アドレス（形式 A.B.C.D）

### 戻り値
戻り値の型: BIGINT

戻り値の意味:
- 対応するIPv4アドレスのネットワークバイト順（ビッグエンディアン）整数表現でのアドレスの数値を返します
- 無効なIPv4文字列や `NULL` 入力に対しては例外をスローします

### 使用上の注意
- 標準的なIPv4テキストのみをサポートし、CIDR（`/24`など）、ポート（`:80`など）、その他の拡張形式はサポートしません
- 暗黙的なトリミングや型変換は実行せず、先頭/末尾に空白文字がある文字列は無効とみなされます
- 相互変換のために `inet_ntoa`、`to_ipv4` とよく併用されます

## 例

IPv4テキスト `192.168.0.1` を対応するネットワークバイト順（ビッグエンディアン）整数でのアドレスの数値に変換します。

```sql
select ipv4_string_to_num('192.168.0.1');
+-----------------------------------+
| ipv4_string_to_num('192.168.0.1') |
+-----------------------------------+
| 3232235521                        |
+-----------------------------------+
```
IPv4境界値（最小値と最大値）。

```sql
select
  ipv4_string_to_num('0.0.0.0')             as min_v4,
  ipv4_string_to_num('255.255.255.255')     as max_v4;
+--------+-----------+
| min_v4| max_v4    |
+--------+-----------+
| 0      | 4294967295|
+--------+-----------+
```
無効な入力は例外をトリガーします（セグメント値が範囲外/空白文字を含む/NULL）。

```sql
select ipv4_string_to_num('256.0.0.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(' 1.1.1.1 ');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv4 value like '0.0.0.0' first
```
`inet_ntoa`/`ipv4_num_to_string`と`to_ipv4`を使用した相互変換の例：IPv4テキスト → 整数 → IPv4テキスト → IPv4型。

```sql
-- Step 1: IPv4 text to integer
SELECT ipv4_string_to_num('192.168.1.1') as ipv4_int;
+------------+
| ipv4_int   |
+------------+
| 3232235777 |
+------------+

-- Step 2: Integer back to IPv4 text
SELECT ipv4_num_to_string(ipv4_string_to_num('192.168.1.1')) as back_to_text;
+----------------+
| back_to_text   |
+----------------+
| 192.168.1.1    |
+----------------+

-- Step 3: IPv4 text to IPv4 type
SELECT to_ipv4(ipv4_num_to_string(ipv4_string_to_num('192.168.1.1'))) as ipv4_type;
+-------------+
| ipv4_type   |
+-------------+
| 192.168.1.1 |
+-------------+
```
### キーワード

IPV4_STRING_TO_NUM
