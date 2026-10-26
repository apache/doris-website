---
{
    "title": "릴리스 1.2.6",
    "language": "ko",
    "description": "이번 릴리스에 기여해 주신 모든 분께 감사드립니다:"
}
---

# 동작 변경 사항 {#behavior-change}

- 기존 동작과의 호환성을 위해, decimal의 정밀도를 초과하는 데이터를 가져올 수 있는지 제어하는 BE 설정 항목 `allow_invalid_decimalv2_literal`을 추가했습니다.

# 쿼리 {#query}

- 여러 쿼리 계획 수립 문제를 수정했습니다.
- `sql_select_limit` 세션 변수를 지원합니다.
- 쿼리의 콜드 실행 성능을 개선했습니다.
- expr context의 메모리 누수를 수정했습니다.
- 일부 경우에 `explode_split` 함수가 잘못 실행되던 문제를 수정했습니다.

## 멀티 Catalog {#multi-catalog}

- Hive 메타데이터 동기화로 인해 FE의 edit log 재생이 실패하던 문제를 수정했습니다.
- `refresh catalog` 작업으로 인해 FE에서 OOM이 발생하던 문제를 수정했습니다.
- JDBC Catalog가 `0000-00-00`을 올바르게 처리하지 못하던 문제를 수정했습니다.
- Kerberos 티켓이 자동으로 갱신되지 않던 문제를 수정했습니다.
- Hive의 파티션 프루닝 성능을 개선했습니다.
- JDBC Catalog에서 Trino와 Presto의 동작이 일치하지 않던 문제를 수정했습니다.
- 일부 환경에서 HDFS short-circuit read를 사용해 쿼리 효율을 높일 수 없던 문제를 수정했습니다.
- CHDFS의 Iceberg 테이블을 읽을 수 없던 문제를 수정했습니다.

# 스토리지 {#storage}

- MOW 테이블에서 delete bitmap이 잘못 계산되던 문제를 수정했습니다.
- 여러 BE 메모리 문제를 수정했습니다.
- snappy 압축 문제를 수정했습니다.
- 일부 경우에 jemalloc로 인해 BE가 충돌할 수 있던 문제를 수정했습니다.

# 기타 {#others}

- java udf와 관련된 여러 문제를 수정했습니다.
- `recover table` 작업이 동적 파티션 생성을 잘못 트리거하던 문제를 수정했습니다.
- broker load를 통해 orc 파일을 데이터 적재할 때 발생하던 시간대 문제를 수정했습니다.
- 새로 추가된 `PERCENT` 키워드로 인해 Routine Load 작업의 메타데이터 재생이 실패하던 문제를 수정했습니다.
- `truncate` 작업이 비파티션 테이블에 적용되지 않던 문제를 수정했습니다.
- `show snapshot` 작업으로 인해 MySQL 연결이 끊기던 문제를 수정했습니다.
- 테이블 생성 시 잠금 시간 초과 오류가 발생할 가능성을 줄이도록 잠금 로직을 개선했습니다.
- 일부 구형 MySQL 클라이언트와의 호환성을 위해 세션 변수 `have_query_cache`를 추가했습니다.
- 데이터 적재 오류가 발생했을 때 표시되는 오류 메시지를 개선했습니다.

# 감사의 말씀 {#big-thanks}

이번 릴리스에 기여해 주신 모든 분께 감사드립니다:

@amorynan

@BiteTheDDDDt

@caoliang-web

@dataroaring

@Doris-Extras

@dutyu

@Gabriel39

@HHoflittlefish777

@htyoung

@jacktengg

@jeffreys-cat

@kaijchen

@kaka11chen

@Kikyou1997

@KnightLiJunLong

@liaoxin01

@LiBinfeng-01

@morningman

@mrhhsg

@sohardforaname

@starocean999

@vinlee19

@wangbo

@wsjz

@xiaokang

@xinyiZzz

@yiguolei

@yujun777

@Yulei-Yang

@zhangstar333

@zy-kkk
