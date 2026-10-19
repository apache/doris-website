---
{
    "title": "Skew 힌트",
    "language": "ko",
    "description": "실행 가능한 예제와 실행 계획/Profile 검증을 통해 조인, DISTINCT 집계, 윈도우 Skew 힌트로 작업 불균형을 완화하는 방법을 설명합니다.",
    "keywords": [
        "Doris skew hint",
        "SaltJoin",
        "DISTINCT skew",
        "window skew"
    ]
}
---

Skew 힌트는 소수의 핫 키 때문에 일부 인스턴스의 실행 시간이 길어지는 문제를 완화합니다. Doris는 SQL 결과를 유지하면서 조인 솔팅, DISTINCT 집계 버킷 분할, 윈도우 정렬 전략을 지원합니다. Profiles에서 데이터 편향이 확인될 때 사용하세요. 복제와 추가 셔플에도 비용이 발생합니다.

:::note
이 페이지의 세 가지 힌트 형식은 Doris 4.1.0에서 사용할 수 있습니다. 재작성이 적용되는지는 배포된 릴리스의 실행 계획에서 확인하세요.
:::

## 데이터 준비 {#prepare-data}

예제를 실행하려면 현재 데이터베이스에 대한 CREATE, INSERT, SELECT 권한이 필요합니다. 이 작은 테이블은 구문과 결과를 검증하기 위한 것으로, 성능 향상을 보여 주는 용도는 아닙니다:

```sql
CREATE TABLE skew_left (id INT, k INT, v INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
CREATE TABLE skew_right (id INT, k INT, v INT)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
INSERT INTO skew_left VALUES (1,1,10),(2,1,20),(3,2,30),(4,3,40);
INSERT INTO skew_right VALUES (1,1,100),(2,2,200);
```

## 조인 Skew 힌트 {#join-skew-hint}

이미 알고 있는 핫 조인 키에는 `shuffle[skew(<column>(<literal>, ...))]`를 사용하세요. Doris는 한쪽 입력의 핫 행에 무작위 솔트 값을 부여하고, 반대쪽 입력의 일치하는 행을 각 솔트 값에 걸쳐 복제한 다음, 원래 키와 솔트 값을 함께 사용하여 셔플합니다.

- 일반 INNER 및 LEFT 조인에서는 핫 컬럼이 왼쪽 입력에 속해야 합니다. RIGHT 조인에서는 오른쪽 입력에 속해야 합니다. ASOF INNER/LEFT/RIGHT 형식에도 각 조인 유형에 해당하는 입력 측 규칙이 적용되며, MATCH_CONDITION과 동등 조건 키가 여전히 필요합니다.
- 컬럼은 조인 동등 조건 키에서 직접 참조되는 컬럼이어야 합니다. 표현식, 형 변환, 동등 조건 키에 포함되지 않은 컬럼은 재작성을 유발하지 않습니다. 이 힌트는 shuffle이 필요하며, Mark, FULL, SEMI, ANTI 조인은 제외됩니다.
- 한 번의 재작성에서는 지정된 핫 컬럼 하나를 처리합니다. 양쪽 모두에 데이터 편향이 있으면 복제 비용과 매우 큰 조인 결과가 여전히 발생할 수 있습니다.

조인에 힌트를 지정하세요:

```sql
SELECT l.id AS left_id, r.id AS right_id
FROM skew_left l
JOIN[shuffle[skew(l.k(1))]] skew_right r ON l.k = r.k
ORDER BY left_id, right_id;
```

```text
left_id  right_id
1        1
2        1
3        2
```

LEADING에서도 동일한 분산 방식과 핫 키를 지정할 수 있습니다:

```sql
SELECT /*+ leading(l shuffle[skew(l.k(1))] r) */
       l.id AS left_id, r.id AS right_id
FROM skew_left l JOIN skew_right r ON l.k = r.k
ORDER BY left_id, right_id;
```

```text
left_id  right_id
1        1
2        1
3        2
```

여기서 `l.k`는 핫 컬럼이고 `1`은 이미 알고 있는 핫 값입니다. 컬럼 타입과 호환되는 리터럴을 사용하세요. 조인 순서가 바뀌면 핫 컬럼이 여전히 요구되는 쪽에 있는지 확인하세요.

## DISTINCT 집계 Skew 힌트 {#distinct-aggregation-skew-hint}

단일 인자 DISTINCT 집계 함수의 인자 앞에 `[skew]`를 지정하세요:

```sql
SELECT k, COUNT(DISTINCT [skew] id) AS distinct_ids
FROM skew_left
GROUP BY k
ORDER BY k;
```

```text
k  distinct_ids
1  2
2  1
3  1
```

지원되는 함수는 COUNT, SUM, SUM0 및 단일 인자 GROUP_CONCAT입니다. 재작성하려면 GROUP BY가 있어야 하며, 해당 수준에 집계 함수가 정확히 하나이고 DISTINCT 인자도 하나여야 합니다. 또한 인자는 컬럼을 직접 참조해야 하며, GROUP BY에 이미 포함되어 있으면 안 됩니다. 조건을 충족하지 않으면 Doris는 일반 집계 방식을 유지합니다. 재작성은 원래 그룹 키로 병합하기 전에 그룹 키와 해시 버킷을 기준으로 중복 제거 작업을 분산하여 NDV가 높은 핫 그룹의 부담을 줄입니다.

## 윈도우 Skew 힌트 {#window-skew-hint}

윈도우 명세에서 PARTITION BY 뒤에 `[skew]`를 지정하세요:

```sql
SELECT id, SUM(v) OVER (
    PARTITION BY [skew] k ORDER BY id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
) AS running_sum
FROM skew_left
ORDER BY id;
```

```text
id  running_sum
1   10
2   30
3   30
4   40
```

이 전략은 로컬 정렬을 수행한 다음, 파티션 키를 기준으로 셔플하고 정렬된 스트림을 병합합니다. 동일한 파티션 키 그룹에서는 셔플이 필요한 최하위 윈도우 노드만 이 전략을 사용하고, 상위 노드는 분산 방식과 정렬 순서를 재사용합니다. PARTITION BY가 없는 전역 윈도우는 파티션 수준의 병렬성을 확보할 수 없으며, 단일 파티션이 매우 크면 여전히 느릴 수 있습니다.

## 매개변수 {#parameters}

| 매개변수 | 타입 | 기본값 | 범위 및 효과 |
|---|---|---|---|
| `skew_rewrite_join_salt_explode_factor` | 세션 정수형 | `0` | `0`이면 BEs/CPU를 기준으로 자동 결정합니다. `1`부터 `65535`까지의 값은 솔트/복제 배수를 설정합니다. 테이블 버킷 수와는 독립적입니다 |
| `skew_rewrite_agg_bucket_num` | 세션 정수형 | `1024` | `1`부터 `65535`까지의 값으로, DISTINCT 재작성의 해시 버킷 수를 제어합니다 |

## 검증 및 사용 지침 {#verification-and-guidance}

예제 SELECT 앞에 EXPLAIN을 붙이고, 적용된 힌트와 추가된 솔트, 집계 또는 정렬 노드를 확인하세요. `enable_profile=true`를 활성화하고 동일한 SQL에 대해 인스턴스별 행 수, 실행 시간, 메모리, 셔플 바이트 수를 비교하세요. 힌트를 적용할 수 없는 경우도 있으며, 재작성 여부는 최종 실행 계획으로 판단해야 합니다.

실제 데이터를 바탕으로 핫 값을 선택하세요. 조인 솔팅은 자동 설정으로 시작하세요. 배수가 커질수록 반대쪽 입력의 더 많은 행이 복제되므로 네트워크/메모리 사용량이 늘어나거나 OOM이 발생할 수 있습니다. 집계 버킷이 지나치게 많으면 셔플 및 병합 비용이 증가합니다. 윈도우 데이터 편향 처리는 필요한 행 수를 줄이는 대신 정렬을 최적화합니다. 데이터 분포가 바뀌면 다시 측정하세요.
