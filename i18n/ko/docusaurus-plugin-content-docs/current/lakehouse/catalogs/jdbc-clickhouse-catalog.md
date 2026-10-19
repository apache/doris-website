---
{
    "title": "Clickhouse JDBC Catalog",
    "language": "ko",
    "description": "Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 ClickHouse 데이터베이스에 연결할 수 있습니다."
}
---

Doris JDBC Catalog는 표준 JDBC 인터페이스를 통해 ClickHouse 데이터베이스에 연결할 수 있습니다. 이 문서에서는 ClickHouse 데이터베이스 연결을 구성하는 방법을 설명합니다.

JDBC Catalog에 대한 개요는 [JDBC Catalog 개요](./jdbc-catalog-overview.md)를 참조하세요.

## 사용 시 참고 사항 {#usage-notes}

ClickHouse 데이터베이스에 연결하려면 다음이 필요합니다.

* ClickHouse 23.x 이상 버전(이전 버전은 충분한 테스트를 거치지 않았습니다).

* ClickHouse 데이터베이스용 JDBC 드라이버. 최신 버전 또는 특정 버전의 ClickHouse JDBC 드라이버는 [Maven 리포지터리](https://mvnrepository.com/artifact/com.clickhouse/clickhouse-jdbc)에서 다운로드할 수 있습니다. ClickHouse JDBC 드라이버는 0.4.6 버전 사용을 권장합니다.

* Doris의 각 FE 및 BE 노드와 ClickHouse 서버 간의 네트워크 연결. 기본 포트는 8123입니다.

## ClickHouse에 연결 {#connecting-to-clickhouse}

```sql
CREATE CATALOG clickhouse PROPERTIES (
    'type' = 'jdbc',
    'user' = 'username',
    'password' = 'pwd',
    'jdbc_url' = 'jdbc:clickhouse://example.net:8123/',
    'driver_url' = 'clickhouse-jdbc-0.4.6-all.jar',
    'driver_class' = 'com.clickhouse.jdbc.ClickHouseDriver'
)
```

`jdbc_url`은 ClickHouse JDBC 드라이버에 전달할 연결 정보와 매개변수를 정의합니다. 지원되는 URL 매개변수는 [ClickHouse JDBC 드라이버 구성](https://clickhouse.com/docs/en/integrations/java#configuration)에서 확인할 수 있습니다.

### 연결 보안 {#connection-security}

데이터 소스에 전역적으로 신뢰할 수 있는 인증서를 설치하고 TLS를 구성했다면, jdbc\_url 속성에 설정된 JDBC 연결 문자열에 매개변수를 추가하여 클러스터와 데이터 소스 간에 TLS를 활성화할 수 있습니다.

예를 들어, jdbc\_url 구성 속성에 ssl=true 매개변수를 추가하여 TLS를 활성화할 수 있습니다.

```sql
'jdbc_url' = 'jdbc:clickhouse://example.net:8123/db?ssl=true'
```

TLS 구성 옵션에 대한 자세한 내용은 [Clickhouse JDBC 드라이버 문서의 SSL 구성 섹션](https://clickhouse.com/docs/en/integrations/java#connect-to-clickhouse-with-ssl)을 참조하세요.

## 계층 매핑 {#hierarchical-mapping}

ClickHouse를 매핑할 때 Doris의 데이터베이스는 ClickHouse의 데이터베이스에 대응합니다. 또한 Doris의 데이터베이스에 속한 테이블은 ClickHouse의 해당 데이터베이스에 속한 테이블에 대응합니다. 매핑 관계는 다음과 같습니다.

| Doris    | ClickHouse        |
| -------- | ----------------- |
| Catalog  | ClickHouse 서버 |
| 데이터베이스 | 데이터베이스          |
| 테이블    | 테이블             |

## 컬럼 자료형 매핑 {#column-type-mapping}

| ClickHouse 자료형           | Doris 자료형              | 설명                          |
| ------------------------- | ----------------------- | -------------------------------- |
| bool                      | boolean                 |                                  |
| string                    | string                  |                                  |
| date/date32               | date                    |                                  |
| datetime(S)/datetime64(S) | datetime(S)             |                                  |
| float32                   | float                   |                                  |
| float64                   | double                  |                                  |
| int8                      | tinyint                 |                                  |
| int16/uint8               | smallint                | Doris에는 UNSIGNED 자료형이 없으므로 한 단계 더 큰 자료형으로 매핑합니다 |
| int32/uInt16              | int                     | 위와 동일                    |
| int64/uint32              | bigint                  | 위와 동일                    |
| int128/uint64             | largeint                | 위와 동일                    |
| int256/uint128/uint256    | string                  | Doris에는 이 크기를 지원하는 자료형이 없으므로 STRING으로 처리합니다 |
| decimal(P, S)             | decimal(P, S) 또는 string | Doris가 지원하는 최대 정밀도를 초과하면 string으로 처리합니다 |
| enum/ipv4/ipv6 | string | |
| uuid | uuid | 기본 UUID 자료형으로 매핑합니다. 이전 4.x 및 3.x 릴리스에서는 STRING으로 매핑합니다. |
| array                     | array                   |                                  |
| 기타                     | UNSUPPORTED             |                                  |

## 관련 매개변수 {#related-parameters}

- `jdbc_clickhouse_query_final`

  세션 변수이며 기본값은 false입니다. true로 설정하면 Clickhouse에 전송되는 SQL 문에 `SETTINGS final = 1`이 추가됩니다.

## 자주 발생하는 문제 {#common-issues}

1. Clickhouse 데이터를 읽을 때 `NoClassDefFoundError: net/jpountz/lz4/LZ4Factory` 오류 메시지가 발생하는 경우

   먼저 [lz4-1.3.0.jar](https://repo1.maven.org/maven2/net/jpountz/lz4/lz4/1.3.0/lz4-1.3.0.jar) 패키지를 다운로드한 다음, 각 FE 및 BE 디렉터리 아래의 `custom_lib/` 디렉터리에 넣으세요(디렉터리가 없으면 직접 생성하세요).
