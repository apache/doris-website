---
{
    "title": "IS_IPV4_COMPAT",
    "language": "ko",
    "description": "IPv6 주소가 IPv4 호환 주소인지 확인합니다."
}
---

## 설명 {#description}
IPv6 주소가 IPv4 호환 주소인지 확인합니다. IPv4 호환 주소는 IPv6 네트워크에서 IPv4 주소를 표현하는 데 사용되는 특수한 IPv6 주소 형식입니다.

## 구문 {#syntax}
```sql
IS_IPV4_COMPAT(<ipv6_address>)
```

### 매개변수 {#parameters}
- `<ipv6_address>`: IPv6 주소의 바이너리 표현(VARCHAR 타입, 16바이트)

### 반환 값 {#return-value}
반환 타입: BOOLEAN

반환 값의 의미: 1은 IPv4 호환 주소임을 나타내고, 0은 IPv4 호환 주소가 아님을 나타냅니다

### 사용 시 참고 사항 {#usage-notes}
- IPv4 호환 주소의 형식은 `::IPv4`이며, 처음 12바이트는 0이고 마지막 4바이트에는 IPv4 주소가 포함됩니다
- 입력은 16바이트 IPv6 바이너리 데이터여야 합니다
- 이 형식은 IPv6 전환기를 위해 RFC 4291에 정의되어 있습니다
- 마지막 4바이트는 0일 수 없으므로 `::0.0.0.0`은 유효한 IPv4 호환 주소가 아닙니다. 0.0.0.0은 IPv4 유니캐스트 주소가 아니며 RFC 4291의 IPv4-Compatible IPv6 Address 정의를 충족하지 않기 때문입니다
- 입력 매개변수가 NULL이면 NULL을 반환합니다

## 예제 {#examples}

IPv4 호환 주소인지 확인합니다.
```sql
SELECT is_ipv4_compat(INET6_ATON('::192.168.1.1')) as is_compat;
+-----------+
| is_compat |
+-----------+
| 1         |
+-----------+
```

IPv4 호환 주소가 아닌 주소를 확인합니다.
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

경계값을 확인합니다.
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

입력 매개변수가 NULL이면 NULL을 반환합니다.
```sql
SELECT is_ipv4_compat(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

### 키워드 {#keywords}

IS_IPV4_COMPAT
