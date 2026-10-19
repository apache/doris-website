---
{
    "title": "IS_IP_ADDRESS_IN_RANGE",
    "language": "ko",
    "description": "지정한 IP 주소가 주어진 CIDR 네트워크 범위에 속하는지 확인합니다. IPv4와 IPv6 주소를 모두 지원합니다."
}
---

## 설명 {#description}
지정한 IP 주소가 주어진 CIDR 네트워크 범위에 속하는지 확인합니다. IPv4와 IPv6 주소를 모두 지원합니다.

## 구문 {#syntax}
```sql
IS_IP_ADDRESS_IN_RANGE(<ip_address>, <cidr_range>)
```

### 매개변수 {#parameters}
- `<ip_address>`: 확인할 IP 주소(IPv4, IPv6 타입 또는 문자열)
- `<cidr_range>`: CIDR 네트워크 범위(문자열 형식, 예: "192.168.1.0/24")

### 반환값 {#return-value}
반환 타입: BOOLEAN

반환값의 의미:
- 1 반환: IP 주소가 지정한 CIDR 범위에 속함을 나타냅니다
- 0 반환: IP 주소가 지정한 CIDR 범위에 속하지 않음을 나타냅니다
- 입력이 NULL이면 NULL을 반환합니다

### 사용 시 참고 사항 {#usage-notes}
- IPv4와 IPv6 주소를 모두 확인할 수 있습니다
- CIDR 범위는 유효한 형식이어야 합니다(예: "192.168.1.0/24" 또는 "2001:db8::/64")
- inverted index 최적화를 지원하며, CIDR 매개변수가 상수이면 인덱스를 사용해 처리 속도를 높일 수 있습니다
- CIDR 형식이 유효하지 않으면 0을 반환합니다
- 입력 매개변수가 NULL이면 NULL을 반환합니다

## 예제 {#examples}

IPv4 주소가 지정한 네트워크 구간에 속하는지 확인합니다.
```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), '192.168.1.0/24') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```

IPv6 주소가 지정한 네트워크 구간에 속하는지 확인합니다.
```sql
SELECT is_ip_address_in_range(INET6_ATON('2001:db8::100'), '2001:db8::/64') as in_range;
+----------+
| in_range |
+----------+
| 1        |
+----------+
```

여러 주소가 지정한 네트워크 구간에 속하는지 확인합니다.
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

CIDR 접두사 길이가 서로 다른 범위를 확인합니다.
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

CIDR 형식이 유효하지 않으면 0을 반환합니다.
```sql
SELECT is_ip_address_in_range(to_ipv4('192.168.1.100'), 'invalid-cidr') as in_range;
+----------+
| in_range |
+----------+
| 0        |
+----------+
```

입력 매개변수가 NULL이면 NULL을 반환합니다.
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

### 키워드 {#keywords}

IS_IP_ADDRESS_IN_RANGE
