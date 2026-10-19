---
{
    "title": "IPV4_NUM_TO_STRING | IP 함수",
    "language": "ko",
    "description": "Int16, Int32, Int64 숫자를 받아 big endian 방식의 IPv4 주소로 해석합니다.",
    "sidebar_label": "IPV4_NUM_TO_STRING"
}
---

# IPV4_NUM_TO_STRING {#ipv4_num_to_string}

## 설명 {#description}
Int16, Int32, Int64 숫자를 받아 big endian 방식의 IPv4 주소로 해석합니다. 해당 IPv4 주소를 A.B.C.D 형식(십진수 숫자를 점으로 구분)으로 나타낸 문자열을 반환합니다.

## 별칭 {#alias}
- INET_NTOA

## 구문 {#syntax}

```sql
IPV4_NUM_TO_STRING(<ipv4_num>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명                                      |
|-----------|--------------------------------------------------|
| `<ipv4_num>`      | ipv4에서 변환된 Int 타입  |


## 반환값 {#return-value}
해당 IPv4 주소를 A.B.C.D 형식(십진수 숫자를 점으로 구분)으로 나타낸 문자열을 반환합니다. 다음은 예외적인 경우입니다.
- 반환값이 `NULL`이 되는 경우는 입력 매개변수가 음수이거나 `4294967295`(`'255.255.255.255'`의 숫자 값)보다 큰 경우입니다.

## 예제 {#example}
```sql
select ipv4_num_to_string(3232235521);
```
```text
+--------------------------------+
| ipv4_num_to_string(3232235521) |
+--------------------------------+
| 192.168.0.1                    |
+--------------------------------+
```

<!-- setup-sql
CREATE TABLE ipv4_bi (num BIGINT) DISTRIBUTED BY HASH(num) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO ipv4_bi VALUES (-1),(0),(2130706433),(4294967295),(4294967296);
-->

```sql
select num,ipv4_num_to_string(num) from ipv4_bi;
```
```text
+------------+---------------------------+
| num        | ipv4_num_to_string(`num`) |
+------------+---------------------------+
|         -1 | NULL                      |
|          0 | 0.0.0.0                   |
| 2130706433 | 127.0.0.1                 |
| 4294967295 | 255.255.255.255           |
| 4294967296 | NULL                      |
+------------+---------------------------+
```
