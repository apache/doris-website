---
{
    "title": "IPV4_CIDR_TO_RANGE",
    "language": "ko",
    "description": "IPv4 주소와 CIDR 접두사 길이를 기반으로 네트워크 세그먼트의 최소 및 최대 IPv4 주소를 계산합니다."
}
---

## 설명 {#description}
IPv4 주소와 CIDR 접두사 길이를 기반으로 네트워크 세그먼트의 최소 및 최대 IPv4 주소를 계산하고, 두 IPv4 주소를 포함하는 struct를 반환합니다.

## 구문 {#syntax}
```sql
IPV4_CIDR_TO_RANGE(<ipv4_address>, <cidr_prefix>)
```

### 매개변수 {#parameters}
| 매개변수 | 설명 |
|-----------|-------------|
| `<ipv4_address>` | IPv4 주소입니다. `TO_IPV4`를 사용하여 주소 문자열을 IPv4로 변환합니다. `INET_ATON`은 BIGINT를 반환하므로 이 매개변수에 사용할 수 없습니다. |
| `<cidr_prefix>` | CIDR 접두사 길이입니다. SMALLINT 타입이며 범위는 0-32입니다. |

### 반환값 {#return-value}
반환 타입: STRUCT<min: IPv4, max: IPv4>

매개변수 중 하나라도 NULL이면 NULL을 반환합니다.

반환값의 의미:
- 두 필드를 포함하는 struct를 반환합니다.
  - `min`: 네트워크 세그먼트의 최소 IPv4 주소
  - `max`: 네트워크 세그먼트의 최대 IPv4 주소

### 사용 시 참고 사항 {#usage-notes}
- CIDR 접두사 길이는 0-32 범위 내에 있어야 합니다.
- 네트워크 마스크를 기준으로 계산하며, 최소 주소는 모든 호스트 비트를 영으로, 최대 주소는 모든 호스트 비트를 일로 설정합니다.
- 상수 매개변수와 컬럼 매개변수의 다양한 조합을 지원합니다.

## 예제 {#examples}

/24 네트워크 세그먼트의 주소 범위를 계산합니다.
```sql
SELECT ipv4_cidr_to_range(TO_IPV4('192.168.1.1'), 24) as range;
```
```text
+------------------------------------------------+
| range                                          |
+------------------------------------------------+
| {"min": "192.168.1.0", "max": "192.168.1.255"} |
+------------------------------------------------+
```

/16 네트워크 세그먼트의 주소 범위를 계산합니다.
```sql
SELECT ipv4_cidr_to_range(TO_IPV4('10.0.0.1'), 16) as range;
```
```text
+----------------------------------------------+
| range                                        |
+----------------------------------------------+
| {"min": "10.0.0.0", "max": "10.0.255.255"} |
+----------------------------------------------+
```

struct의 특정 필드에 접근합니다.
```sql
SELECT 
  ipv4_cidr_to_range(TO_IPV4('172.16.1.1'), 24).min as min_ip,
  ipv4_cidr_to_range(TO_IPV4('172.16.1.1'), 24).max as max_ip;
```
```text
+------------+--------------+
| min_ip     | max_ip       |
+------------+--------------+
| 172.16.1.0 | 172.16.1.255 |
+------------+--------------+
```

CIDR 접두사가 범위를 벗어나면 예외가 발생합니다.
```sql
SELECT ipv4_cidr_to_range(TO_IPV4('192.168.1.1'), 33);
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = (...)[INVALID_ARGUMENT]Illegal cidr value '33'
```

NULL 입력:

```sql
SELECT ipv4_cidr_to_range(NULL, 24) AS null_address,
       ipv4_cidr_to_range(TO_IPV4('192.168.1.1'), NULL) AS null_prefix;
```
```text
+--------------+-------------+
| null_address | null_prefix |
+--------------+-------------+
| NULL         | NULL        |
+--------------+-------------+
```

### 키워드 {#keywords}

IPV4_CIDR_TO_RANGE
