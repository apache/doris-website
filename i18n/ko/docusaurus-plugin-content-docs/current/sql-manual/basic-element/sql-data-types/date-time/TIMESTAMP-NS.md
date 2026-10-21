---
{
    "title": "TIMESTAMP_NS",
    "language": "ko",
    "description": "TIMESTAMP_NS는 시간대 정보가 없는 날짜와 시간을 나노초 단위의 고정 정밀도로 저장합니다."
}
---

## 설명 {#description}

`TIMESTAMP_NS`는 시간대 정보가 없는 날짜와 시간을 나노초 단위의 고정 정밀도로 저장합니다. 이벤트 시각, 트레이스 등 `DATETIME(6)`의 마이크로초 정밀도로는 충분하지 않은 데이터에 사용합니다.

내부적으로 Doris는 Unix epoch를 기준으로 나노초 수를 나타내는 부호 있는 64비트 정수로 값을 저장합니다. 따라서 `TIMESTAMP_NS` 컬럼은 8바이트를 차지하며, 정확한 값의 범위는 다음과 같습니다.

```text
[1677-09-21 00:12:43.145224192, 2262-04-11 23:47:16.854775807]
```

출력 형식은 `yyyy-MM-dd HH:mm:ss.SSSSSSSSS`입니다. 소수 초는 끝에 붙는 영을 포함하여 항상 아홉 자리를 모두 표시합니다.

`DATETIME(p)`와 달리 `TIMESTAMP_NS`는 정밀도를 설정할 수 없습니다. `TIMESTAMP_NS(9)`와 같은 선언은 유효하지 않습니다.

`TIMESTAMP_NS`는 키 컬럼, 파티션 컬럼, 버킷 컬럼, 시퀀스 컬럼 및 값 컬럼으로 사용할 수 있습니다. 또한 `ARRAY`, `MAP`, `STRUCT` 및 타입이 지정된 `VARIANT` 값에서도 지원됩니다.

## 구문 {#syntax}

```sql
TIMESTAMP_NS
```

## 시간대 처리 방식 {#time-zone-semantics}

`TIMESTAMP_NS`는 시간대를 저장하지 않습니다. 값이 저장된 후에는 세션 변수 `time_zone`을 변경해도 해당 값이 바뀌지 않습니다.

입력 문자열에 시간대 오프셋이나 이름이 포함되어 있으면 Doris는 파싱할 때 입력을 세션 또는 데이터 적재에 사용되는 시간대로 변환한 다음, 변환된 현지 날짜와 시간을 시간대 정보 없이 저장합니다. 입력에 시간대 정보가 없으면 Doris는 입력의 각 필드를 그대로 저장합니다.

값이 특정 시점을 나타내며 서로 다른 세션 시간대에 맞춰 표시되어야 한다면 [`TIMESTAMPTZ`](./TIMESTAMPTZ.md)를 대신 사용하세요.

## 변환 및 연산 {#conversion-and-operations}

문자열은 소수 초를 최대 아홉 자리까지 포함할 수 있습니다. 더 많은 자릿수가 주어지면 Doris는 나노초 단위로 반올림합니다. 이때 올림이 발생하면 다음 초나 날짜로 넘어갈 수 있습니다. 지원 범위를 벗어나는 값은 유효하지 않습니다.

`TIMESTAMP_NS`는 숫자, 문자, `DATE`, `DATETIME`, `TIME`, `TIMESTAMPTZ` 및 `VARIANT` 타입과의 상호 변환을 지원합니다. 정밀도가 더 낮은 시간 관련 타입으로 변환하면 대상 정밀도에 맞춰 값을 반올림합니다. 전체 규칙은 [TIMESTAMP_NS로 형 변환](../conversion/timestamp-ns-conversion.md)을 참조하세요.

날짜와 시간의 추출, 서식 지정, 산술, 비교, 집계, 조건 및 윈도우 함수는 `TIMESTAMP_NS`를 지원합니다. 연산 결과의 타입이 `TIMESTAMP_NS`로 유지되면 소수 초 아홉 자리의 정밀도가 모두 보존됩니다. 연산 결과가 지원 범위를 벗어나면 값이 순환하지 않고 오류가 발생합니다.

나노초 전용 연산은 [`NANOSECOND`](../../../sql-functions/scalar-functions/date-time-functions/nanosecond.md), [`NANOSECONDS_ADD`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-add.md), [`NANOSECONDS_SUB`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-sub.md) 및 [`NANOSECONDS_DIFF`](../../../sql-functions/scalar-functions/date-time-functions/nanoseconds-diff.md)를 참조하세요.

## 예제 {#examples}

테이블을 생성하고 나노초 값을 저장합니다.

```sql
CREATE TABLE events (
    id BIGINT,
    event_time TIMESTAMP_NS
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO events VALUES
    (1, '1970-01-01 00:00:00.000000001'),
    (2, '2024-02-29 12:34:56.123456789'),
    (3, NULL);

SELECT * FROM events ORDER BY id;
```

```text
+------+-------------------------------+
| id   | event_time                    |
+------+-------------------------------+
|    1 | 1970-01-01 00:00:00.000000001 |
|    2 | 2024-02-29 12:34:56.123456789 |
|    3 | NULL                          |
+------+-------------------------------+
```

소수 초의 열 번째 자리에서 반올림하여 나노초 단위로 저장합니다.

```sql
SELECT CAST('1970-01-01 00:00:00.1234567895' AS TIMESTAMP_NS) AS ts;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 1970-01-01 00:00:00.123456790 |
+-------------------------------+
```

시간대 접미사는 입력을 파싱할 때만 적용됩니다. 세션 시간대를 변경한 후에도 저장된 값은 바뀌지 않습니다.

```sql
SET time_zone = '+08:00';
CREATE TABLE timezone_example (
    id INT,
    ts TIMESTAMP_NS
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO timezone_example VALUES
    (1, '2023-08-17T01:41:18.123456789Z');

SET time_zone = '+00:00';
SELECT ts FROM timezone_example;
```

```text
+-------------------------------+
| ts                            |
+-------------------------------+
| 2023-08-17 09:41:18.123456789 |
+-------------------------------+
```

`NULL`을 입력하면 `NULL`을 반환합니다.

```sql
SELECT CAST(NULL AS TIMESTAMP_NS) AS ts;
```

```text
+------+
| ts   |
+------+
| NULL |
+------+
```
