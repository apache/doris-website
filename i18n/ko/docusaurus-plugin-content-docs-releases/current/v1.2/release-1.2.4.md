---
{
    "title": "릴리스 1.2.4",
    "language": "ko",
    "description": "​ 참고: https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino"
}
---

# 동작 변경 사항 {#behavior-changed}

- `DateV2`/`DatetimeV2` 및 `DecimalV3` 타입은 `DESCRIBLE` 및 `SHOW CREATE TABLE` 문의 결과에서 더 이상 `DateV2`/`DatetimeV2` 또는 `DecimalV3`로 표시되지 않고, 각각 `Date`/`Datetime` 또는 `Decimal`로 표시됩니다.

	- 이 변경은 일부 BI 도구와의 호환성을 위한 것입니다. 컬럼의 실제 타입을 확인하려면 `DESCRIBE ALL` 문을 사용하세요.

- `information_schema` 데이터베이스의 테이블을 쿼리할 때 외부 Catalog의 메타데이터(데이터베이스, 테이블, 컬럼 등)가 기본적으로 반환되지 않습니다.

	- 이 변경으로 일부 외부 Catalog의 연결 문제 때문에 `information_schema` 데이터베이스를 쿼리할 수 없던 문제를 방지하고, 일부 BI 도구에서 Doris를 사용할 때 발생하던 문제를 해결합니다. FE 설정인 `infodb_support_ext_catalog`로 이 동작을 제어할 수 있습니다. 기본값은 `false`이며, 이 경우 외부 Catalog의 메타데이터가 반환되지 않습니다.

# 개선 사항 {#improvement}

### JDBC Catalog {#jdbc-catalog}

- JDBC Catalog를 통한 Trino/Presto 연결을 지원합니다.

​        참고: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#trino)

- JDBC Catalog에서 Clickhouse 데이터 소스 연결과 Array 타입 매핑을 지원합니다.

​        참고: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc#clickhouse)

### Spark Load {#spark-load}

- Spark Load에서 Resource Manager HA 관련 설정을 지원합니다.

​        참고: https://github.com/apache/doris/pull/15000

## 버그 수정 {#bug-fixes}

- Hive Catalog의 여러 연결 문제를 수정했습니다.

- Hudi Catalog의 ClassNotFound 문제를 수정했습니다.

- 연결이 지나치게 많아지지 않도록 JDBC Catalog의 연결 풀을 최적화했습니다.

- JDBC Catalog를 통해 다른 Doris 클러스터에서 데이터를 가져올 때 OOM이 발생하는 문제를 수정했습니다.

- 쿼리 및 데이터 적재 계획과 관련된 여러 문제를 수정했습니다.

- Unique Key Merge-On-Write 데이터 모델의 여러 문제를 수정했습니다.

- BDBJE의 여러 문제와 일부 상황에서 FE 메타데이터가 비정상적으로 되는 문제를 수정했습니다.

- `CREATE VIEW` 문에서 Table Valued Function을 지원하지 않던 문제를 수정했습니다.

- 여러 메모리 통계 문제를 수정했습니다.

- Parquet/ORC 형식 읽기와 관련된 여러 문제를 수정했습니다.

- DecimalV3의 여러 문제를 수정했습니다.

- SHOW QUERY/LOAD PROFILE의 여러 문제를 수정했습니다.
