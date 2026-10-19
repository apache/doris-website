---
{
    "title": "데이터 타입 매핑",
    "language": "ko",
    "description": "Doris Streaming Job CDC의 데이터 타입 매핑: 자동 테이블 생성 시 업스트림 PostgreSQL 타입이 Doris 컬럼 타입으로 매핑되는 방식과 Doris에 기록할 때 값이 변환되는 방식을 설명합니다."
}
---

<!-- Knowledge type: Reference / data type mapping -->

아래 표는 각 업스트림 PostgreSQL 컬럼 타입이 어떤 Doris 컬럼 타입으로 매핑되는지 보여 줍니다. 두 동기화 방식은 동일한 매핑을 사용하며, 유일한 차이는 대상 테이블을 생성하는 주체입니다:

- **자동 테이블 생성 동기화**: Doris가 업스트림 스키마를 읽고 아래의 Doris 컬럼 타입을 사용하여 대상 테이블을 자동으로 생성합니다.
- **SQL 매핑 동기화**: 각 컬럼에 호환되는 Doris 타입을 사용하여 대상 테이블을 직접 생성합니다.

두 경우 모두 동일한 매핑에 따라 값이 기록됩니다. 지원되지 않는 타입은 [제한 사항](./continuous-load-overview.md#limitations)을 참조하세요.

## PostgreSQL에서 Doris로 {#postgresql-to-doris}

| PostgreSQL 타입 | Doris 타입 | 참고 |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` | `STRING` | |
| `int2` / `smallserial` | `SMALLINT` | |
| `int4` / `serial` | `INT` | |
| `int8` / `bigserial` | `BIGINT` | |
| `float4` | `FLOAT` | |
| `float8` | `DOUBLE` | |
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | 정밀도는 최대 38이며, 스케일을 지정하지 않으면 기본값은 9 |
| `bpchar(n)` (즉, `CHAR(n)`) | `CHAR` / `VARCHAR` | UTF-8에 맞춰 길이를 ×3으로 조정하며, `> 255`이면 `VARCHAR`로 변환 |
| `varchar` / `text` | `STRING` | PostgreSQL의 `varchar`는 `STRING`으로 매핑(길이 없음) |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | 스케일은 0–6이며, `timestamptz`는 서버 시간대로 정규화 |
| `time` / `timetz` / `interval` | `STRING` | `timetz`는 UTC로 정규화된 오프셋을 유지 |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64로 인코딩된 문자열 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| 기하 타입 (`point`, `line`, `polygon`, …) | `STRING` | GeoJSON 문자열로 직렬화(`type` / `coordinates` / `srid`) |
| 배열 타입 (예: `int4[]`, `text[]`) | `ARRAY<T>` | 일차원만 지원 |
| 기타 / 사용자 정의 타입 | `STRING` | |
