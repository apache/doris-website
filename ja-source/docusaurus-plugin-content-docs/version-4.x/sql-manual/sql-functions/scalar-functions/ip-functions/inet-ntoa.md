---
{
  "title": "IPV4_NUM_TO_STRING | Ip Functions",
  "sidebar_label": "IPV4_NUM_TO_STRING",
  "description": "ipv4numtostringのエイリアスです。",
  "language": "ja"
}
---
# IPV4_NUM_TO_STRING

## inet_ntoa
`ipv4_num_to_string`のエイリアスです。

## デスクリプション
ネットワークバイト順（ビッグエンディアン）でのアドレスの数値を表す整数として、Int8、Int16、Int32、またはInt64型のIPv4アドレスを受け取り、A.B.C.D形式（ドット区切りの10進数）の対応するIPv4文字列表現を返します。

## Syntax

```sql
IPV4_NUM_TO_STRING(<ipv4_num>)
```
### パラメータ
- `<ipv4_num>`: IPv4アドレスから変換された整数値 (Int8/Int16/Int32/Int64をサポート)

### 戻り値
戻り値の型: VARCHAR

戻り値の意味:
- IPv4のテキスト形式 (A.B.C.D) を返します
- 出力パラメータがNULLの場合、NULLを返します
- 負の数または`4294967295`を超える入力に対して`NULL`を返します

### 使用上の注意
- `ipv4_num_to_string`と一貫した動作をします：範囲外の値は受け付けません；負の数および4294967295より大きい値は`NULL`を返します
- MySQLの`INET_NTOA`構文との互換性のために一般的に使用されます

## 例

整数`3232235521`をIPv4テキストに変換します。

```sql
select ipv4_num_to_string(3232235521);
+--------------------------------+
| ipv4_num_to_string(3232235521) |
+--------------------------------+
| 192.168.0.1                    |
+--------------------------------+
```
IPv4数値境界値（最小値と最大値）。

```sql
select ipv4_num_to_string(0) as min_v4, ipv4_num_to_string(4294967295) as max_v4;
+---------+---------------+
| min_v4 | max_v4        |
+---------+---------------+
| 0.0.0.0| 255.255.255.255|
+---------+---------------+
```
パラメータがNULLの場合、NULLを返す

```sql
select ipv4_num_to_string(NULL);
+--------------------------+
| ipv4_num_to_string(NULL) |
+--------------------------+
| NULL                     |
+--------------------------+
```
無効な数値入力に対してはNULLを返します（例外はスローされません）。

```sql
select ipv4_num_to_string(-1);
+--------------------------+
| ipv4_num_to_string(-1)   |
+--------------------------+
| NULL                     |
+--------------------------+
```
```sql
select ipv4_num_to_string(4294967296);
+--------------------------------+
| ipv4_num_to_string(4294967296) |
+--------------------------------+
| NULL                           |
+--------------------------------+
```
### キーワード

INET_NTOA、IPV4_NUM_TO_STRING
