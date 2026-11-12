---
{
    "title": "1.2.1 릴리스",
    "language": "ko",
    "description": "더 높은 정밀도와 더 나은 성능을 지원하는 DecimalV3는 이전 버전에 비해 다음과 같은 장점이 있습니다."
}
---

# 개선 사항 {#improvement}

### 새로운 DecimalV3 유형 지원 {#supports-new-type-decimalv3}

더 높은 정밀도와 더 나은 성능을 지원하는 DecimalV3는 이전 버전에 비해 다음과 같은 장점이 있습니다.

- 표현할 수 있는 값의 범위가 크게 확장되었으며, 유효 자릿수 범위는 [1,38]입니다.

- 정밀도에 따라 사용하는 저장 공간을 적응적으로 조정해 성능이 향상됩니다.

- 정밀도 추론을 더 폭넓게 지원하며, 표현식에 따라 서로 다른 정밀도 추론 규칙을 적용해 결과의 정밀도를 결정합니다.

[DecimalV3](https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Types/DECIMALV3/)

### Iceberg V2 지원 {#support-iceberg-v2}

Iceberg V2를 지원합니다. 현재 Position Delete만 지원하며, Equality Delete는 후속 버전에서 지원할 예정입니다.

Multi-Catalog 기능을 통해 Iceberg V2 형식의 테이블에 접근할 수 있습니다.

### OR 조건을 IN 조건으로 변환하는 기능 지원 {#support-or-condition-to-in}

OR 조건을 IN 조건으로 변환할 수 있으며, 일부 상황에서 실행 효율이 향상됩니다.[#15437](https://github.com/apache/doris/pull/15437) [#12872](https://github.com/apache/doris/pull/12872)

### JSONB 유형의 데이터 적재 및 쿼리 성능 최적화 {#optimize-the-import-and-query-performance-of-jsonb-type}

JSONB 유형의 데이터 적재 및 쿼리 성능을 최적화했습니다. [#15219](https://github.com/apache/doris/pull/15219)  [#15219](https://github.com/apache/doris/pull/15219)

### Stream Load에서 큰따옴표로 묶인 CSV 데이터 지원 {#stream-load-supports-quoted-csv-data}

[문서](https://doris.apache.org/docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD)에서 trim_double_quotes를 검색하세요.

### Broker에서 Tencent Cloud CHDFS 및 Baidu Cloud BOS, AFS 지원 {#broker-supports-tencent-cloud-chdfs-and-baidu-cloud-bos-afs}

Broker를 통해 CHDFS, BOS, AFS에 저장된 데이터에 접근할 수 있습니다. [#15297](https://github.com/apache/doris/pull/15297) [#15448](https://github.com/apache/doris/pull/15448)

### 새 함수 {#new-function}

`substring_index` 함수를 추가했습니다. [#15373](https://github.com/apache/doris/pull/15373)

# 버그 수정 {#bug-fix}

- 일부 경우 1.1 버전에서 1.2 버전으로 업그레이드하면 사용자 권한 정보가 손실되는 문제를 수정했습니다. [#15144](https://github.com/apache/doris/pull/15144)

- datev2/datetimev2 유형으로 파티셔닝할 때 파티션 값이 잘못되는 문제를 수정했습니다. [#15094](https://github.com/apache/doris/pull/15094)

- 출시된 여러 기능의 버그를 수정했습니다. 전체 목록은 [PR 목록](https://github.com/apache/doris/pulls?q=is%3Apr+label%3Adev%2F1.2.1-merged+is%3Aclosed)을 참조하세요.

# 업그레이드 안내 {#upgrade-notice}

### 알려진 문제 {#known-issues}

- JDK11을 BE의 런타임 JDK로 사용하지 마세요. BE가 비정상 종료됩니다.
- 이 버전에서는 CSV 형식의 읽기 성능이 저하되어 CSV 형식 데이터의 적재 및 읽기 효율에 영향을 미칩니다. 다음 세 자리 버전에서 가능한 한 빨리 수정할 예정입니다.

### 동작 변경 사항 {#behavior-changed}

- Routine Load의 쓰기 효율을 높이기 위해 BE 설정 항목 `high_priority_flush_thread_num_per_store`의 기본값을 1에서 6으로 변경했습니다. (https://github.com/apache/doris/pull/14775)

- FE 설정 항목 `enable_new_load_scan_node`의 기본값을 true로 변경했습니다. 데이터 적재 작업에 새로운 File Scan Node가 사용됩니다. 사용자에게 미치는 영향은 없습니다.[#14808](https://github.com/apache/doris/pull/14808)

- FE 설정 항목 `enable_multi_catalog`를 삭제했습니다. Multi-Catalog 기능은 기본적으로 활성화됩니다.

- 벡터화 실행 엔진이 기본적으로 강제 활성화됩니다.[#15213](https://github.com/apache/doris/pull/15213)

세션 변수 enable_vectorized_engine은 더 이상 적용되지 않습니다. 벡터화 실행 엔진은 기본적으로 활성화됩니다.

이 변수가 다시 적용되도록 하려면 FE 설정 항목 `disable_enable_vectorized_engine`을 false로 설정한 다음 FE를 재시작하세요. 그러면 `enable_vectorized_engine`이 다시 적용됩니다.


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

@dataroaring

@Doris-Extras

@dutyu

@eldenmoon

@englefly

@freemandealer

@Gabriel39

@HappenLee

@Henry2SS

@hf200012

@jacktengg

@Jibing-Li

@Kikyou1997

@liaoxin01

@luozenglin

@morningman

@morrySnow

@mrhhsg

@nextdreamblue

@qidaye

@spaces-X

@starocean999

@wangshuo128

@weizuo93

@wsjz

@xiaokang

@xinyiZzz

@xutaoustc

@yangzhg

@yiguolei

@yixiutt

@Yulei-Yang

@yuxuan-luo

@zenoyang

@zhangstar333

@zhannngchen

@zhengshengjun
