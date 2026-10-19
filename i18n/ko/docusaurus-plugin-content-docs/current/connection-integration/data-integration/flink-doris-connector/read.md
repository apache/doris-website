---
{
    "title": "Doris에서 데이터 읽기",
    "language": "ko",
    "description": "Flink Doris Connector에서 Thrift 또는 Arrow Flight SQL 프로토콜과 Source 옵션을 사용하여 Doris 데이터를 병렬로 읽습니다."
}
---

# Doris에서 데이터 읽기 {#reading-data-from-doris}

Flink Doris Connector는 Doris 테이블을 Flink 작업의 소스로 사용할 수 있습니다. 기본적으로 테이블의 유한한 스냅샷을 읽습니다. 행 수준의 변경 사항을 지속적으로 읽으려면 [Doris Binlog를 통한 증분 읽기](./incremental-read.md)를 참조하세요.

## 읽기 원리 {#how-it-works}

![FlinkConnectorPrinciples-JDBC-Doris](/images/next/connection-integration/data-integration/flink-doris-connector.jpg)

Flink Doris Connector는 Flink JDBC Connector보다 데이터 읽기 성능이 뛰어나므로 사용을 권장합니다.

- **Flink JDBC Connector**: Doris는 MySQL 프로토콜과 호환되지만, JDBC를 통한 읽기와 쓰기는 단일 FE 노드에서 직렬로 처리되므로 성능에 영향을 주는 병목이 발생합니다. 사용을 권장하지 않습니다.
- **Flink Doris Connector**: Doris 2.1부터 ADBC 프로토콜이 기본 읽기 프로토콜로 사용됩니다. 읽기 과정은 다음과 같습니다.
    1. Flink Doris Connector가 FE에서 쿼리 계획의 Tablet ID 정보를 가져옵니다.
    2. 쿼리 문 `SELECT * FROM tbs TABLET(id1, id2, id3)`를 생성합니다.
    3. FE의 ADBC 포트를 통해 쿼리를 실행합니다.
    4. BE가 데이터를 직접 반환하므로 데이터가 FE를 거치지 않아 FE의 단일 지점 병목이 해소됩니다.

## 읽기 프로토콜 {#protocols}

다음 두 가지 읽기 프로토콜을 지원합니다.

| 프로토콜       | 설명                                                  | 권장 버전 |
| -------------- | ------------------------------------------------------------ | ------------------- |
| Thrift         | BE의 thrift 인터페이스를 호출하여 데이터를 읽습니다                  | 모든 버전과 호환 |
| ArrowFlightSQL | Doris 2.1을 기반으로 Arrow Flight SQL 프로토콜을 통해 대량의 데이터를 고속으로 읽습니다 | Connector 24.0.0+   |

- Thrift 처리 흐름에 대한 자세한 내용은 [Thrift 인터페이스를 통한 데이터 읽기](https://github.com/apache/doris/blob/master/samples/doris-demo/doris-source-demo/README.md)를 참조하세요.
- ArrowFlightSQL 사용 방법에 대한 자세한 내용은 [Arrow Flight SQL 기반 고속 데이터 전송 링크](https://doris.apache.org/docs/dev/db-connect/arrow-flight-sql-connect/)를 참조하세요. Doris 2.1 이후에는 ArrowFlightSQL 방식을 권장합니다.

## FlinkSQL로 읽기 {#flink-sql}

### Thrift 방식 {#thrift-method}

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',  -- FE host:HttpPort
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

### Arrow Flight SQL 방식 {#arrow-flight-sql-method}

```sql
CREATE TABLE student (
    id INT,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '{fe.conf:http_port}',
    'table.identifier' = 'test.student',
    'source.use-flight-sql' = 'true',
    'source.flight-sql-port' = '{fe.conf:arrow_flight_sql_port}',
    'username' = 'root',
    'password' = ''
);

SELECT * FROM student;
```

## DataStream API로 읽기 {#datastream-api-read}

`DorisSource`를 사용하여 읽는 방법은 [DataStream API](./datastream-api.md#source)를 참조하세요.

## 옵션 {#options}

일반 연결 옵션은 [연결 옵션 및 TLS](./connection.md#common-options)에, 증분 읽기 옵션은 [Doris Binlog를 통한 증분 읽기](./incremental-read.md#options)에 나와 있습니다.

| 키                         | 기본값 | 필수 여부 | 설명                                                                                                                                                |
| --------------------------- | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| doris.request.query.timeout | 21600s        | N        | Doris 쿼리의 제한 시간입니다. 기본값은 6시간입니다.                                                                                              |
| doris.request.tablet.size   | 1             | N        | 하나의 Partition에 대응하는 Doris Tablet 수입니다. 이 값을 작게 설정할수록 더 많은 Partition이 생성되어 Flink 측의 병렬성이 높아지지만, Doris에 가해지는 부하도 증가합니다. |
| doris.batch.size            | 4064          | N        | BE에서 한 번에 읽는 최대 행 수입니다. 이 값을 늘리면 Flink와 Doris 간에 설정되는 연결 수를 줄여 네트워크 지연으로 인한 추가 시간 오버헤드를 줄일 수 있습니다. |
| doris.exec.mem.limit        | 8192mb        | N        | 단일 쿼리의 메모리 제한입니다. 기본값은 8GB이며, 단위는 바이트입니다.                                                                                         |
| source.use-flight-sql       | TRUE          | N        | 읽기에 Arrow Flight SQL을 사용할지 여부                                                                                                            |
| source.flight-sql-port      | -             | N        | Arrow Flight SQL로 읽을 때 사용하는 FE의 `arrow_flight_sql_port`                                                                              |

**DataStream 전용 설정**

| 키                | 기본값 | 필수 여부 | 설명                                                                                       |
| ------------------ | ------------- | -------- | --------------------------------------------------------------------------------------------- |
| doris.read.field   | --            | N        | Doris 테이블에서 읽을 열 이름 목록입니다. 쉼표로 구분합니다                        |
| doris.filter.query | --            | N        | 읽을 데이터를 필터링하는 표현식입니다. 이 표현식은 Doris에 그대로 전달되며, Doris는 이를 사용하여 소스에서 데이터를 필터링합니다. 예: `age=18`. |
