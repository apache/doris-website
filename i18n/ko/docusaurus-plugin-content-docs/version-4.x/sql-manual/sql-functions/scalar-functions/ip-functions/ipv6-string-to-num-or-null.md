---
{
    "title": "IPV6_STRING_TO_NUM_OR_NULL | IP 함수",
    "language": "ko",
    "description": "IPV6_NUM_TO_STRING의 역함수로, IP 주소 String을 받아 IPv6 주소를 바이너리 형식으로 반환합니다.",
    "sidebar_label": "IPV6_STRING_TO_NUM_OR_NULL"
}
---

# IPV6_STRING_TO_NUM_OR_NULL {#ipv6_string_to_num_or_null}

## 설명 {#description}
IPV6_NUM_TO_STRING의 역함수로, IP 주소 String을 받아 IPv6 주소를 바이너리 형식으로 반환합니다.

## 별칭 {#alias}
- INET6_ATON

## 구문 {#syntax}
```sql
IPV6_STRING_TO_NUM_OR_NULL(<ipv6_string>)
```

## 매개변수 {#parameters}
| 매개변수 | 설명                                      |
|-----------|--------------------------------------------------|
| `<ipv6_string>`      | String 타입의 IPv6 주소  |


## 반환 값 {#return-value}
IPv6 주소를 바이너리 형식으로 반환합니다.
- 유효하지 않은 IP 주소를 입력하면 `NULL`을 반환합니다.
- 입력 문자열에 유효한 IPv4 주소가 포함되어 있으면 이에 해당하는 IPv6 주소를 반환합니다.

## 예제 {#example}
```sql
select hex(ipv6_string_to_num_or_null('1111::ffff')) as r1, hex(ipv6_string_to_num_or_null('192.168.0.1')) as r2, hex(ipv6_string_to_num_or_null('notaaddress')) as r3;
```
```text
+----------------------------------+----------------------------------+------+
| r1                               | r2                               | r3   |
+----------------------------------+----------------------------------+------+
| 1111000000000000000000000000FFFF | 00000000000000000000FFFFC0A80001 | NULL |
+----------------------------------+----------------------------------+------+
```
