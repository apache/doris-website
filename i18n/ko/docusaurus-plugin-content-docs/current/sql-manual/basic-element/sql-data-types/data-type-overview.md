---
{
    "title": "개요 | SQL 데이터 타입",
    "language": "ko",
    "description": "Apache Doris의 숫자, 날짜/시간, 문자열, 바이너리, 반정형, 집계, IP 및 UUID 타입 개요.",
    "sidebar_label": "개요"
}
---

# 개요 {#overview}

## 숫자 타입 {#numeric-types}

Doris는 다음과 같은 숫자 데이터 타입을 지원합니다:

### BOOLEAN {#boolean}

가능한 값은 두 가지로, 0은 거짓을, 1은 참을 나타냅니다.

자세한 내용은 [BOOLEAN](../sql-data-types/numeric/BOOLEAN.md)을 참조하세요.

### 정수 {#integer}

모두 부호 있는 정수입니다. INT 타입별로 차지하는 바이트 수와 표현할 수 있는 값의 범위가 다릅니다:

- **[TINYINT](../sql-data-types/numeric/TINYINT.md)**: 1바이트, [-128, 127]

- **[SMALLINT](../sql-data-types/numeric/SMALLINT.md)**: 2바이트, [-32768, 32767]

- **[INT](../sql-data-types/numeric/INT.md)**: 4바이트, [-2147483648, 2147483647]

- **[BIGINT](../sql-data-types/numeric/BIGINT.md)**: 8바이트, [-9223372036854775808, 9223372036854775807]

- **[LARGEINT](../sql-data-types/numeric/LARGEINT.md)**: 16바이트, [-2^127, 2^127 - 1]


### 부동소수점 {#floating-point}


근삿값을 저장하는 부동소수점 타입으로 [FLOAT](../sql-data-types/numeric/FLOATING-POINT.md)와 [DOUBLE](../sql-data-types/numeric/FLOATING-POINT.md)이 있으며, 일반적인 프로그래밍 언어의 `float`와 `double`에 해당합니다.

### 고정소수점 {#fixed-point}

정확한 고정소수점 타입인 [DECIMAL](../sql-data-types/numeric/DECIMAL.md)은 재무 계산 등 엄격한 정확도가 필요한 경우에 사용됩니다.



## 날짜 타입 {#date-types}

날짜 타입에는 DATE, TIME, DATETIME, TIMESTAMP_NS, TIMESTAMPTZ가 있습니다. DATE는 일 단위 정밀도로 날짜를 저장합니다. DATETIME은 시간대 정보 없이 날짜와 시간을 최대 마이크로초 정밀도로 저장합니다. TIMESTAMP_NS는 시간대 정보 없이 날짜와 시간을 고정 나노초 정밀도로 저장하며, 지원 범위는 1677년부터 2262년까지입니다. TIME은 시간만 저장하며, **현재 테이블 저장을 지원하지 않으며 쿼리 처리 중에만 사용할 수 있습니다**. TIMESTAMPTZ는 시간대를 인식하는 날짜 및 시간 타입으로, 값을 UTC로 저장하고 쿼리 시 세션 시간대에 따라 자동으로 변환합니다.

날짜 및 시간 타입으로 계산하거나 숫자 타입으로 변환할 때는 [TIME_TO_SEC](../../sql-functions/scalar-functions/date-time-functions/time-to-sec), [DATE_DIFF](../../sql-functions/scalar-functions/date-time-functions/datediff), [UNIX_TIMESTAMP](../../sql-functions/scalar-functions/date-time-functions/unix-timestamp) 같은 함수를 사용하세요. 숫자 타입으로 직접 변환한 결과는 보장되지 않습니다.

자세한 내용은 [DATE](../sql-data-types/date-time/DATE), [TIME](../sql-data-types/date-time/TIME), [DATETIME](../sql-data-types/date-time/DATETIME), [TIMESTAMP_NS](../sql-data-types/date-time/TIMESTAMP-NS), [TIMESTAMPTZ](../sql-data-types/date-time/TIMESTAMPTZ)를 참조하세요.




## 문자열 타입 {#string-types}

Doris는 고정 길이 문자열과 가변 길이 문자열을 모두 지원하며, 다음과 같은 타입이 있습니다:

- **[CHAR(M)](./string-type/CHAR)**: 고정 길이 문자열로, M은 바이트 길이입니다. M의 범위는 [1, 255]입니다.

- **[VARCHAR(M)](./string-type/VARCHAR)**: 가변 길이 문자열로, M은 최대 길이입니다. M의 범위는 [1, 65533]입니다.

- **[STRING](./string-type/STRING)**: 기본 최대 길이가 1,048,576바이트(1 MB)인 가변 길이 문자열입니다. 최대 길이는 2,147,483,643바이트(2 GB)까지 늘릴 수 있으며, `string_type_length_soft_limit_bytes` 설정으로 지정합니다.

## 바이너리 타입 {#binary-types}

- **[VARBINARY](./binary-type/VARBINARY)**: 가변 길이 바이너리 바이트 시퀀스로, M은 최대 길이(바이트 단위)입니다. VARCHAR와 유사하지만 문자 집합이나 콜레이션 없이 바이트 단위로 저장하고 비교하므로, 파일 조각, 암호화된 데이터, 압축된 데이터 등 임의의 바이너리 데이터를 저장하는 데 적합합니다. 4.0부터 지원됩니다. 현재 Doris에서 테이블 생성과 저장에는 사용할 수 없지만, Catalog를 사용해 다른 데이터베이스의 BINARY 컬럼을 Doris에 매핑하여 사용할 수 있습니다.

## 반정형 타입 {#semi-structured-types}


Doris는 JSON 데이터 처리를 위해 다양한 반정형 데이터 타입을 지원하며, 각 타입은 서로 다른 사용 사례에 맞게 설계되었습니다.

- **[ARRAY](../sql-data-types/semi-structured/ARRAY.md)** / **[MAP](../sql-data-types/semi-structured/MAP.md)** / **[STRUCT](./semi-structured/STRUCT)**: 중첩 데이터와 고정 스키마를 지원하므로, 사용자 행동 및 프로필 분석과 같은 분석 워크로드와 Parquet 같은 데이터 레이크 형식의 데이터 쿼리에 적합합니다. 고정 스키마를 사용하므로 동적 스키마 추론에 따른 오버헤드가 없어 쓰기 및 분석 성능이 높습니다.

- **[VARIANT](../sql-data-types/semi-structured/VARIANT.md)**: 중첩 데이터와 유연한 스키마를 지원합니다. 로그, 트레이스, IoT 데이터 분석과 같은 분석 워크로드에 적합합니다. 유효한 JSON 데이터라면 무엇이든 수용할 수 있으며, 이 데이터는 컬럼 기반 저장 형식의 하위 컬럼으로 자동 확장됩니다. 이러한 방식으로 높은 저장 압축률과 데이터 집계, 필터링, 정렬 성능을 제공합니다.

- **[JSON](../sql-data-types/semi-structured/JSON.md)**: 중첩 데이터와 유연한 스키마를 지원합니다. 동시성이 높은 포인트 쿼리 사용 사례에 최적화되어 있습니다. 유연한 스키마 덕분에 유효한 JSON 데이터라면 무엇이든 수집할 수 있으며, 이 데이터는 바이너리 형식으로 저장됩니다. 이 바이너리 JSON 형식에서 필드를 추출하는 속도는 일반 JSON 문자열을 사용할 때보다 2배 넘게 빠릅니다.

## 집계 타입 {#aggregation-types}

집계 데이터 타입은 집계 결과나 집계 중의 중간 결과를 저장합니다. 집계 작업이 많은 쿼리의 속도를 높이는 데 사용됩니다.

- **[BITMAP](../sql-data-types/aggregate/BITMAP.md)**: UV 통계와 사용자 세분화 등에서 정확한 중복 제거에 사용됩니다. `bitmap_union`, `bitmap_union_count`, `bitmap_hash`, `bitmap_hash64` 같은 BITMAP 함수와 함께 사용합니다.

- **[HLL](../sql-data-types/aggregate/HLL.md)**: 근사 중복 제거에 사용되며, `COUNT DISTINCT`보다 성능이 좋습니다. `hll_union_agg`, `hll_raw_agg`, `hll_cardinality`, `hll_hash` 같은 HLL 함수와 함께 사용합니다.

- **[QUANTILE_STATE](../sql-data-types/aggregate/QUANTILE-STATE.md)**: 근사 백분위수 계산에 사용되며, `PERCENTILE` 함수보다 성능이 좋습니다. `QUANTILE_PERCENT`, `QUANTILE_UNION`, `TO_QUANTILE_STATE` 같은 함수와 함께 사용합니다.

- **[AGG_STATE](../sql-data-types/aggregate/AGG-STATE.md)**: state/merge/union 같은 집계 함수 조합자와 함께 사용하여 집계 속도를 높입니다.


## IP 타입 {#ip-types}


IP 데이터 타입은 IP 주소를 바이너리 형식으로 저장하므로, 문자열로 저장할 때보다 쿼리 속도가 빠르고 공간 효율이 높습니다. 지원하는 IP 데이터 타입은 두 가지입니다:

- **[IPv4](../sql-data-types/ip/IPV4.md)**: IPv4 주소를 4바이트 바이너리 값으로 저장합니다. `ipv4_*` 계열 함수와 함께 사용합니다.
- **[IPv6](../sql-data-types/ip/IPV6.md)**: IPv6 주소를 16바이트 바이너리 값으로 저장합니다. `ipv6_*` 계열 함수와 함께 사용합니다.

## UUID {#uuid}

[UUID](./uuid.md)는 고정 16바이트 공간에 저장되는 128비트 식별자 타입입니다. 표준 형식이나 축약 형식의 십육진수 텍스트를 입력받고 소문자 표준 형식의 텍스트를 출력하며, 비교, 정렬, 그룹화 및 조인을 지원합니다.
