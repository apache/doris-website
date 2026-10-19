---
{
    "title": "IPV6_CIDR_TO_RANGE",
    "language": "ko",
    "description": "IPv6 주소와 CIDR 접두사 길이를 기반으로 네트워크 세그먼트의 최소 및 최대 IPv6 주소를 계산합니다."
}
---

## 설명 {#description}
IPv6 주소와 CIDR 접두사 길이를 기반으로 네트워크 세그먼트의 최소 및 최대 IPv6 주소를 계산하고, 두 IPv6 주소를 포함하는 struct를 반환합니다.

## 구문 {#syntax}
```sql
IPV6_CIDR_TO_RANGE(<ipv6_address>, <cidr_prefix>)
```

### 매개변수 {#parameters}
- `<ipv6_address>`: IPv6 타입 주소 또는 IPv6 문자열
- `<cidr_prefix>`: CIDR 접두사 길이(SMALLINT 타입, 범위 0-128)

### 반환 값 {#return-value}
반환 타입: STRUCT<min: IPv6, max: IPv6>

반환 값의 의미:
- 두 필드를 포함하는 struct를 반환합니다.
  - `min`: 네트워크 세그먼트의 최소 IPv6 주소
  - `max`: 네트워크 세그먼트의 최대 IPv6 주소

### 사용 시 참고 사항 {#usage-notes}
- CIDR 접두사 길이는 0-128 범위 내에 있어야 합니다.
- IPv6 타입과 문자열 타입 입력을 모두 지원합니다.
- 네트워크 마스크를 기반으로 계산하며, 최소 주소에서는 모든 호스트 비트를 영으로, 최대 주소에서는 모든 호스트 비트를 일로 설정합니다.
- 상수 매개변수와 컬럼 매개변수의 다양한 조합을 지원합니다.

## 예제 {#examples}

/64 네트워크 세그먼트의 주소 범위를 계산합니다.
```sql
SELECT ipv6_cidr_to_range(to_ipv6('2001:db8::1'), 64) as `range`;
+---------------------------------------------------------------+
| range                                                         |
+---------------------------------------------------------------+
| {"min": "2001:db8::", "max": "2001:db8::ffff:ffff:ffff:ffff"} |
+---------------------------------------------------------------+
```

/48 네트워크 세그먼트의 주소 범위를 계산합니다.
```sql
SELECT ipv6_cidr_to_range(to_ipv6('2001:db8:1::1'), 48) as `range`;
+---------------------------------------------------------------------+
| range                                                               |
+---------------------------------------------------------------------+
| {"min": "2001:db8:1::", "max": "2001:db8:1:ffff:ffff:ffff:ffff:ffff"} |
+---------------------------------------------------------------------+
```

struct의 특정 필드에 접근합니다.
```sql
SELECT 
  ipv6_cidr_to_range(to_ipv6('2001:db8::1'), 64).min as min_ip,
  ipv6_cidr_to_range(to_ipv6('2001:db8::1'), 64).max as max_ip;
+------------+-------------------------------+
| min_ip     | max_ip                        |
+------------+-------------------------------+
| 2001:db8:: | 2001:db8::ffff:ffff:ffff:ffff |
+------------+-------------------------------+
```

CIDR 접두사 길이가 범위를 벗어나면 예외가 발생합니다.
```sql
SELECT ipv6_cidr_to_range(to_ipv6('2001:db8::1'), 129);
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal cidr value '129'
```

### 키워드 {#keywords}

IPV6_CIDR_TO_RANGE
