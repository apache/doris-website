---
{
    "title": "IPV4_STRING_TO_NUM",
    "language": "ja",
    "description": "A.B.C.D 形式の IPv4 アドレス文字列を、ネットワークバイト順の数値に変換します。"
}
---

## 説明
A.B.C.D 形式（ドットで区切られた 十進数）の IPv4 アドレス文字列を受け取り、対応する IPv4 アドレスをネットワークバイト順（ビッグエンディアン）の数値で返します。

## 構文
```sql
IPV4_STRING_TO_NUM(<ipv4_string>)
```

### パラメータ
- `<ipv4_string>`: A.B.C.D 形式の IPv4 アドレス文字列

### 戻り値
戻り値の型: BIGINT

戻り値の意味:
- 対応する IPv4 アドレスの数値を、ネットワークバイト順（ビッグエンディアン）の整数で返します
- 無効な IPv4 文字列または `NULL` を入力すると例外が発生します

### 使用上の注意
- 標準的な IPv4 文字列のみをサポートします。CIDR（`/24` など）、ポート（`:80` など）、その他の拡張形式は使用できません
- 空白の自動除去や暗黙の型変換は行いません。前後に空白がある文字列は無効です
- 相互変換には `inet_ntoa` や `to_ipv4` と組み合わせて使用します

## 例

IPv4 文字列 `192.168.0.1` を、ネットワークバイト順（ビッグエンディアン）の整数に変換します。
```sql
select ipv4_string_to_num('192.168.0.1');
+-----------------------------------+
| ipv4_string_to_num('192.168.0.1') |
+-----------------------------------+
| 3232235521                        |
+-----------------------------------+
```

IPv4 アドレスの境界値（最小値と最大値）を確認します。
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

無効な入力（オクテットの範囲外の値、空白を含む文字列、NULL）では例外が発生します。
```sql
select ipv4_string_to_num('256.0.0.1');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(' 1.1.1.1 ');
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Invalid IPv4 value

select ipv4_string_to_num(NULL);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Null Input, you may consider convert it to a valid default IPv4 value like '0.0.0.0' first
```

`inet_ntoa`／`ipv4_num_to_string` と `to_ipv4` を使用し、IPv4 文字列 → 整数 → IPv4 文字列 → IPv4 型の順に変換します。
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
