---
{
  "title": "IPV6_NUM_TO_STRING | Ip Functions",
  "sidebar_label": "IPV6_NUM_TO_STRING",
  "description": "ipv6numtostringのエイリアスです。",
  "language": "ja"
}
---
# IPV6_NUM_TO_STRING

## inet6_ntoa

`ipv6_num_to_string`のエイリアスです。

## 説明
IPv6アドレスを標準的なテキスト表現に変換し、このアドレスの文字列をテキスト形式で返します。

## 構文

```sql
IPV6_NUM_TO_STRING(<ipv6_num>)
```
### パラメータ
- `<ipv6_num>`: IPv6型カラムの値、または長さ16のバイナリ文字列

### 戻り値
戻り値の型: VARCHAR

戻り値の意味:
- IPv6のテキスト表現を返す
- 入力パラメータがNULLの場合はNULLを返す
- 無効な入力（空文字列、長さが16でないバイナリ文字列など）に対しては`NULL`を返す

### 使用上の注意
- `ipv6_num_to_string`と一貫した動作をする：長さが16でないバイナリ入力はNULLを返す
- MySQLの`INET6_NTOA`構文との互換性のために一般的に使用される

## 例

16バイトのバイナリ（`unhex`で構築）をIPv6テキストに変換する。

```sql
select ipv6_num_to_string(unhex('2A0206B8000000000000000000000011')) as addr;
+--------------+
| addr         |
+--------------+
| 2a02:6b8::11 |
+--------------+
```
パラメータがNULLの場合、NULLを返します

```sql
select ipv6_num_to_string(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```
無効なバイナリ入力（16バイトではない）はNULLを返します。

```sql
select ipv6_num_to_string('-23vno12i34nlfwlsj') as invalid;
+----------+
| invalid  |
+----------+
| NULL     |
+----------+
```
### キーワード

INET6_NTOA, IPV6_NUM_TO_STRING
