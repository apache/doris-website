---
{
    "title": "1.2.2 릴리스",
    "language": "ko",
    "description": "참고: https://doris.apache.org/docs/dev/lakehouse/multi-catalog/"
}
---

# 새로운 기능 {#new-features}

### Lakehouse {#lakehouse}

- Hive metastore의 자동 동기화를 지원합니다.

- Iceberg Snapshot을 읽고 Snapshot 기록을 조회할 수 있습니다.

- JDBC Catalog에서 PostgreSQL, Clickhouse, Oracle, SQLServer를 지원합니다.

- JDBC Catalog에서 Insert 작업을 지원합니다.

참고: [https://doris.apache.org/docs/dev/lakehouse/multi-catalog/](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/)

### 자동 버킷 {#auto-bucket}

 파티션별 버킷 수를 설정하고 조정하여 tablet 수를 적절한 범위로 유지합니다.

### 새 함수 {#new-functions}

새 함수 `width_bucket`을 추가했습니다.

참고: [https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/width-bucket/#description](https://doris.apache.org/zh-CN/docs/dev/sql-manual/sql-functions/width-bucket/#description)

# 동작 변경 사항 {#behavior-changes}

- BE의 페이지 캐시를 기본적으로 비활성화합니다: `disable_storage_page_cache=true`

이 설정으로 페이지 캐시를 비활성화하면 메모리 사용량을 최적화하고 메모리 부족으로 인한 OOM 위험을 줄일 수 있습니다.
하지만 일부 소규모 쿼리의 쿼리 지연 시간은 줄어듭니다.
쿼리 지연 시간에 민감하거나 동시성이 높고 소규모 쿼리가 많은 환경에서는 *disable_storage_page_cache=false*로 설정하여 페이지 캐시를 다시 활성화할 수 있습니다.

- GROUP BY 및 HAVING 절에서 별칭을 사용할지 제어하는 새 세션 변수 `group_by_and_having_use_alias_first`를 추가했습니다.

참고: [https://doris.apache.org/docs/dev/advanced/variables](https://doris.apache.org/docs/dev/advanced/variables)

# 개선 사항 {#improvement}

### Compaction {#compaction}

- 와이드 테이블의 compaction 오버헤드를 줄이고 효율을 높이는 `Vertical Compaction`을 지원합니다.

- 빈번한 데이터 가져오기에서 발생하는 -238 및 -235 문제를 해결하는 `Segment ompaction`을 지원합니다.

### Lakehouse {#lakehouse-1}

- Hive Catalog가 Hive 버전 1/2/3과 호환됩니다.

- Hive Catalog에서 Broker를 통해 JuiceFS 기반 HDFS에 접근할 수 있습니다.

- Iceberg Catalog에서 Hive Metastore 및 Rest Catalog 유형을 지원합니다.

- ES Catalog에서 _id 열 매핑을 지원합니다.

- 삭제된 행이 많은 경우 Iceberg V2의 읽기 성능을 개선했습니다.

- Schema Evolution 이후의 Iceberg 테이블 읽기를 지원합니다.

- Parquet Reader가 열 이름의 대소문자를 올바르게 처리합니다.

### 기타 {#other}

- Hadoop KMS로 암호화된 HDFS에 접근할 수 있습니다.

- 진행 중인 Export 작업을 취소할 수 있습니다.

- `explode_split`의 성능을 1배 개선했습니다.

- NULL을 허용하는 열의 읽기 성능을 3배 개선했습니다.

- Memtracker의 일부 문제를 해결하고 메모리 관리의 정확성과 메모리 할당을 개선했습니다.



# 버그 수정 {#bug-fix}

- Doris Flink Connector로 데이터를 적재할 때 발생하는 메모리 누수를 수정했습니다.

- BE에서 발생할 수 있는 스레드 스케줄링 문제를 수정하고, BE 스레드 고갈로 인한 `Fragment sent timeout` 오류를 줄였습니다.

- datetimev2/decimalv3 열 유형의 여러 정확성 및 정밀도 문제를 수정했습니다.

- Unique Key Merge-on-Read 테이블의 데이터 정확성 문제를 수정했습니다.

- Light Schema Change 기능의 여러 알려진 문제를 수정했습니다.

- bitmap 유형 Runtime Filter의 여러 데이터 정확성 문제를 수정했습니다.

- 버전 1.2.1에서 도입된 csv reader의 읽기 성능 저하 문제를 수정했습니다.

- Spark Load의 데이터 다운로드 단계에서 발생하는 BE OOM 문제를 수정했습니다.

- 버전 1.1에서 1.2로 업그레이드할 때 발생할 수 있는 메타데이터 호환성 문제를 수정했습니다.

- Resource를 사용해 JDBC Catalog를 생성할 때 발생하는 메타데이터 문제를 수정했습니다.

- 데이터 적재 작업으로 인한 높은 CPU 사용량 문제를 수정했습니다.

- 실패한 Broker Load 작업이 다수 발생할 때 FE OOM이 발생하는 문제를 수정했습니다.

- 부동소수점 유형 데이터를 적재할 때 정밀도가 손실되는 문제를 수정했습니다.

- 2PC Stream Load를 사용할 때 발생하는 메모리 누수 문제를 수정했습니다.

# 기타 {#other-1}

BE의 전체 rowset 및 segment 수를 확인할 수 있는 메트릭을 추가했습니다.

- doris_be_all_rowsets_num 및 doris_be_all_segments_num


# 감사의 말씀 {#big-thanks}

이번 릴리스에 기여해 주신 모든 분께 감사드립니다!


@adonis0147

@AshinGau

@BePPPower

@BiteTheDDDDt

@ByteYue

@caiconghui

@cambyzju

@chenlinzhong

@DarvenDuan

@dataroaring

@Doris-Extras

@dutyu

@englefly

@freemandealer

@Gabriel39

@HappenLee

@Henry2SS

@htyoung

@isHuangXin

@JackDrogon

@jacktengg

@Jibing-Li

@kaka11chen

@Kikyou1997

@Lchangliang

@LemonLiTree

@liaoxin01

@liqing-coder

@luozenglin

@morningman

@morrySnow

@mrhhsg

@nextdreamblue

@qidaye

@qzsee

@spaces-X

@stalary


@starocean999

@weizuo93

@wsjz

@xiaokang

@xinyiZzz

@xy720

@yangzhg

@yiguolei

@yixiutt

@Yukang-Lian

@Yulei-Yang

@zclllyybb

@zddr

@zhangstar333

@zhannngchen

@zy-kkk
