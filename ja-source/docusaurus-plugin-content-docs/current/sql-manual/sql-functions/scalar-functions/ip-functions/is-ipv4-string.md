---
{
  "title": "IS_IPV4_STRING",
  "language": "ja",
  "description": "入力文字列が有効なIPv4アドレス形式かどうかをチェックします。有効なIPv4アドレスの場合は1を返し、そうでない場合は0を返します。"
}
---
## is_ipv4_string

## 説明
入力文字列が有効なIPv4アドレス形式かどうかをチェックします。有効なIPv4アドレスの場合は1を返し、そうでない場合は0を返します。

## エイリアス
- IS_IPV4

## 構文

```sql
IS_IPV4_STRING(<ipv4_str>)
```
### パラメータ
- `<ipv4_str>`: チェックする文字列

### 戻り値
戻り値の型: TINYINT

戻り値の意味:
- 1を返す: 入力が有効なIPv4アドレス形式であることを示す
- 0を返す: 入力が有効なIPv4アドレス形式でないことを示す
- 入力がNULLの場合はNULLを返す

### 使用上の注意
- 文字列形式がIPv4アドレス仕様（A.B.C.D形式）に準拠しているかのみをチェックする
- 実際のIPアドレス変換は行わず、形式の検証のみを行う
- NULL入力をサポートし、NULLを返す

## 例

有効なIPv4アドレス形式をチェックする。

```sql
SELECT is_ipv4_string('192.168.1.1') as is_valid;
+----------+
| is_valid |
+----------+
| 1        |
+----------+
```
境界値のIPv4アドレスをチェックします。

```sql
SELECT 
  is_ipv4_string('0.0.0.0') as min_ip,
  is_ipv4_string('255.255.255.255') as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```
無効なIPv4アドレス形式をチェックします。

```sql
SELECT 
  is_ipv4_string('256.1.1.1') as invalid_range,
  is_ipv4_string('192.168.1') as missing_octet,
  is_ipv4_string('192.168.1.1.1') as extra_octet,
  is_ipv4_string('not-an-ip') as not_ip;
+---------------+----------------+--------------+--------+
| invalid_range | missing_octet | extra_octet | not_ip |
+---------------+----------------+--------------+--------+
| 0             | 0              | 0            | 0      |
+---------------+----------------+--------------+--------+
```
NULL入力をチェックします。

```sql
SELECT is_ipv4_string(NULL) as null_check;
+------------+
| null_check |
+------------+
| NULL       |
+------------+
```
### キーワード

IS_IPV4_STRING
