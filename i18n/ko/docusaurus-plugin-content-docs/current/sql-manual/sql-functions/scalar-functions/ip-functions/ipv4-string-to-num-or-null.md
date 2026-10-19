---
{
    "title": "IPV4_STRING_TO_NUM_OR_NULL",
    "language": "ko",
    "description": "A.B.C.D 형식(점으로 구분된 십진수)의 IPv4 주소가 포함된 문자열을 입력받습니다."
}
---

## 설명 {#description}
A.B.C.D 형식(점으로 구분된 십진수)의 IPv4 주소가 포함된 문자열을 입력받습니다. 해당 IPv4 주소를 big endian으로 표현한 BIGINT 숫자를 반환합니다.

## 별칭 {#alias}
- INET_ATON

## 구문 {#syntax}
```sql
IPV4_STRING_TO_NUM_OR_NULL(<ipv4_string>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명                                      |
|-----------|--------------------------------------------------|
| `<ipv4_string>`      | 'A.B.C.D'와 같은 ipv4 주소를 나타내는 문자열  |

## 반환 값 {#return-value}
해당 IPv4 주소를 big endian으로 표현한 BIGINT 숫자를 반환합니다.
- 입력 문자열이 유효한 IPv4 주소가 아니면 `NULL`을 반환합니다.

## 예제 {#example}
```sql
select ipv4_string_to_num_or_null('192.168.0.1'); 
```
```text
+-------------------------------------------+ 
| ipv4_string_to_num_or_null('192.168.0.1') | 
+-------------------------------------------+ 
| 3232235521                                | 
+-------------------------------------------+ 
```

<!-- setup-sql
CREATE TABLE ipv4_str (str VARCHAR(50)) DISTRIBUTED BY HASH(str) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO ipv4_str VALUES ('0.0.0.0'),('127.0.0.1'),('255.255.255.255'),('invalid');
-->

```sql
select str, ipv4_string_to_num_or_null(str) from ipv4_str; 
```
```text
+-----------------+---------------------------------+ 
|str              | ipv4_string_to_num_or_null(str) | 
+-----------------+---------------------------------+ 
| 0.0.0.0         | 0                               | 
| 127.0.0.1       | 2130706433                      | 
| 255.255.255.255 | 4294967295                      | 
| invalid         | NULL                            | 
+-----------------+---------------------------------+ 
```
