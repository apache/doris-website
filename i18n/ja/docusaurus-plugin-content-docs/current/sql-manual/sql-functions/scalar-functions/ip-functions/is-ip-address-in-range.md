---
{
    "title": "IS_IP_ADDRESS_IN_RANGE",
    "language": "ja",
    "description": "指定した IP アドレスが CIDR ネットワーク範囲内にあるかを判定します。IPv4 と IPv6 の両方に対応します。"
}
---

## 説明
指定した IP アドレスが CIDR ネットワーク範囲内にあるかを判定します。IPv4 と IPv6 の両方に対応します。

## 構文
```sql
IS_IP_ADDRESS_IN_RANGE(<ip_address>, <cidr_range>)
```

### パラメータ
- `<ip_address>`: 判定する IP アドレス（IPv4 型、IPv6 型、または文字列）
- `<cidr_range>`: CIDR ネットワーク範囲（"192.168.1.0/24" などの文字列形式）

### 戻り値
戻り値の型: BOOLEAN

戻り値の意味:
- 1 を返す場合、IP アドレスは指定した CIDR 範囲内にあります
- 0 を返す場合、IP アドレスは指定した CIDR 範囲外にあります
- 入力が NULL の場合、NULL を返します

### 使用上の注意
- IPv4 と IPv6 の両方のアドレスを判定できます
- CIDR 範囲には、"192.168.1.0/24" や "2001:db8::/64" などの有効な形式を指定してください
- 転置インデックスによる最適化に対応し、CIDR パラメータが定数の場合はインデックスを使って処理を高速化できます
- CIDR の形式が無効な場合は 0 を返します
- 入力パラメータが NULL の場合は NULL を返します

## 例

IPv4 アドレスが指定したネットワーク範囲内にあるかを判定します。
```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```

IPv6 アドレスが指定したネットワーク範囲内にあるかを判定します。
```sql
SELECT is_ip_address_in_range(INET6_ATON('2001:db8::100'), '2001:db8::/64') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```

複数のアドレスが指定したネットワーク範囲内にあるかを判定します。
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

プレフィックス長が異なる CIDR 範囲を判定します。
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

CIDR の形式が無効な場合は 0 を返します。
```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), 'invalid-cidr') as in_range;
+----------+
| in_range |
+----------+
| 0        |
+----------+
```

入力パラメータが NULL の場合は NULL を返します。
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

### キーワード

IS_IP_ADDRESS_IN_RANGE
