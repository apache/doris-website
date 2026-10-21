---
{
    "title": "TIMESTAMPTZ",
    "language": "ko",
    "description": "TIMESTAMPTZ는 Doris에서 시간대 정보가 있는 날짜와 시간을 저장하는 데 사용하는 데이터 타입입니다."
}
---

## 설명 {#description}

TIMESTAMPTZ는 Doris에서 시간대 정보가 있는 날짜와 시간을 저장하는 데 사용하는 데이터 타입으로, 표준 SQL의 TIMESTAMP WITH TIME ZONE에 해당합니다.

데이터베이스 시스템마다 시간대 정보가 있는 타임스탬프 타입에 서로 다른 이름을 사용합니다.
- PostgreSQL과 Oracle은 TIMESTAMP WITH TIME ZONE을 사용합니다.
- SQL Server는 DATETIMEOFFSET을 사용합니다.
- 일부 다른 데이터베이스는 TIMESTAMP WITH LOCAL TIME ZONE을 사용합니다.

SQL 표준에 따르면 별도의 수식어가 없는 TIMESTAMP 타입은 시간대 정보를 포함하지 않아야 합니다(TIMESTAMP WITHOUT TIME ZONE에 해당). Doris는 사용자의 사용 습관과 편의성을 고려하여 시간대 정보가 있는 타임스탬프 타입에 더 간결한 이름인 TIMESTAMPTZ를 사용합니다. 현재 Doris에는 별도의 TIMESTAMP 타입이 없으며, 시간 정보는 DATETIME을 사용하여 저장할 수 있습니다.

TIMESTAMPTZ의 범위는 DATETIME과 동일한 `[0000-01-01 00:00:00.000000, 9999-12-31 23:59:59.999999]`입니다.
TIMESTAMPTZ는 TIMESTAMPTZ(p) 형식으로 정밀도를 지정할 수 있습니다. 여기서 `p`는 정밀도를 나타내며, 범위는 `[0, 6]`이고 기본값은 0입니다. 즉, TIMESTAMPTZ는 TIMESTAMPTZ(0)과 동일합니다. 기본 출력 형식은 `'yyyy-MM-dd HH:mm:ss.SSSSSS +XX:XX'`이며, `+XX:XX`는 시간대 오프셋을 나타냅니다(`SSSSSS`의 자릿수는 정밀도 `p`에 따라 결정됩니다).

TIMESTAMPTZ 타입은 기본 키, 파티셔닝 컬럼, 버킷팅 컬럼으로 사용할 수 있습니다.

### 동작 원리 {#working-principle}

TIMESTAMPTZ는 각 데이터 행에 시간대 정보를 저장하는 대신 다음 방식으로 동작합니다.
1. 저장 시: 모든 입력 시간 값을 UTC(협정 세계시)로 변환합니다.
2. 쿼리 시: 세션의 시간대 설정(`time_zone` 변수로 지정)에 따라 UTC 시간을 해당 시간대로 자동 변환하여 표시합니다.

따라서 TIMESTAMPTZ는 시간대 변환 기능이 있는 DATETIME 타입으로 이해할 수 있으며, Doris가 내부적으로 시간대 변환을 자동 처리합니다.

### 시간대 처리 규칙 {#time-zone-handling-rules}

- 입력 문자열에 시간대 정보가 포함된 경우(예: `"2020-01-01 00:00:00 +03:00"`), Doris는 해당 시간대 정보를 사용하여 변환합니다.
- 입력 문자열에 시간대 정보가 포함되지 않은 경우(예: `"2020-01-01 00:00:00"`), Doris는 현재 세션의 시간대 설정을 사용하여 변환합니다.

4.1.5부터 출력 시 과거의 IANA 시간대 오프셋을 초 단위 정밀도로 보존하여 `+HH:MM:SS` 형식으로 표시합니다. 입력 타임스탬프의 숫자형 오프셋에는 세션의 고정 오프셋과 다른 제약이 적용됩니다. 입력의 시는 `24` 미만이어야 하고, 분과 초는 `60` 미만이어야 합니다. 세션의 고정 오프셋 범위는 계속 `-12:00`부터 `+14:00`까지로 제한됩니다. 세션 시간대로 변환한 결과의 현지 연도가 `0`부터 `9999`까지의 범위를 벗어나면 변환에 실패합니다.

4.1.5부터 Catalog는 외부 시스템의 시간대 정보가 있는 타임스탬프 타입을 항상 `TIMESTAMPTZ`로 매핑합니다. 호환성 속성 `enable.mapping.timestamp_tz=false`를 설정해도 이전의 `DATETIME` 매핑으로 되돌릴 수 없습니다. Arrow Flight SQL은 시점을 시간대 주석이 있는 Arrow Timestamp 값으로 전달합니다. 쿼리 스키마는 세션 시간대를 사용합니다(`Z`는 `UTC`로 정규화됩니다). `DATETIME`은 시간대 주석이 없는 Timestamp를 사용합니다.

### 저장 및 사용 {#storage-and-usage}

Doris에서 TIMESTAMPTZ 타입 필드는 8바이트의 저장 공간을 차지합니다.

TIMESTAMPTZ와 DATETIME 타입은 서로 변환할 수 있으며, 변환 과정에서 적절한 시간대 조정이 이루어집니다. TIMESTAMPTZ는 DATETIME으로의 암시적 변환을 지원하므로, TIMESTAMPTZ를 직접 지원하지 않는 함수도 이 타입의 데이터를 처리할 수 있습니다.

## 예제 {#examples}

```sql
-- Using the current time zone (assuming +08:00) to convert a time string without time zone information
select cast("2020-01-01 00:00:00" as timestamptz);
```

```text
+--------------------------------------------+
| cast("2020-01-01 00:00:00" as timestamptz) |
+--------------------------------------------+
| 2020-01-01 00:00:00 +08:00                 |
+--------------------------------------------+
```

```sql
-- TIMESTAMPTZ supports microseconds
select cast("2020-01-01 00:00:00.123456" as timestamptz(5));
```

```text
+------------------------------------------------------+
| cast("2020-01-01 00:00:00.123456" as timestamptz(5)) |
+------------------------------------------------------+
| 2020-01-01 00:00:00.12345 +08:00                     |
+------------------------------------------------------+
```

```sql
-- Using a time string with time zone information
select cast("2020-01-01 00:00:00 +03:00" as timestamptz);
```

```text
+---------------------------------------------------+
| cast("2020-01-01 00:00:00 +03:00" as timestamptz) |
+---------------------------------------------------+
| 2020-01-01 05:00:00 +08:00                        |
+---------------------------------------------------+
```

```sql
-- Converting TIMESTAMPTZ to DATETIME (with time zone conversion based on current time zone)
select cast(cast("2020-01-01 00:00:00 +03:00" as timestamptz) as datetime);
```

```text
+---------------------------------------------------------------------+
| cast(cast("2020-01-01 00:00:00 +03:00" as timestamptz) as datetime) |
+---------------------------------------------------------------------+
| 2020-01-01 05:00:00                                                 |
+---------------------------------------------------------------------+
```

```sql
-- Converting DATETIME to TIMESTAMPTZ
select cast(cast('2023-01-02 01:00:00' as datetime) as timestamptz);
```

```text
+--------------------------------------------------------------+
| cast(cast('2023-01-02 01:00:00' as datetime) as timestamptz) |
+--------------------------------------------------------------+
| 2023-01-02 01:00:00 +08:00                                   |
+--------------------------------------------------------------+
```

```sql
-- Using TIMESTAMPTZ in functions
select HOUR(cast("2020-01-01 00:00:00 +03:00" as timestamptz));
```

```text
+---------------------------------------------------------+
| HOUR(cast("2020-01-01 00:00:00 +03:00" as timestamptz)) |
+---------------------------------------------------------+
|                                                       5 |
+---------------------------------------------------------+
```
