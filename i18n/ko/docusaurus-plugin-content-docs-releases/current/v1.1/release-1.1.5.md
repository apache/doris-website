---
{
    "title": "릴리스 1.1.5",
    "language": "ko",
    "description": "이번 릴리스에는 1.1.4 이후 Doris 팀이 진행한 약 36건의 문제 수정 및 성능 개선이 포함되어 있습니다. 이번 릴리스는 버전 1의 버그 수정 릴리스입니다."
}
---

이번 릴리스에는 1.1.4 이후 Doris 팀이 진행한 약 36건의 문제 수정 및 성능 개선이 포함되어 있습니다. 이번 릴리스는 1.1 계열의 버그 수정 릴리스이며, 모든 사용자에게 업그레이드를 권장합니다.

# 동작 변경 사항 {#behavior-changes}

과거에는 "select year(birthday) as birthday"처럼 별칭이 원래 컬럼명과 같고 이를 group by, order by, having 절에서 사용할 때 Doris의 동작이 MySQL과 달랐습니다. 이번 릴리스부터는 MySQL과 같은 방식으로 동작합니다. group by와 having 절에서는 원래 컬럼을 우선 사용하고, order by 절에서는 별칭을 우선 사용합니다. 혼동을 피하려면 원래 컬럼명과 같은 별칭을 사용하지 않는 것이 좋습니다.

# 기능 {#features}

murmur_hash3_64 지원을 추가했습니다. [#14636](https://github.com/apache/doris/pull/14636)

# 개선 사항 {#improvements}

convert_tz의 성능을 높이기 위해 시간대 캐시를 추가했습니다. [#14616](https://github.com/apache/doris/pull/14616)

show 절을 실행할 때 결과를 테이블 이름순으로 정렬합니다. [#14492](https://github.com/apache/doris/pull/14492)

# 버그 수정 {#bug-fix}

select 절에 상수 if 표현식이 있을 때 발생하는 코어 덤프 문제를 수정했습니다.  [#14858](https://github.com/apache/doris/pull/14858)

ColumnVector::insert_date_column에서 발생할 수 있는 충돌 문제를 수정했습니다. [#14839](https://github.com/apache/doris/pull/14839)

high_priority_flush_thread_num_per_store의 기본값을 6으로 변경해 데이터 적재 성능을 개선했습니다. [#14775](https://github.com/apache/doris/pull/14775)

quick compaction에서 발생하는 코어 덤프 문제를 수정했습니다.  [#14731](https://github.com/apache/doris/pull/14731)

파티션 컬럼이 duplicate key가 아닐 때 spark load에서 발생하는 IndexOutOfBounds 오류를 수정했습니다. [#14661](https://github.com/apache/doris/pull/14661)

VCollectorIterator의 메모리 누수 문제를 수정했습니다. [#14549](https://github.com/apache/doris/pull/14549)

sequence 컬럼이 있을 때 create table like에서 발생하는 문제를 수정했습니다. [#14511](https://github.com/apache/doris/pull/14511)

total_bytes를 사용하면 CPU 사용량이 많아지므로, 배치 크기를 계산할 때 평균 rowset을 사용하도록 변경했습니다. [#14273](https://github.com/apache/doris/pull/14273)

conjunct가 있는 right outer join에서 발생하는 코어 덤프 문제를 수정했습니다. [#14821](https://github.com/apache/doris/pull/14821)

tcmalloc gc 정책을 최적화했습니다.  [#14777](https://github.com/apache/doris/pull/14777) [#14738](https://github.com/apache/doris/pull/14738) [#14374](https://github.com/apache/doris/pull/14374)
