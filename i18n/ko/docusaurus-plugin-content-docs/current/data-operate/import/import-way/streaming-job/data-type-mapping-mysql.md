---
{
    "title": "데이터 타입 매핑",
    "language": "ko",
    "description": "Doris Streaming Job CDC의 데이터 타입 매핑: 자동 테이블 생성 시 업스트림 MySQL 타입이 Doris 컬럼 타입에 매핑되는 방식과 Doris에 기록될 때 값이 변환되는 방식을 설명합니다."
}
---

<!-- Knowledge type: Reference / data type mapping -->

아래 표는 업스트림 MySQL의 각 컬럼 타입이 어떤 Doris 컬럼 타입에 매핑되는지 보여줍니다. 두 동기화 방식은 동일한 매핑을 사용하며, 대상 테이블을 생성하는 주체만 다릅니다:

- **자동 테이블 생성 동기화(Auto Table Creation Sync)**: Doris가 업스트림 스키마를 읽고 아래의 Doris 컬럼 타입을 사용하여 대상 테이블을 자동으로 생성합니다.
- **SQL 매핑 동기화(SQL Mapping Sync)**: 각 컬럼에 호환되는 Doris 타입을 사용하여 대상 테이블을 직접 생성합니다.

두 방식 모두 동일한 매핑에 따라 값을 기록합니다. 지원되지 않는 타입은 [제한 사항](./continuous-load-overview.md#limitations)을 참조하세요.

## JDBC URL 매개변수 정규화 {#jdbc-url-parameter-normalization}

> 버전 4.1.4부터 지원됩니다.

MySQL 데이터 소스로 Streaming Job을 생성하거나 `cdc_stream()` 테이블 함수를 사용하면, Doris는 명시적으로 설정하지 않은 다음 매개변수를 `jdbc_url`에 자동으로 추가합니다:

| 매개변수 | 자동 추가 값 | 효과 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)`을 `TINYINT`(`1` / `0`)로 읽으며, `BOOLEAN`(`true` / `false`)으로 읽지 않음 |
| `yearIsDateType` | `false` | `YEAR`를 날짜 대신 정수 연도로 읽음 |
| `useUnicode` | `true` | Unicode 인코딩 사용 |
| `characterEncoding` | `utf-8` | 문자 집합으로 UTF-8 사용 |

이 매개변수 중 하나라도 `jdbc_url`에 명시적으로 설정되어 있으면 Doris는 설정한 값을 유지하며 덮어쓰지 않습니다. PostgreSQL의 `jdbc_url`은 정규화하지 않습니다.

:::caution 업그레이드 영향

4.1.3 이하 버전에서 업그레이드하면 기존 MySQL CDC 작업의 `TINYINT(1)` 컬럼은 `1` / `0`으로 표시되고(이전에는 `true` / `false`), `YEAR` 컬럼은 날짜 대신 정수 연도로 표시됩니다. 이전 동작을 유지하려면 `tinyInt1isBit=true`와 `yearIsDateType=true`를 `jdbc_url`에 명시적으로 설정하세요.

:::

## MySQL에서 Doris로의 매핑 {#mysql-to-doris}

| MySQL 타입 | Doris 타입 | 참고 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | **버전 4.1.4부터** `TINYINT`(값: `1` / `0`)에 매핑됩니다. 4.1.4 이전에는 `BOOLEAN`(`true` / `false`)에 매핑되었습니다. 그 이유는 [JDBC URL 매개변수 정규화](#jdbc-url-parameter-normalization)를 참조하세요 |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | **버전 4.1.4부터** 값을 날짜 대신 정수 연도로 읽습니다. MySQL의 제로 연도(`0000`)는 `0`으로 유지됩니다 |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 정밀도가 매우 높으면 `STRING`으로 대체됨 |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | 마이크로초 소수 자릿수(0–6) 유지 |
| `TIMESTAMP` | `DATETIME(s)` | 서버 시간대로 정규화됨 |
| `TIME` | `STRING` | 문자열로 직렬화됨. 예: `12:34:56.000000` |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64로 인코딩된 문자열 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64로 인코딩된 문자열 |
| `JSON` | `STRING` | JSON 텍스트로 저장됨 |
| `ENUM` | `STRING` | 레이블 값으로 변환됨 |
| `SET` | `STRING` | 쉼표로 구분된 레이블로 변환됨 |
| 공간 타입(`GEOMETRY`, `POINT`, …) 및 기타 타입 | 지원되지 않음 | 이러한 컬럼이 있는 테이블은 자동 테이블 생성(Auto Table Creation)에 실패합니다. SQL 매핑 동기화(SQL Mapping Sync)를 사용하거나(`SELECT`에서 형 변환) 해당 컬럼을 제외하세요 |
