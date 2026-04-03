---
{
  "title": "IS_IPV4_COMPAT",
  "description": "IPv6アドレスがIPv4互換アドレスかどうかを確認します。",
  "language": "ja"
}
---
## is_ipv4_compat

## 説明
IPv6アドレスがIPv4互換アドレスかどうかをチェックします。IPv4互換アドレスは、IPv6ネットワークでIPv4アドレスを表現するために使用される特別なIPv6アドレス形式です。

## 構文

```sql
IS_IPV4_COMPAT(<ipv6_address>)
```
### パラメータ
- `<ipv6_address>`: IPv6アドレスのバイナリ表現（VARCHAR型、16バイト）

### 戻り値
戻り値の型: TINYINT

戻り値の意味: 1はIPv4互換アドレスであることを示し、0はIPv4互換アドレスでないことを示します

### 使用上の注意
- IPv4互換アドレス形式は`::IPv4`で、最初の12バイトは0で、最後の4バイトにIPv4アドレスが含まれます
- 入力は16バイトのIPv6バイナリデータである必要があります
- この形式はIPv6移行期間のためにRFC 4291で定義されています
- 最後の4バイトは0にできないため、`::0.0.0.0`は有効なIPv4互換アドレスではありません。0.0.0.0はIPv4ユニキャストアドレスではなく、RFC 4291 IPv4-Mapped IPv6 Addressの定義を満たさないためです
- 入力パラメータがNULLの場合、NULLを返します

## 例

IPv4互換アドレスをチェックします。

```sql
SELECT is_ipv4_compat(INET6_ATON('::192.168.1.1')) as is_compat;
+-----------+
| is_compat |
+-----------+
| 1         |
+-----------+
```
非IPv4互換アドレスを確認します。

```sql
SELECT 
  is_ipv4_compat(INET6_ATON('2001:db8::1')) as standard_ipv6,
  is_ipv4_compat(INET6_ATON('::ffff:192.168.1.1')) as ipv4_mapped,
  is_ipv4_compat(INET6_ATON('::0.0.0.0')) as zero_ip;
+--------------+------------+---------+
| standard_ipv6| ipv4_mapped| zero_ip |
+--------------+------------+---------+
| 0            | 0          | 0       |
+--------------+------------+---------+
```
境界値を確認してください。

```sql
SELECT 
  is_ipv4_compat(INET6_ATON('::0.0.0.0')) as min_ip,
  is_ipv4_compat(INET6_ATON('::255.255.255.255')) as max_ip;
+--------+--------+
| min_ip | max_ip |
+--------+--------+
| 0      | 1      |
+--------+--------+
```
入力パラメータがNULLの場合、NULLを返します。

```sql
SELECT is_ipv4_compat(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```
### Keywords

IS_IPV4_COMPAT
