---
{
    "title": "Lookup Join",
    "language": "ko",
    "description": "Flink Doris Connector로 배치 및 비동기 쿼리를 사용해 Lookup Join으로 디멘션 테이블을 조인하는 방법과 Lookup 옵션을 알아봅니다."
}
---

# Lookup Join {#lookup-join}

Lookup Join은 Flink에서 디멘션 테이블 조인의 성능을 최적화할 수 있습니다. Flink JDBC Connector를 사용해 디멘션 테이블을 조인하면 다음과 같은 문제가 발생할 수 있습니다:

- Flink JDBC Connector는 동기 쿼리 모드를 사용합니다. 업스트림 데이터(예: Kafka)에서 레코드가 전송될 때마다 Doris 디멘션 테이블을 즉시 쿼리하므로, 동시성이 높은 환경에서는 쿼리 지연 시간이 길어집니다.
- JDBC를 통해 실행되는 쿼리는 일반적으로 레코드를 하나씩 조회하는 포인트 조회인 반면, Doris는 쿼리 효율을 높이기 위해 배치 쿼리를 권장합니다.

Flink Doris Connector에서 [Lookup Join](https://nightlies.apache.org/flink/flink-docs-release-1.20/docs/dev/table/sql/queries/joins/#lookup-join)을 사용하면 다음과 같은 이점이 있습니다:

- 업스트림 데이터를 배치 단위로 캐시하여 레코드별 쿼리로 인한 높은 지연 시간과 데이터베이스 부하를 줄입니다.
- 조인 쿼리를 비동기로 실행하여 데이터 처리량을 높이고 Doris 쿼리 부하를 줄입니다.

## 예제 {#example}

디멘션 테이블에는 Lookup 쿼리가 사용하는 `jdbc-url`을 설정해야 합니다. `lookup.cache.*` 옵션으로 캐시를 활성화합니다:

```sql
CREATE TABLE fact_table (
    `id` BIGINT,
    `name` STRING,
    `city` STRING,
    `process_time` as proctime()
) WITH (
    'connector' = 'kafka',
    ...
);

create table dim_city(
    `city` STRING,
    `level` INT,
    `province` STRING,
    `country` STRING
) WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'jdbc-url' = 'jdbc:mysql://127.0.0.1:9030',
    'table.identifier' = 'dim.dim_city',
    'username' = 'root',
    'password' = '',
    'lookup.cache.max-rows' = '100000',
    'lookup.cache.ttl' = '300s'
);

SELECT a.id, a.name, a.city, c.province, c.country, c.level
FROM fact_table a
LEFT JOIN dim_city FOR SYSTEM_TIME AS OF a.process_time AS c
ON a.city = c.city
```

## 옵션 {#options}

| 키                               | 기본값 | 필수 여부 | 설명                                       |
| --------------------------------- | ------------- | -------- | --------------------------------------------- |
| lookup.cache.max-rows             | -1            | N        | lookup에서 캐시하는 최대 행 수입니다. 기본값은 -1이며, 캐시가 비활성화됨을 의미합니다. |
| lookup.cache.ttl                  | 10s           | N        | lookup의 최대 캐시 유지 시간입니다. 기본값은 10s입니다. |
| lookup.max-retries                | 1             | N        | lookup 쿼리 실패 후 재시도 횟수입니다. |
| lookup.jdbc.async                 | FALSE         | N        | 비동기 lookup의 활성화 여부입니다. 기본값은 false입니다. |
| lookup.jdbc.read.batch.size       | 128           | N        | 비동기 lookup에서 쿼리당 최대 배치 크기입니다. |
| lookup.jdbc.read.batch.queue-size | 256           | N        | 비동기 lookup에서 중간 버퍼 큐의 크기입니다. |
| lookup.jdbc.read.thread-size      | 3             | N        | 각 태스크에서 lookup에 사용하는 jdbc 스레드 수입니다. |
