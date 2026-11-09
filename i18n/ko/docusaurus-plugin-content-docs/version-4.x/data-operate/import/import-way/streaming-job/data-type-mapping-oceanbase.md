---
{
    "title": "OceanBase 데이터 타입 매핑",
    "language": "ko",
    "sidebar_label": "데이터 타입 매핑",
    "description": "CDC 자동 테이블 생성 동기화 중 MySQL 호환 OceanBase 컬럼 타입이 Doris 컬럼 타입에 어떻게 매핑되는지 알아봅니다."
}
---

:::caution 실험적 기능

Doris 연속 데이터 적재는 실험적 기능이며 Doris 4.1.5부터 지원됩니다.

:::

<!-- Knowledge type: Reference / data type mapping -->

OceanBase CDC 연속 데이터 적재는 MySQL 호환 모드만 지원하며 MySQL 타입 변환 경로를 사용합니다. 다음 표는 자동 테이블 생성 시 OceanBase 컬럼 타입이 Doris 컬럼 타입에 어떻게 매핑되는지 보여 줍니다.

## JDBC URL 매개변수 정규화 {#jdbc-url-parameter-normalization}

OceanBase Streaming Job을 생성할 때 다음 매개변수를 명시적으로 설정하지 않으면 Doris가 `jdbc_url`에 자동으로 추가합니다.

| 매개변수 | 추가되는 값 | 효과 |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)`을 `BOOLEAN`(`true` / `false`) 대신 `TINYINT`(`1` / `0`)로 읽습니다. |
| `yearIsDateType` | `false` | `YEAR`를 날짜 대신 정수형 연도로 읽습니다. |
| `useUnicode` | `true` | Unicode 인코딩을 사용합니다. |
| `characterEncoding` | `utf-8` | UTF-8을 문자 집합으로 사용합니다. |

이 매개변수 중 하나라도 `jdbc_url`에 명시적으로 설정하면 Doris는 설정된 값을 유지합니다.

## OceanBase에서 Doris로의 타입 매핑 {#oceanbase-to-doris}

| OceanBase 타입(MySQL 호환 모드) | Doris 타입 | 참고 |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | 기본값은 `1` / `0`입니다. JDBC 읽기 동작을 변경하려면 `tinyInt1isBit=true`로 설정합니다. |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | 정수형 연도로 읽으며, 영년(`0000`)은 `0`으로 유지됩니다. |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | 정밀도가 매우 높으면 `STRING`으로 대체됩니다. |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | 0부터 6까지의 마이크로초 정밀도를 유지합니다. |
| `TIMESTAMP` | `DATETIME(s)` | 서버 시간대에 맞춰 정규화됩니다. |
| `TIME` | `STRING` | `12:34:56.000000`과 같은 문자열로 저장됩니다. |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64로 인코딩된 문자열입니다. |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64로 인코딩된 문자열입니다. |
| `JSON` | `STRING` | JSON 텍스트로 저장됩니다. |
| `ENUM` | `STRING` | 레이블 값으로 변환됩니다. |
| `SET` | `STRING` | 쉼표로 구분된 레이블로 변환됩니다. |
| 공간 타입(`GEOMETRY`, `POINT` 등) 및 기타 타입 | 지원되지 않음 | 이러한 컬럼이 포함된 테이블은 자동 생성에 실패합니다. 키가 아닌 컬럼은 `table.<table_name>.exclude_columns`로 제외할 수 있습니다. |

## 고려 사항 {#considerations}

- 타입 매핑은 OceanBase가 MySQL Connector/J를 통해 반환하는 메타데이터를 기준으로 합니다.
- 지원되지 않는 타입은 임의의 Doris 타입으로 대체되지 않습니다. 운영 환경용 작업을 생성하기 전에 대상 테이블 스키마를 확인하세요.
- `TIMESTAMP`는 소스 시간대와 `serverTimezone` JDBC URL 매개변수의 영향을 받습니다. 서로 다른 시간대에 걸쳐 배포할 때는 시간대를 명시적으로 설정하고 확인하세요.
- 기본 키 컬럼은 `table.<table_name>.exclude_columns`로 제외할 수 없습니다.

## 관련 문서 {#related-documents}

- [OceanBase CDC를 이용한 자동 테이블 생성](./continuous-load-oceanbase-database.md)
- [OceanBase 스키마 변경 동기화](./schema-change-oceanbase.md)
- [연속 데이터 적재 개요](./continuous-load-overview.md)
