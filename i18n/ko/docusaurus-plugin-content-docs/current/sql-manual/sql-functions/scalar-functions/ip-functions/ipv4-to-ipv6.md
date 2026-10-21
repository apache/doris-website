---
{
    "title": "IPV4_TO_IPV6",
    "language": "ko",
    "description": "IPv4 주소를 IPv6 주소로 변환합니다. 변환된 IPv6 주소는 ::ffff:IPv4 형식의 IPv4-mapped 주소입니다."
}
---

## 설명 {#description}
IPv4 주소를 IPv6 주소로 변환합니다. 변환된 IPv6 주소는 `::ffff:IPv4` 형식의 IPv4-mapped 주소입니다.

## 구문 {#syntax}
```sql
IPV4_TO_IPV6(<ipv4_address>)
```

### 매개변수 {#parameters}
- `<ipv4_address>`: IPv4 타입의 주소

### 반환 값 {#return-value}
반환 타입: IPv6

반환 값의 의미:
- 해당 IPv6 주소를 `::ffff:IPv4` 형식으로 반환합니다.
- 표준 IPv4-mapped IPv6 주소 형식입니다.

### 사용 시 참고 사항 {#usage-notes}
- 표준 IPv4-mapped 형식을 사용하여 IPv4 주소를 IPv6 주소에 삽입합니다.
- 변환된 주소는 IPv6 네트워크에서 IPv4 호환성을 위해 사용할 수 있습니다.
- 유효한 모든 IPv4 주소를 지원합니다.
- 입력 매개변수가 NULL이면 NULL을 반환합니다.

## 예제 {#examples}

IPv4 주소를 IPv6 주소로 변환합니다.
```sql
SELECT ipv4_to_ipv6(to_ipv4('192.168.1.1')) as ipv6_address;
+--------------------+
| ipv6_address       |
+--------------------+
| ::ffff:192.168.1.1 |
+--------------------+
```

여러 IPv4 주소를 변환합니다.
```sql
SELECT 
  ipv4_to_ipv6(to_ipv4('10.0.0.1')) as private_ip,
  ipv4_to_ipv6(to_ipv4('8.8.8.8')) as public_ip;
+-----------------+----------------+
| private_ip      | public_ip      |
+-----------------+----------------+
| ::ffff:10.0.0.1 | ::ffff:8.8.8.8 |
+-----------------+----------------+
```

경계값에 해당하는 IPv4 주소를 변환합니다.
```sql
SELECT 
  ipv4_to_ipv6(to_ipv4('0.0.0.0')) as min_ip,
  ipv4_to_ipv6(to_ipv4('255.255.255.255')) as max_ip;
+----------------+------------------------+
| min_ip         | max_ip                 |
+----------------+------------------------+
| ::ffff:0.0.0.0 | ::ffff:255.255.255.255 |
+----------------+------------------------+
```

입력 매개변수가 NULL이면 NULL을 반환합니다.
```sql
SELECT ipv4_to_ipv6(NULL) as null_result;
+-------------+
| null_result |
+-------------+
| NULL        |
+-------------+
```

### 키워드 {#keywords}

IPV4_TO_IPV6
