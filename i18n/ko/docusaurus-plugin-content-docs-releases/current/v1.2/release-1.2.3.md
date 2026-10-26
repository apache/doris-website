---
{
    "title": "릴리스 1.2.3",
    "language": "ko",
    "description": "현재 Jdbc Catalog는 다른 Doris 데이터베이스에 연결할 때 5.x 버전의 JDBC jar 패키지만 지원합니다. 8을 사용하는 경우."
}
---

# 개선 사항 {#improvement}

### JDBC Catalog {#jdbc-catalog}

- JDBC Catalog를 통해 Doris 클러스터에 연결할 수 있도록 지원합니다.

현재 Jdbc Catalog는 다른 Doris 데이터베이스에 연결할 때 5.x 버전의 JDBC jar 패키지만 지원합니다. 8.x 버전의 JDBC jar 패키지를 사용하면 컬럼의 데이터 타입이 일치하지 않을 수 있습니다.

참고: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/#doris)

- `only_specified_database` 속성을 사용해 지정한 데이터베이스만 동기화할 수 있도록 지원합니다.

- `lower_case_table_names`를 사용해 테이블 이름을 소문자로 동기화함으로써 테이블 이름의 대소문자 구분 문제를 해결합니다.

참고: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc)

- JDBC Catalog의 읽기 성능을 최적화했습니다.

### Elasticsearch Catalog {#elasticsearch-catalog}

- Array 타입 매핑을 지원합니다.

- `like_push_down` 속성으로 LIKE 표현식의 푸시다운 여부를 제어하여 ES 클러스터의 CPU 오버헤드를 조절할 수 있습니다.

참고: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/es)

### Hive Catalog {#hive-catalog}

- Hive 테이블의 기본 파티션 `_HIVE_DEFAULT_PARTITION_`을 지원합니다.

- Hive Metastore 메타데이터 자동 동기화에서 압축 형식의 알림 이벤트를 지원합니다.

### 동적 파티션 개선 {#dynamic-partition-improvement}

- 동적 파티션에서 `storage_medium` 매개변수를 지정해 새로 추가되는 파티션의 저장 매체를 제어할 수 있습니다.

참고: [https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition](https://doris.apache.org/docs/dev/advanced/partition/dynamic-partition)


### BE 스레드 모델 최적화 {#optimize-bes-threading-model}

- 스레드를 빈번하게 생성하고 제거할 때 발생하는 안정성 문제를 방지하도록 BE의 스레드 모델을 최적화했습니다.

# 버그 수정 {#bugfix}

- Merge-On-Write Unique Key 테이블 관련 문제를 수정했습니다.

- compaction 관련 문제를 수정했습니다.

- 데이터 오류를 일으키는 일부 삭제 문 관련 문제를 수정했습니다.

- 여러 쿼리 실행 오류를 수정했습니다.

- 일부 운영체제에서 JDBC Catalog 사용 시 BE가 비정상 종료되는 문제를 수정했습니다.

- Multi-Catalog 관련 문제를 수정했습니다.

- 메모리 통계 및 최적화 관련 문제를 수정했습니다.

- decimalV3 및 date/datetimev2 관련 문제를 수정했습니다.

- 데이터 적재 트랜잭션의 안정성 문제를 수정했습니다.

- 경량 스키마 변경 관련 문제를 수정했습니다.

- `datetime` 타입을 사용한 일괄 파티션 생성 문제를 수정했습니다.

- 실패한 Broker Load가 대량으로 발생하면 FE의 메모리 사용량이 지나치게 높아지는 문제를 수정했습니다.

- 테이블 삭제 후 Stream Load를 취소할 수 없는 문제를 수정했습니다.

- 일부 경우에 `information_schema` 쿼리에서 시간 초과가 발생하는 문제를 수정했습니다.

- `select outfile`을 사용한 동시 데이터 내보내기로 인해 BE가 비정상 종료되는 문제를 수정했습니다.

- 트랜잭션 insert 작업에서 발생하는 메모리 누수를 수정했습니다.

- 여러 쿼리/데이터 적재 프로파일 문제를 수정하고, FE 웹 UI에서 프로파일을 직접 다운로드할 수 있도록 했습니다.

- BE 태블릿 GC 스레드로 인해 IO 사용률이 지나치게 높아지는 문제를 수정했습니다.

- Kafka Routine Load에서 커밋 오프셋이 정확하지 않은 문제를 수정했습니다.
