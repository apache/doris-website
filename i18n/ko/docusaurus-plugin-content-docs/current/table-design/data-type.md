---
{
    "title": "데이터 타입",
    "language": "ko",
    "description": "Apache Doris에서 지원하는 데이터 타입 목록은 다음과 같습니다:"
}
---

Apache Doris에서 지원하는 데이터 타입 목록은 다음과 같습니다:

### [숫자 타입](../sql-manual/basic-element/sql-data-types/data-type-overview#numeric-types) {#numeric-types}


| 타입 이름      | 저장 크기(바이트) | 설명                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [BOOLEAN](../sql-manual/basic-element/sql-data-types/numeric/BOOLEAN)        | 1         | 불리언 값입니다. 0은 false를, 1은 true를 나타냅니다.        |
| [TINYINT](../sql-manual/basic-element/sql-data-types/numeric/TINYINT)        | 1         | 부호 있는 정수이며, 범위는 [-128, 127]입니다.                           |
| [SMALLINT](../sql-manual/basic-element/sql-data-types/numeric/SMALLINT)       | 2         | 부호 있는 정수이며, 범위는 [-32768, 32767]입니다.                       |
| [INT](../sql-manual/basic-element/sql-data-types/numeric/INT)            | 4         | 부호 있는 정수이며, 범위는 [-2147483648, 2147483647]입니다.             |
| [BIGINT](../sql-manual/basic-element/sql-data-types/numeric/BIGINT)         | 8         | 부호 있는 정수이며, 범위는 [-9223372036854775808, 9223372036854775807]입니다. |
| [LARGEINT](../sql-manual/basic-element/sql-data-types/numeric/LARGEINT)       | 16        | 부호 있는 정수이며, 범위는 [-2^127 + 1 ~ 2^127 - 1]입니다.              |
| [FLOAT](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)          | 4         | 부동 소수점 수이며, 범위는 [-3.4*10^38 ~ 3.4*10^38]입니다.       |
| [DOUBLE](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)         | 8         | 부동 소수점 수이며, 범위는 [-1.79*10^308 ~ 1.79*10^308]입니다.   |
| [DECIMAL](../sql-manual/basic-element/sql-data-types/numeric/DECIMAL)        | 4/8/16/32    | 고정밀 고정 소수점 수입니다. 형식: DECIMAL(P[,S]). P는 전체 유효 자릿수(precision)를, S는 소수점 이하 자릿수(scale)를 나타냅니다. P의 범위는 [1, MAX_P]입니다. `enable_decimal256`=false이면 MAX_P=38이고, `enable_decimal256`=true이면 MAX_P=76입니다. S의 범위는 [0, P]입니다.<br>`enable_decimal256`의 기본값은 false입니다. true로 설정하면 결과의 정밀도가 높아지지만 성능 오버헤드가 발생합니다.<br>저장 크기:<ul><li>0 < precision <= 9이면 4바이트를 차지합니다.</li><li>9 < precision <= 18이면 8바이트를 차지합니다.</li><li>18 < precision <= 38이면 16바이트를 차지합니다.</li><li>38 < precision <= 76이면 32바이트를 차지합니다.</li></ul>|

### [날짜 타입](../sql-manual/basic-element/sql-data-types/data-type-overview#date-types) {#date-types}

| 타입 이름             | 저장 크기(바이트) | 설명                                                                                |  
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------ |  
| [DATE](../sql-manual/basic-element/sql-data-types/date-time/DATE)         | 4               | 날짜 타입입니다. 현재 값의 범위는 ['0000-01-01', '9999-12-31']이며, 기본 출력 형식은 'yyyy-MM-dd'입니다.         |  
| [DATETIME](../sql-manual/basic-element/sql-data-types/date-time/DATETIME) | 8               | 날짜 및 시간 타입입니다. 형식: DATETIME([P]). 선택적 매개변수 P는 시간 정밀도를 나타내며, 값의 범위는 [0, 6]으로 소수점 이하 최대 6자리(마이크로초)까지 지원합니다. 설정하지 않으면 기본값은 0입니다.<br />값의 범위는 ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]']입니다. 출력 형식은 'yyyy-MM-dd HH:mm:ss.SSSSSS'입니다. |
| [TIMESTAMP_NS](../sql-manual/basic-element/sql-data-types/date-time/TIMESTAMP-NS) | 8 | 시간대 정보가 없고 나노초 정밀도가 고정된 날짜 및 시간 타입입니다. 범위는 ['1677-09-21 00:12:43.145224192', '2262-04-11 23:47:16.854775807']입니다. 출력 형식은 'yyyy-MM-dd HH:mm:ss.SSSSSSSSS'입니다. |

### [문자열 타입](../sql-manual/basic-element/sql-data-types/data-type-overview#string-types) {#string-types}

| 타입 이름      | 저장 크기(바이트) | 설명                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [CHAR](../sql-manual/basic-element/sql-data-types/string-type/CHAR)           | M         | 고정 길이 문자열입니다. M은 고정 길이 문자열의 바이트 길이를 나타냅니다. M의 범위는 1-255입니다. |
| [VARCHAR](../sql-manual/basic-element/sql-data-types/string-type/VARCHAR)        | 가변     | 가변 길이 문자열입니다. M은 가변 길이 문자열의 바이트 길이를 나타냅니다. M의 범위는 1-65533입니다. 가변 길이 문자열은 UTF-8 인코딩으로 저장되므로 일반적으로 영문자 하나는 1바이트를, 한자는 3바이트를 차지합니다. |
| [STRING](../sql-manual/basic-element/sql-data-types/string-type/STRING)         | 가변     | 가변 길이 문자열입니다. 기본적으로 1048576바이트(1MB)를 지원하며, 최대 2147483643바이트(2GB)까지 늘릴 수 있습니다. BE 설정 `string_type_length_soft_limit_bytes`로 조정할 수 있습니다. String 타입은 Value 열에서만 사용할 수 있으며, Key 열이나 파티션/버킷팅 열에는 사용할 수 없습니다. |

### [반정형 타입](../sql-manual/basic-element/sql-data-types/data-type-overview#semi-structured-types) {#semi-structured-types}
| 타입 이름      | 저장 크기(바이트) | 설명                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [ARRAY](../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY)          | 가변     | T 타입의 원소로 구성된 배열입니다. Key 열로 사용할 수 없습니다. 현재 Duplicate 및 Unique 모델의 테이블에서 지원됩니다. |
| [MAP](../sql-manual/basic-element/sql-data-types/semi-structured/MAP)            | 가변     | K와 V 타입의 원소로 구성된 맵입니다. Key 열로 사용할 수 없습니다. 현재 Duplicate 및 Unique 모델의 테이블에서 지원됩니다. |
| [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)         | 가변	    | 여러 필드로 구성된 구조체이며, 여러 열의 집합으로 볼 수도 있습니다. Key로 사용할 수 없습니다. 현재 STRUCT는 Duplicate 모델의 테이블에서만 지원됩니다. Struct의 필드 이름과 개수는 고정되어 있으며, 필드는 항상 Nullable입니다.|
| [JSON](../sql-manual/basic-element/sql-data-types/semi-structured/JSON)           | 가변     | 바이너리 JSON 타입입니다. 바이너리 JSON 형식으로 저장되며, JSON 함수로 JSON 내부 필드에 접근합니다. 길이 제한과 설정 방법은 String과 동일합니다. |
| [VARIANT](../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT)        | 가변     | JSON과 같은 반정형 데이터를 위해 설계된 동적 가변 데이터 타입입니다. 모든 JSON을 저장할 수 있으며, 저장 시 JSON의 필드를 자동으로 하위 열로 분리하여 저장 효율과 쿼리 분석 성능을 높입니다. 길이 제한과 설정 방법은 String과 동일합니다. Variant 타입은 Value 열에서만 사용할 수 있으며, Key 열이나 파티션/버킷팅 열에는 사용할 수 없습니다.|

### [집계 타입](../sql-manual/basic-element/sql-data-types/data-type-overview#aggregation-types) {#aggregate-types}

| 타입 이름      | 저장 크기(바이트) | 설명                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [HLL](../sql-manual/basic-element/sql-data-types/aggregate/HLL)            | 가변     | HLL은 근사 방식으로 중복을 제거합니다. 데이터 양이 많을 때 Count Distinct보다 성능이 좋습니다. HLL의 오차는 일반적으로 약 1%이며, 때로는 2%에 이르기도 합니다. HLL은 Key 열로 사용할 수 없으며, 테이블 생성 시 집계 타입을 HLL_UNION으로 지정해야 합니다. 사용자가 길이와 기본값을 지정할 필요는 없습니다. 길이는 시스템이 데이터의 집계 정도에 따라 내부적으로 제어합니다. HLL 열은 해당 `hll_union_agg`, `hll_raw_agg`, `hll_cardinality`, `hll_hash` 함수를 통해서만 쿼리하거나 사용할 수 있습니다.|
| [BITMAP](../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)         | 가변     | Bitmap 타입의 열은 Aggregate 테이블, Unique 테이블 또는 Duplicate 테이블에서 사용할 수 있습니다. Unique 테이블이나 Duplicate 테이블에서는 Key가 아닌 열로 사용해야 합니다. Aggregate 테이블에서도 Key가 아닌 열로 사용해야 하며, 테이블 생성 시 집계 타입을 BITMAP_UNION으로 지정해야 합니다. 사용자가 길이와 기본값을 지정할 필요는 없습니다. 길이는 시스템이 데이터의 집계 정도에 따라 내부적으로 제어합니다. BITMAP 열은 해당 `bitmap_union_count`, `bitmap_union`, `bitmap_hash`, `bitmap_hash64` 등의 함수를 통해서만 쿼리하거나 사용할 수 있습니다. |
| [QUANTILE_STATE](../sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE) | 가변     | QUANTILE_STATE는 근사 분위수 값을 계산하는 데 사용하는 타입입니다. 데이터 적재 중에 동일한 Key에 대한 서로 다른 Value를 사전 집계합니다. 값의 개수가 2048을 넘지 않으면 모든 데이터를 상세히 기록합니다. 값의 개수가 2048을 넘으면 TDigest 알고리즘을 사용하여 데이터를 집계(클러스터링)하고, 클러스터링 후의 중심점을 저장합니다. QUANTILE_STATE는 Key 열로 사용할 수 없으며, 테이블 생성 시 집계 타입을 QUANTILE_UNION으로 지정해야 합니다. 사용자가 길이와 기본값을 지정할 필요는 없습니다. 길이는 시스템이 데이터의 집계 정도에 따라 내부적으로 제어합니다. QUANTILE_STATE 열은 해당 `QUANTILE_PERCENT`, `QUANTILE_UNION`, `TO_QUANTILE_STATE` 등의 함수를 통해서만 쿼리하거나 사용할 수 있습니다. |
| [AGG_STATE](../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE)      | 가변     | 집계 함수입니다. state/merge/union 함수 조합자와 함께만 사용할 수 있습니다. AGG_STATE는 Key 열로 사용할 수 없으며, 테이블 생성 시 집계 함수의 시그니처도 함께 선언해야 합니다. 사용자가 길이와 기본값을 지정할 필요는 없습니다. 저장되는 데이터의 실제 크기는 함수 구현에 따라 달라집니다. |

### [IP 타입](../sql-manual/basic-element/sql-data-types/data-type-overview#ip-types) {#ip-types}
| 타입 이름      | 저장 크기(바이트) | 설명                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [IPv4](../sql-manual/basic-element/sql-data-types/ip/IPV4)            |   4바이트  |  IPv4 주소를 4바이트의 바이너리 데이터로 저장하며, `ipv4_*` 계열 함수와 함께 사용합니다.         |
| [IPv6](../sql-manual/basic-element/sql-data-types/ip/IPV6)            |   16바이트  |  IPv6 주소를 16바이트의 바이너리 데이터로 저장하며, `ipv6_*` 계열 함수와 함께 사용합니다.      |

### [UUID](../sql-manual/basic-element/sql-data-types/uuid.md) {#uuid}

| 타입 이름 | 저장 크기(바이트) | 설명 |
| --- | --- | --- |
| [UUID](../sql-manual/basic-element/sql-data-types/uuid.md) | 16 | 네이티브 128비트 식별자이며, 소문자 정규 형식의 텍스트로 표시됩니다. |

`SHOW DATA TYPES;` 문으로 Apache Doris에서 지원하는 모든 데이터 타입을 확인할 수도 있습니다.
