---
{
  "title": "IS_IPV4_MAPPED",
  "description": "IPv6アドレスがIPv4マップアドレスかどうかを確認します。",
  "language": "ja"
}
---
## is_ipv4_mapped

## 説明
IPv6アドレスがIPv4マップアドレスかどうかをチェックします。IPv4マップアドレスは、IPv6ネットワークでIPv4アドレスを表現するために使用される特別なIPv6アドレス形式です。

## 構文

```sql
IS_IPV4_MAPPED(<ipv6_address>)
```
### パラメータ
- `<ipv6_address>`: IPv6アドレスのバイナリ表現（VARCHARタイプ、16バイト）

### 戻り値
戻り値の型: TINYINT

戻り値の意味: 1はIPv4マップアドレスであることを示し、0はIPv4マップアドレスではないことを示す

### 使用上の注意
- IPv4マップアドレスの形式は`::ffff:IPv4`で、最初の10バイトが0、バイト11-12が0xFFFF、最後の4バイトにIPv4アドレスが含まれる
- 入力は16バイトのIPv6バイナリデータである必要がある
- この形式はRFC 4291で定義されており、IPv6でIPv4アドレスを表現する最も一般的な方法である
- 入力パラメータがNULLの場合、NULLを返す

## 例

IPv4マップアドレスをチェックする。

```sql
SELECT is_ipv4_mapped(INET6_ATON('::ffff:192.168.1.1')) as is_mapped;
+-----------+
| is_mapped |
+-----------+
| 1         |
+-----------+
```
IPv4以外のマップされていないアドレスをチェックします。

```sql
SELECT 
  is_ipv4_mapped(INET6_ATON('2001:db8::1')) as standard_ipv6,
  is_ipv4_mapped(INET6_ATON('::192.168.1.1')) as ipv4_compat;
+--------------+------------+
| standard_ipv6| ipv4_compat|
+--------------+------------+
| 0            | 0          |
+--------------+------------+
```
境界値を確認してください。

```sql
SELECT 
  is_ipv4_mapped(INET6_ATON('::ffff:0.0.0.0')) as min_ip,
  is_ipv4_mapped(INET6_ATON('::ffff:255.255.255.255')) as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 1      | 1      |
+--------+--------+
```
入力パラメータがNULLの場合、NULLが返されます。

```sql
SELECT is_ipv4_mapped(NULL) as null_result;
+-------------+
| null_result |
+-------------+
|        NULL |
+-------------+
```
### Keywords

IS_IPV4_MAPPED
