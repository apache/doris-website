---
{
    "title": "데이터 유형 매핑",
    "language": "ko",
    "description": "Doris Streaming Job CDC의 데이터 유형 매핑: 자동 테이블 생성 중 업스트림 PostgreSQL 유형이 Doris 열 유형에 매핑되는 방식과 Doris에 기록될 때 값이 변환되는 방식입니다."
}
---

:::caution 실험적 기능

Doris 연속 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Reference / data type mapping -->

아래 표는 업스트림 PostgreSQL의 각 열 유형이 Doris 열 유형에 매핑되는 방식을 보여 줍니다. 두 동기화 방식 모두 하나의 매핑을 공유하며, 차이는 대상 테이블을 누가 생성하는지뿐입니다:

- **자동 테이블 생성 동기화**: Doris가 업스트림 스키마를 읽고 이러한 Doris 열 유형으로 대상 테이블을 자동 생성합니다.
- **SQL 매핑 동기화**: 사용자가 직접 대상 테이블을 만들고 각 열에 호환되는 Doris 유형을 사용합니다.

두 경우 모두 값은 동일한 매핑에 따라 기록됩니다. 지원되지 않는 유형은 [제한 사항](./continuous-load-overview.md#limitations)을 참조하세요.

## PostgreSQL에서 Doris로 {#postgresql-to-doris}

| PostgreSQL 유형 | Doris 유형 | 비고 |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` | `STRING` | |
| `int2` / `smallserial` | `SMALLINT` | |
| `int4` / `serial` | `INT` | |
| `int8` / `bigserial` | `BIGINT` | |
| `float4` | `FLOAT` | |
| `float8` | `DOUBLE` | |
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | 정밀도는 38로 제한되며, 지정하지 않은 경우 스케일 기본값은 9입니다 |
| `bpchar(n)` (즉, `CHAR(n)`) | `CHAR` / `VARCHAR` | UTF-8 호환을 위해 길이를 ×3으로 조정하며, `> 255`는 `VARCHAR`로 변환됩니다 |
| `varchar` / `text` | `STRING` | PostgreSQL의 `varchar`는 `STRING`으로 매핑됩니다(길이 없음) |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | 스케일 0–6; `timestamptz`는 서버 시간대에 맞게 정규화됩니다 |
| `time` / `timetz` / `interval` | `STRING` | `timetz`는 UTC로 정규화된 오프셋을 유지합니다 |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64로 인코딩된 문자열 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| 기하 유형 (`point`, `line`, `polygon`, …) | `STRING` | GeoJSON 문자열(`type` / `coordinates` / `srid`)로 직렬화됩니다 |
| 배열 유형(예: `int4[]`, `text[]`) | `ARRAY<T>` | 단일 차원만 지원됩니다 |
| 기타 / 사용자 정의 유형 | `STRING` | |
