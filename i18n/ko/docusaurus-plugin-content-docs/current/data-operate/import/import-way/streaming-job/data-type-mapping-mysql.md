---
{
    "title": "데이터 유형 매핑",
    "language": "ko",
    "description": "Doris Streaming Job CDC의 데이터 유형 매핑: 자동 테이블 생성 시 업스트림 MySQL 유형을 Doris 열 유형으로 매핑하는 방법과 Doris에 기록할 때 값이 변환되는 방식입니다."
}
---

:::caution 실험적 기능

Doris 연속 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Reference / data type mapping -->

아래 표는 업스트림 MySQL의 각 열 유형이 Doris 열 유형으로 매핑되는 방식을 보여 줍니다. 두 동기화 방법 모두 단일 매핑을 공유하며, 차이는 대상 테이블을 누가 생성하는지뿐입니다.

- **자동 테이블 생성 동기화**: Doris가 업스트림 스키마를 읽고 이러한 Doris 열 유형으로 대상 테이블을 자동으로 생성합니다.
- **SQL 매핑 동기화**: 사용자가 직접 대상 테이블을 생성하고 각 열에 호환되는 Doris 유형을 사용합니다.

두 경우 모두 값은 동일한 매핑에 따라 기록됩니다. 지원되지 않는 유형은 [제한 사항](./continuous-load-overview.md#limitations)을 참조하세요.

## JDBC URL 매개변수 정규화 {#jdbc-url-parameter-normalization}

MySQL 데이터 소스로 Streaming Job을 생성하거나 `cdc_stream()` 테이블 함수를 사용할 때, 다음 매개변수를 명시적으로 설정하지 않으면 Doris가 `jdbc_url`에 자동으로 추가합니다.

| 매개변수 | 주입 값 | 영향 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)`을 `BOOLEAN`(`true` / `false`)이 아닌 `TINYINT`(`1` / `0`)로 읽습니다. |
| `yearIsDateType` | `false` | `YEAR`를 날짜가 아닌 정수 연도로 읽습니다. |
| `useUnicode` | `true` | 유니코드 인코딩을 사용합니다. |
| `characterEncoding` | `utf-8` | 문자 집합으로 UTF-8을 사용합니다. |

이러한 매개변수 중 하나라도 `jdbc_url`에 명시적으로 설정되어 있으면 Doris는 사용자가 지정한 값을 유지하고 재정의하지 않습니다. PostgreSQL의 `jdbc_url`은 정규화되지 않습니다.

:::caution 업그레이드 영향

`TINYINT(1)`을 `BOOLEAN`으로 읽거나 `YEAR`를 날짜로 읽으려면 각각 `jdbc_url`에 `tinyInt1isBit=true` 또는 `yearIsDateType=true`를 명시적으로 설정하세요.

:::

## MySQL에서 Doris로 {#mysql-to-doris}

| MySQL 유형 | Doris 유형 | 참고 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | 값 `1` / `0`을 사용하는 `TINYINT`로 매핑됩니다. 이유는 [JDBC URL 매개변수 정규화](#jdbc-url-parameter-normalization)를 참조하세요. |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | 날짜가 아닌 정수 연도로 읽으며, MySQL의 0년(`0000`)은 `0`으로 유지됩니다. |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 정밀도가 매우 높으면 `STRING`으로 대체됩니다. |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | 마이크로초 스케일(0–6)을 유지합니다. |
| `TIMESTAMP` | `DATETIME(s)` | 서버 시간대에 맞게 정규화됩니다. |
| `TIME` | `STRING` | 문자열로 직렬화됩니다(예: `12:34:56.000000`). |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64로 인코딩된 문자열 |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64로 인코딩된 문자열 |
| `JSON` | `STRING` | JSON 텍스트로 저장됩니다. |
| `ENUM` | `STRING` | 레이블 값으로 해석됩니다. |
| `SET` | `STRING` | 쉼표로 구분된 레이블로 해석됩니다. |
| 공간 유형(`GEOMETRY`, `POINT`, …) 및 기타 유형 | 지원되지 않음 | 이러한 열이 포함된 테이블은 자동 테이블 생성에 실패합니다. SQL 매핑 동기화를 사용하여(`SELECT`에서 캐스팅) 변환하거나 열을 제외하세요. |
