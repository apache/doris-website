---
{
  "title": "IS_IP_ADDRESS_IN_RANGE",
  "description": "指定されたIPアドレスが与えられたCIDRネットワーク範囲内にあるかどうかを確認します。IPv4とIPv6の両方のアドレスをサポートします。",
  "language": "ja"
}
---
## is_ip_address_in_range

## 説明
指定されたIPアドレスが、与えられたCIDRネットワーク範囲内にあるかどうかをチェックします。IPv4とIPv6の両方のアドレスをサポートしています。

## 構文

```sql
IS_IP_ADDRESS_IN_RANGE(<ip_address>, <cidr_range>)
```
### パラメータ
- `<ip_address>`: チェックするIPアドレス（IPv4、IPv6型または文字列）
- `<cidr_range>`: CIDRネットワーク範囲（文字列形式、例："192.168.1.0/24"）

### 戻り値
戻り値の型：TINYINT

戻り値の意味：
- 1を返す：IPアドレスが指定されたCIDR範囲内にあることを示す
- 0を返す：IPアドレスが指定されたCIDR範囲内にないことを示す
- 入力がNULLの場合、NULLを返す

### 使用上の注意
- IPv4とIPv6アドレスの両方のチェックをサポート
- CIDR範囲は有効な形式である必要がある（例："192.168.1.0/24"や"2001:db8::/64"）
- 逆インデックス最適化をサポート、CIDRパラメータが定数の場合はインデックス高速化が可能
- 無効なCIDR形式の場合は0を返す
- 入力パラメータがNULLの場合はNULLを返す

## 例

IPv4アドレスが指定されたネットワークセグメント内にあるかをチェックします。

```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```
指定されたネットワークセグメント内にIPv6アドレスが含まれているかを確認します。

```sql
SELECT is_ip_address_in_range(INET6_ATON('2001:db8::100'), '2001:db8::/64') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```
複数のアドレスが指定されたネットワークセグメント内にあるかどうかを確認します。

```sql
SELECT 
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_192_168_1,
  is_ip_address_in_range(to_ipv4('192.168.2.100'), '192.168.1.0/24') as in_192_168_2,
  is_ip_address_in_range(to_ipv4('10.0.0.1'), '192.168.1.0/24') as in_10_0_0;
+-------------+-------------+----------+
| in_192_168_1| in_192_168_2| in_10_0_0|
+-------------+-------------+----------+
| 1           | 0           | 0        |
+-------------+-------------+----------+
```
異なるCIDRプレフィックス長を持つ範囲をチェックします。

```sql
SELECT 
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.0.0/16') as in_16,
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_24,
  is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.100/32') as in_32;
+--------+--------+--------+
| in_16  | in_24  | in_32  |
+--------+--------+--------+
| 1      | 1      | 1      |
+--------+--------+--------+
```
無効なCIDR形式は0を返します。

```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), 'invalid-cidr') as in_range;
+----------+
| in_range |
+----------+
| 0        |
+----------+
```
入力パラメータがNULLの場合、NULLを返します。

```sql
SELECT is_ip_address_in_range(NULL, '192.168.1.0/24') as null_ip;
+---------+
| null_ip |
+---------+
| NULL    |
+---------+

SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), NULL) as null_cidr;
+-----------+
| null_cidr |
+-----------+
| NULL      |
+-----------+

SELECT is_ip_address_in_range(NULL, NULL) as both_null;
+-----------+
| both_null |
+-----------+
| NULL      |
+-----------+
```
### Keywords

IS_IP_ADDRESS_IN_RANGE
