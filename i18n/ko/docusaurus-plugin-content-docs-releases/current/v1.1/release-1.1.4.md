---
{
    "title": "릴리스 1.1.4",
    "language": "ko",
    "description": "이번 릴리스에서 Doris 팀은 1.1.3 이후 약 60건의 문제를 수정하거나 성능을 개선했습니다. 이 릴리스는 1.1 계열의 버그 수정 릴리스입니다."
}
---

이번 릴리스에서 Doris 팀은 1.1.3 이후 약 60건의 문제를 수정하거나 성능을 개선했습니다. 이 릴리스는 1.1 계열의 버그 수정 릴리스이며, 모든 사용자에게 업그레이드를 권장합니다.


# 기능 {#features}

- Huawei Cloud에서 obs broker load를 지원합니다. [#13523](https://github.com/apache/doris/pull/13523)

- SparkLoad에서 parquet 및 orc 파일을 지원합니다.[#13438](https://github.com/apache/doris/pull/13438)

# 개선 사항 {#improvements}

- 부하가 높은 상황에서 쿼리 성능에 영향을 주지 않도록 metric hook에서 mutex를 획득하지 않게 했습니다.[#10941](https://github.com/apache/doris/pull/10941)


# 버그 수정 {#bugfix}

- spark load로 파일을 적재할 때 where 조건이 적용되지 않던 문제를 수정했습니다. [#13804](https://github.com/apache/doris/pull/13804)

- 벡터화 모드에서 nullable 컬럼이 있을 때 if 함수가 잘못된 결과를 반환하던 문제를 수정했습니다. [#13779](https://github.com/apache/doris/pull/13779)

- 다른 join 조건과 함께 anti join을 사용할 때 결과가 잘못 나오던 문제를 수정했습니다. [#13743](https://github.com/apache/doris/pull/13743)

- concat(ifnull) 함수를 호출할 때 BE가 충돌하던 문제를 수정했습니다. [#13693](https://github.com/apache/doris/pull/13693)

- group by 절에 함수가 있을 때 발생하던 planner 오류를 수정했습니다. [#13613](https://github.com/apache/doris/pull/13613)

- lateral view 절에서 테이블 이름과 컬럼 이름을 올바르게 인식하지 못하던 문제를 수정했습니다. [#13600](https://github.com/apache/doris/pull/13600)

- MV와 테이블 별칭을 함께 사용할 때 unknown column 오류가 발생하던 문제를 수정했습니다. [#13605](https://github.com/apache/doris/pull/13605)

- JSONReader가 value와 parse allocator의 메모리를 모두 해제하도록 수정했습니다. [#13513](https://github.com/apache/doris/pull/13513)

- enable_vectorized_alter_table이 true일 때 음수 값이 있는 컬럼에 to_bitmap()을 사용해 MV를 생성할 수 있던 문제를 수정했습니다. [#13448](https://github.com/apache/doris/pull/13448)

- from_date_format_str 함수에서 마이크로초 정보가 손실되던 문제를 수정했습니다. [#13446](https://github.com/apache/doris/pull/13446)

- 자식 노드의 smap 정보를 사용해 치환한 뒤 Sort exprs의 nullability 속성이 잘못 설정될 수 있던 문제를 수정했습니다. [#13328](https://github.com/apache/doris/pull/13328)

- case when에 조건이 1,000개 있을 때 코어 덤프가 발생하던 문제를 수정했습니다. [#13315](https://github.com/apache/doris/pull/13315)

- Stream Load에서 데이터의 마지막 줄이 누락되던 문제를 수정했습니다. [#13066](https://github.com/apache/doris/pull/13066)

- 테이블이나 파티션이 백업 전과 동일한 복제본 수로 복원되도록 수정했습니다. [#11942](https://github.com/apache/doris/pull/11942)
