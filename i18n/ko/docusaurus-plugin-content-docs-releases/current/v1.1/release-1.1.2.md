---
{
    "title": "릴리스 1.1.2",
    "language": "ko",
    "description": "이번 릴리스에서 Doris 팀은 1.1.1 이후 170건이 넘는 문제를 수정하거나 성능을 개선했습니다. 이 릴리스는 1. 버전의 버그 수정 릴리스입니다."
}
---

이번 릴리스에서 Doris 팀은 1.1.1 이후 170건이 넘는 문제를 수정하거나 성능을 개선했습니다. 이 릴리스는 1.1 버전의 버그 수정 릴리스이며, 모든 사용자에게 업그레이드를 권장합니다.

# 기능 {#features}

### 새로운 MemTracker {#new-memtracker}

벡터화 엔진과 비벡터화 엔진 모두에 정확도가 더 높은 새로운 MemTracker를 도입했습니다.

### 현재 쿼리 조회 및 쿼리 종료를 위한 API 추가 {#add-api-for-showing-current-queries-and-kill-query}

### ODBC 테이블을 통한 UTF16 이모지 읽기 및 쓰기 지원 {#support-readwrite-emoji-of-utf16-via-odbc-table}

# 개선 사항 {#improvements}

### 데이터 레이크 관련 개선 사항 {#data-lake-related-improvements}

- HDFS ORC 파일 스캔 성능을 약 300% 개선했습니다. [#11501](https://github.com/apache/doris/pull/11501)

- Iceberg 테이블을 쿼리할 때 HDFS HA 모드를 지원합니다.

- [Apache Tez](https://tez.apache.org/)로 생성한 Hive 데이터를 쿼리할 수 있습니다.

- Hive 외부 저장소로 Ali OSS를 지원합니다.

### Spark Load에서 string 및 text 타입 지원 추가 {#add-support-for-string-and-text-type-in-spark-load}


### 비벡터화 엔진에 블록 재사용 기능을 추가하여 일부 상황에서 성능을 50% 개선 [#11392](https://github.com/apache/doris/pull/11392) {#add-reuse-block-in-non-vectorized-engine-and-have-50-performance-improvement-in-some-cases-11392}

### like 또는 regex 성능 개선 {#improve-like-or-regex-performance}

### tcmalloc의 aggressive_memory_decommit 비활성화 {#disable-tcmallocs-aggressive_memory_decommit}

데이터 적재 또는 쿼리 성능이 40% 향상됩니다.

현재는 설정 항목으로 제공되며, `tc_enable_aggressive_memory_decommit` 설정을 변경해 조정할 수 있습니다.

# 버그 수정 {#bug-fix}

### FE 장애 또는 데이터 손상을 유발할 수 있는 문제 {#some-issues-about-fe-that-will-cause-fe-failure-or-data-corrupt}

- 예약된 BDB-JE 파일이 지나치게 많아지는 것을 방지하기 위해 디스크 예약 설정을 추가했습니다. **(심각)** HA 환경에서는 BDB JE가 많은 예약 파일을 유지합니다. BDB-je 로그는 디스크 사용량이 한계에 가까워질 때까지 삭제되지 않습니다.

- FE 복제본이 정상적으로 시작되지 않거나 데이터가 손상될 수 있는 BDB-JE의 치명적인 버그를 수정했습니다. **(심각)**

### 쿼리 중 FE가 waitFor_rpc에서 멈추고 동시 실행량이 많은 상황에서 BE가 멈추는 문제 {#fe-will-hang-on-waitfor_rpc-during-query-and-be-will-hang-in-high-concurrent-scenarios}

[#12459](https://github.com/apache/doris/pull/12459) [#12458](https://github.com/apache/doris/pull/12458) [#12392](https://github.com/apache/doris/pull/12392)

### 벡터화 스토리지 엔진에서 잘못된 결과를 초래하는 치명적인 문제 **(심각)** {#a-fatal-issue-in-vectorized-storage-engine-which-will-cause-wrong-result-serious}

[#11754](https://github.com/apache/doris/pull/11754) [#11694](https://github.com/apache/doris/pull/11694)

### BE 코어 덤프나 비정상 상태를 유발하는 여러 플래너 관련 문제 {#lots-of-planner-related-issues-that-will-cause-be-core-or-in-abnormal-state}

[#12080](https://github.com/apache/doris/pull/12080) [#12075](https://github.com/apache/doris/pull/12075) [#12040](https://github.com/apache/doris/pull/12040) [#12003](https://github.com/apache/doris/pull/12003) [#12007](https://github.com/apache/doris/pull/12007) [#11971](https://github.com/apache/doris/pull/11971) [#11933](https://github.com/apache/doris/pull/11933) [#11861](https://github.com/apache/doris/pull/11861) [#11859](https://github.com/apache/doris/pull/11859) [#11855](https://github.com/apache/doris/pull/11855) [#11837](https://github.com/apache/doris/pull/11837) [#11834](https://github.com/apache/doris/pull/11834) [#11821](https://github.com/apache/doris/pull/11821) [#11782](https://github.com/apache/doris/pull/11782) [#11723](https://github.com/apache/doris/pull/11723) [#11569](https://github.com/apache/doris/pull/11569)
