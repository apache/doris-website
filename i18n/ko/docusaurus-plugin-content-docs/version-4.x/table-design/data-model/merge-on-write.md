---
{
    "title": "Merge-on-Write",
    "language": "ko",
    "description": "Doris Unique Key 모델이 Key의 고유성을 보장하는 방식: merge-on-write와 merge-on-read 구현 방식, 성능상의 장단점, 두 방식의 선택 기준을 설명합니다."
}
---

**Merge-on-write**와 **merge-on-read**는 [Unique Key 모델](./unique)의 두 가지 스토리지 구현 방식입니다. 두 방식 모두 Key 컬럼의 고유성을 유지하고 동일한 쿼리 결과를 반환하지만, 중복 Key를 처리하는 시점이 달라 읽기 및 쓰기 성능에 차이가 있습니다. 기본값인 Merge-on-write는 대부분의 워크로드에 가장 적합합니다.

<!-- Knowledge type: Concept -->
<!-- Applicable scenarios: Choosing a Unique Key implementation -->

## 비교 {#comparison}

| 구현 방식 | 병합 시점 | 쓰기 성능 | 쿼리 성능 | 적합한 시나리오 |
| --- | --- | --- | --- | --- |
| Merge-on-write(기본값) | 쓰기 시점 | 보통 | 높음 | 쿼리와 쓰기 성능의 균형이 필요한 대부분의 시나리오 |
| Merge-on-read | 쿼리 또는 compaction 시점 | 높음 | 상대적으로 낮음 | 쓰기가 많고 읽기가 적은 시나리오 |

## Merge-on-Write의 작동 방식 {#how-merge-on-write-works}

merge-on-write 방식에서는 Doris가 데이터를 쓰는 시점에 중복 Key를 처리합니다. 새로 들어오는 각 행에 대해 해당 Key가 이미 존재하는지 확인하고, 기존 버전이 있으면 delete bitmap에 삭제된 것으로 표시합니다. 쿼리는 이 비트맵을 사용해 표시된 행을 건너뛰므로 최신 버전만 읽습니다. 이후 compaction 과정에서 해당 행이 디스크에서 제거됩니다.

쓰기 시점에 중복을 처리하므로 다음과 같은 이점이 있습니다.

- 쿼리는 Key마다 하나의 버전만 읽으며, 읽기 시점에 병합할 필요가 없습니다.
- Doris는 필터를 스토리지 계층으로 푸시다운할 수 있으므로, 스캔 시 조건에 맞지 않는 데이터를 건너뜁니다.
- 과거 업데이트가 누적되어도 읽기 성능이 저하되지 않습니다.

대신 쓰기 측에 비용이 발생합니다. 각 upsert는 기본 키를 조회해 이전 버전을 찾아 표시하므로, merge-on-read에 비해 쓰기 오버헤드가 다소 늘어납니다. 대부분의 워크로드에서는 이러한 비용보다 이점이 크므로 merge-on-write가 기본값입니다.

## Merge-on-Read의 작동 방식 {#how-merge-on-read-works}

merge-on-read 방식에서는 쓰기 작업이 데이터를 추가하기만 합니다. Doris는 Key의 모든 버전을 유지하고, 쿼리 시점이나 compaction 과정에서 이를 병합해 최신 버전을 반환합니다.

읽기 시점에 중복을 처리하므로 다음과 같은 특성이 있습니다.

- 기본 키 조회를 생략하므로 쓰기 작업의 부담이 적습니다.
- 모든 쿼리에서 각 Key의 버전을 병합해야 하고, Doris가 필터를 푸시다운할 수 없어 쿼리가 느려집니다.
- compaction 사이에 버전이 누적될수록 쿼리 지연 시간이 늘어납니다.

따라서 쿼리 속도보다 쓰기 처리량이 중요하고, 쓰기가 많으며 읽기가 적은 파이프라인에 적합합니다.

## 선택 기준 {#choosing-between-them}

- 실시간 업데이트, 차원 데이터 동기화 등 쿼리 성능이 중요한 경우를 포함한 대부분의 워크로드에는 **merge-on-write(기본값)를 사용하세요**. 이 방식은 부분 컬럼 업데이트와 같은 기능도 지원합니다.
- 읽기보다 쓰기가 훨씬 많고 쓰기 오버헤드를 최소화해야 하는 경우에만 **merge-on-read를 사용하세요**.

구현 방식은 테이블 생성 시 고정되며 **나중에 스키마 변경으로 바꿀 수 없으므로**, 테이블을 생성하기 전에 결정해야 합니다.

## 각 구현 방식 활성화 {#enabling-each-implementation}

`enable_unique_key_merge_on_write` 테이블 속성으로 구현 방식을 제어합니다.

Merge-on-write(기본값):

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

Merge-on-read(속성을 `false`로 설정):

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false"
);
```

## Merge-on-Write가 필요한 기능 {#capabilities-that-require-merge-on-write}

[부분 컬럼 업데이트](../../data-operate/update/update-of-unique-model)에는 merge-on-write가 필요합니다. 이 기능은 전체 행을 다시 쓰지 않고 일부 컬럼만 업데이트합니다.

## 관련 문서 {#related}

- [Unique Key 모델](./unique)
- [부분 컬럼 업데이트](../../data-operate/update/update-of-unique-model)
