---
{
    "title": "데이터 유형 매핑",
    "language": "ko",
    "description": "Doris Streaming Job CDC의 데이터 유형 매핑: 자동 테이블 생성 시 업스트림 PostgreSQL 유형이 Doris 컬럼 유형에 매핑되는 방식과 Doris에 값을 쓸 때 변환되는 방식."
}
---

:::caution 실험적 기능

Doris 연속 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Reference / data type mapping -->

아래 표는 업스트림 PostgreSQL의 각 컬럼 유형이 Doris 컬럼 유형에 어떻게 매핑되는지 보여줍니다. 두 동기화 방식에 동일한 매핑이 적용되며, 대상 테이블을 누가 생성하는지만 다릅니다.

- **자동 테이블 생성 동기화**: Doris가 업스트림 스키마를 읽고 아래의 Doris 컬럼 유형으로 대상 테이블을 자동 생성합니다.
- **SQL 매핑 동기화**: 각 컬럼에 호환되는 Doris 유형을 사용하여 대상 테이블을 직접 생성합니다.

두 방식 모두 값을 쓸 때 동일한 매핑을 따릅니다. 지원되지 않는 유형은 [제한 사항](./continuous-load-overview.md#limitations)을 참조하세요.

## PostgreSQL에서 Doris로의 매핑 {#postgresql-to-doris}

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
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | 정밀도 상한은 38이며, 스케일을 지정하지 않으면 기본값은 9 |
| `bpchar(n)` (즉, `CHAR(n)`) | `CHAR` / `VARCHAR` | UTF-8을 위해 길이를 ×3으로 늘리며, `> 255`이면 `VARCHAR`로 매핑 |
| `varchar` / `text` | `STRING` | PostgreSQL `varchar`는 길이 지정이 없는 `STRING`으로 매핑 |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | 스케일은 0–6이며, `timestamptz`는 서버 시간대로 정규화 |
| `time` / `timetz` / `interval` | `STRING` | `timetz`는 UTC로 정규화된 오프셋을 유지 |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64로 인코딩된 문자열 |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| 기하 도형 유형 (`point`, `line`, `polygon` 등) | `STRING` | GeoJSON 문자열로 직렬화 (`type` / `coordinates` / `srid`) |
| 배열 유형 (예: `int4[]`, `text[]`) | `ARRAY<T>` | 단일 차원만 지원 |
| 기타 / 사용자 정의 유형 | `STRING` | |
