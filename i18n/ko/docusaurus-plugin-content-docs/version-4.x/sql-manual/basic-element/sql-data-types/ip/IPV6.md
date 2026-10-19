---
{
    "title": "IPV6",
    "language": "ko",
    "description": "IPv6 타입은 UInt128 형식으로 16바이트에 저장되며, IPv6 주소를 나타내는 데 사용됩니다. 값의 범위는 ['::',"
}
---

## IPV6 {#ipv6}

### 설명 {#description}

IPv6 타입은 UInt128 형식으로 16바이트에 저장되며, IPv6 주소를 나타내는 데 사용됩니다.
값의 범위는 ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff']입니다.

`Inputs that exceed the value range or have invalid format will return NULL`

### 예시 {#example}

테이블 생성 예시:

```
CREATE TABLE ipv6_test (
  `id` int,
  `ip_v6` ipv6
) ENGINE=OLAP
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

데이터 삽입 예시:

```
insert into ipv6_test values(1, '::');
insert into ipv6_test values(2, '2001:16a0:2:200a::2');
insert into ipv6_test values(3, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff');
insert into ipv6_test values(4, 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffg'); // invalid data
```

데이터 조회 예시:

```
mysql> select * from ipv6_test order by id;
+------+-----------------------------------------+
| id   | ip_v6                                   |
+------+-----------------------------------------+
|    1 | ::                                      |
|    2 | 2001:16a0:2:200a::2                     |
|    3 | ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff |
|    4 | NULL                                    |
+------+-----------------------------------------+
```

## 모범 사례: 역색인이 있는 단일 IPV6 컬럼에 IPv4/IPv6 혼합 주소 저장 {#best-practice-store-mixed-ipv4ipv6-in-a-single-ipv6-column-with-an-inverted-index}

단일 `IPV6` 컬럼에 IPv4 주소와 IPv6 주소를 모두 저장할 수 있습니다. IPv4는 IPv4 매핑 IPv6 형식(`::ffff:x.y.z.w`)으로 기록합니다. 예를 들어 `192.168.1.1`은 `::ffff:192.168.1.1`로 저장하며, 네이티브 IPv6 주소(예: `2001:16a0:2:200a::2`)는 그대로 기록합니다. 이렇게 하면 서로 다른 IP 주소 체계가 혼합된 필드를 하나의 컬럼에서 관리할 수 있습니다. 이 컬럼에 역색인을 생성하면 IP 필터링 속도가 빨라지며, 동등 비교(`=`), `IN`, 그리고 `is_ip_address_in_range()` 같은 CIDR 함수를 지원합니다.

### 스키마 {#schema}

```sql
CREATE TABLE access_log (
  `id`            BIGINT NOT NULL,
  `request_time`  DATETIME NOT NULL,
  `client_ip`     IPV6 NULL COMMENT 'Stored uniformly as IPv6; IPv4 stored in ::ffff: form',
  INDEX idx_client_ip (`client_ip`) USING INVERTED
) ENGINE=OLAP
DUPLICATE KEY(`id`, `request_time`)
DISTRIBUTED BY HASH(`id`) BUCKETS 4
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);
```

### 데이터 적재 시 정규화 {#normalizing-on-load}

어떤 데이터 적재 방식을 사용하든, 컬럼 매핑에서 동일한 표현식으로 원본 IP 문자열을 IPv6로 변환하는 것이 핵심입니다(아래에서 `ip_str`은 원본 필드이며, `client_ip`는 테이블의 `IPV6` 컬럼입니다):

```sql
client_ip = COALESCE(
    ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
    to_ipv6_or_null(ip_str)
)
```

- 일반 IPv4 문자열은 `IPV4` 타입으로 파싱하는 `to_ipv4_or_null()`을 먼저 거친 뒤, `::ffff:x.y.z.w` 형식으로 변환하는 `ipv4_to_ipv6()`을 거칩니다;
- 유효한 IPv4가 아니면 `COALESCE`는 대신 `to_ipv6_or_null()`을 사용해 네이티브 IPv6 텍스트로 파싱합니다;
- 둘 다 실패하면 `NULL`을 기록합니다. 유효하지 않은 데이터를 거부하려면 `_or_null`을 엄격한 변환 함수인 `to_ipv4` / `to_ipv6`로 바꾸고 데이터 적재 오류 임계값을 통해 처리합니다.

#### Routine Load {#routine-load}

```sql
CREATE ROUTINE LOAD example_db.access_log_job ON access_log
COLUMNS TERMINATED BY ",",
COLUMNS(
  id, request_time, ip_str,
  client_ip = COALESCE(
      ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
      to_ipv6_or_null(ip_str)
  )
)
PROPERTIES ("desired_concurrent_number" = "3", "max_error_number" = "1000")
FROM KAFKA ("kafka_broker_list" = "broker:9092", "kafka_topic" = "ip_logs");
```

#### Stream Load {#stream-load}

`columns` 헤더에 동일한 변환을 적용합니다:

```shell
curl --location-trusted -u user:passwd \
  -H "format: csv" \
  -H "column_separator: ," \
  -H "columns: id, request_time, ip_str, client_ip=COALESCE(ipv4_to_ipv6(to_ipv4_or_null(ip_str)), to_ipv6_or_null(ip_str))" \
  -T data.csv \
  "http://<fe_host>:8030/api/example_db/access_log/_stream_load"
```

#### INSERT INTO (기존 VARCHAR 테이블에서 마이그레이션) {#insert-into-migrating-from-an-old-varchar-table}

원본 IP 문자열을 IPv6로 변환하는 작업을 `SELECT`에서 수행합니다(`ip_str`은 기존 테이블의 VARCHAR 컬럼입니다):

```sql
INSERT INTO access_log (id, request_time, client_ip)
SELECT
  id, request_time,
  COALESCE(
      ipv4_to_ipv6(to_ipv4_or_null(ip_str)),
      to_ipv6_or_null(ip_str)
  )
FROM access_log_varchar;
```

### 쿼리 재작성(중요) {#rewriting-queries-important}

모든 주소를 매핑된 IPv6로 저장한 후에는 **IPv4 쿼리 조건도 매핑된 IPv6 형식으로 재작성해야 합니다**. 그렇지 않으면 타입 또는 주소 체계가 일치하지 않아 인덱스를 건너뜁니다:

- **IPv6 CIDR**: 그대로 작성합니다.

  ```sql
  is_ip_address_in_range(client_ip, '2001:4860:4801::/48')
  ```

- **IPv4 CIDR → 매핑된 IPv6 CIDR**: 주소에 `::ffff:` 접두사를 붙이고, 접두사 길이에 **+96**을 더합니다(매핑된 주소의 처음 96비트는 고정된 접두사입니다).

  | IPv4 CIDR          | 매핑된 IPv6 CIDR            |
  | ------------------ | --------------------------- |
  | `10.42.0.0/16`     | `::ffff:10.42.0.0/112`      |
  | `192.178.4.0/24`   | `::ffff:192.178.4.0/120`    |
  | `3.219.120.76/32`  | `::ffff:3.219.120.76/128`   |

  ```sql
  is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **IPv4 정확 일치**: 이 경우에도 매핑된 값과 비교합니다.

  ```sql
  client_ip = ipv4_to_ipv6(to_ipv4('3.219.120.76'))
  -- or
  client_ip = to_ipv6('::ffff:3.219.120.76')
  ```

- **허용 목록(범위 내의 행만 유지)**: `is_ip_address_in_range(...)`를 필터로 직접 사용합니다.

  ```sql
  WHERE is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

- **차단 목록(범위 내의 행 제외)**: `NOT is_ip_address_in_range(...)`를 사용하고, `is_ip_address_in_range(...) = 0` 형식은 피합니다(인덱스로 조건을 푸시다운하기가 더 어렵습니다).

  ```sql
  WHERE NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')
  ```

전체 예시(여러 범위를 제외하는 통계 쿼리)입니다. CIDR 범위 조건이 포함되어 있으므로 인덱스를 사용하도록 먼저 임계값을 낮춥니다:

```sql
SET inverted_index_skip_threshold = 0;

SELECT client_ip, COUNT(*) AS cnt
FROM access_log
WHERE request_time BETWEEN '2026-06-01 00:00:00' AND '2026-06-02 00:00:00'
  AND client_ip NOT IN (to_ipv6('::ffff:3.219.120.76'))               -- exact IPv4 exclusion -> mapped
  AND NOT is_ip_address_in_range(client_ip, '::ffff:10.42.0.0/112')   -- IPv4 /16 -> /112
  AND NOT is_ip_address_in_range(client_ip, '2001:4860:4801::/48')    -- IPv6 range
GROUP BY client_ip;
```

### 인덱스 사용 조건 {#conditions-for-hitting-the-index}

- 컬럼은 네이티브 `IPV4` / `IPV6` 타입이어야 하며, 해당 컬럼에 `USING INVERTED`로 생성한 역색인이 있어야 합니다;
- `is_ip_address_in_range()`의 CIDR 인수는 **상수 문자열**이어야 합니다;
- `IPV6` 컬럼은 IPv6 CIDR만 처리합니다(IPv4 범위는 먼저 `::ffff:` 매핑 형식으로 변환해야 합니다). `IPV4` 컬럼은 IPv4 CIDR만 처리합니다. 타입과 CIDR 주소 체계가 일치하지 않으면 인덱스를 건너뛰고 표현식 필터링을 수행합니다;
- 세션 변수 `inverted_index_skip_threshold`의 기본값은 `50`입니다. 세그먼트 내 행의 50%를 초과하는 행이 인덱스 조건에 일치하면 인덱스를 건너뛰고 데이터를 직접 읽습니다(바이패스).

:::caution CIDR 범위 쿼리에는 더 낮은 `inverted_index_skip_threshold`가 필요합니다
CIDR 범위 쿼리에서 `is_ip_address_in_range()`는 내부적으로 두 개의 BKD 쿼리, 즉 `>= range start`와 `<= range end`로 분할됩니다. **각 조건만으로도 전체 행의 50%가 넘는 행이 일치하는 경우가 많습니다**(최종 교집합이 좁더라도). 이로 인해 바이패스가 발생하여 인덱스를 건너뜁니다. 따라서 이러한 쿼리에서 인덱스를 안정적으로 사용하려면 세션에 `SET inverted_index_skip_threshold = 0;`(또는 더 작은 값)을 설정해야 합니다. 동등 비교 / `IN`은 선택도가 높은 포인트 조회이므로 영향을 받지 않습니다.
:::

### 키워드 {#keywords}

IPV6
