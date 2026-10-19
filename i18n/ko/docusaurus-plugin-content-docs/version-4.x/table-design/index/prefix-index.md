---
{
    "title": "접두사 인덱스와 정렬 키",
    "language": "ko",
    "description": "접두사 인덱스는 Apache Doris에 내장된 희소 인덱스입니다. 정렬 키의 처음 36바이트를 기준으로 데이터 블록의 위치를 찾아 수동으로 생성할 필요 없이 동등 조건 쿼리와 범위 쿼리를 가속합니다.",
    "keywords": [
        "Prefix Index",
        "Sort Key",
        "Apache Doris",
        "sparse index",
        "query acceleration",
        "Key column design"
    ]
}
---

<!-- Knowledge type: Feature introduction + Design guide -->
<!-- Applicable scenarios: Table schema design / Query performance tuning -->

접두사 인덱스는 Apache Doris가 **기본으로 제공하고 자동으로 유지 관리하는** 희소 인덱스입니다. 정렬 키의 처음 36바이트를 기준으로 데이터 블록의 위치를 빠르게 찾으며, 수동으로 생성할 필요가 없습니다. 테이블 스키마를 설계할 때 적절한 정렬 키를 선택하면 `WHERE` 조건의 동등 조건 쿼리와 범위 쿼리를 크게 가속할 수 있습니다.

## 작동 방식 {#how-it-works}

![접두사 인덱스](/images/next/table-design/prefix-index.jpg)

### 정렬 키 {#sort-key}

Apache Doris는 SSTable(Sorted String Table)과 유사한 정렬 구조로 데이터를 저장하며, 지정한 하나 이상의 컬럼을 기준으로 데이터를 정렬하여 저장할 수 있습니다. 이러한 정렬 기준 컬럼을 **정렬 키**라고 합니다.

데이터 모델에 따라 정렬 키의 출처가 다릅니다.

| 데이터 모델 | 정렬 키의 출처 |
| --- | --- |
| Aggregate | `CREATE TABLE` 문에 지정한 Aggregate Key |
| Unique | `CREATE TABLE` 문에 지정한 Unique Key |
| Duplicate | `CREATE TABLE` 문에 지정한 Duplicate Key |

정렬 키가 있으면 쿼리의 `WHERE` 조건이 정렬 컬럼에 해당할 때 Doris가 일치하는 데이터 범위로 빠르게 이동할 수 있습니다. 따라서 전체 테이블 스캔을 피하고 검색 복잡도를 낮춰 쿼리를 가속합니다.

### 접두사 인덱스 {#prefix-index}

Apache Doris는 정렬 키를 기반으로 접두사 인덱스도 제공합니다.

1. 테이블의 여러 행이 모여 하나의 논리적 데이터 블록을 구성합니다.
2. 각 데이터 블록은 접두사 인덱스 테이블에 항목 하나만 저장합니다. 이 항목은 **블록의 첫 번째 행에 있는 정렬 컬럼을 연결하여 만든 접두사**이며, 길이는 36바이트를 넘지 않습니다.
3. 접두사 인덱스는 크기가 작아 **전체를 메모리에 캐시**할 수 있습니다. 대상 데이터 블록의 시작 행 번호를 빠르게 찾아 쿼리 효율을 크게 높입니다.

### 36바이트 절단 규칙 {#36-byte-truncation-rule}

접두사 인덱스는 행의 정렬 컬럼에서 처음 36바이트를 인덱스 내용으로 사용하지만, `VARCHAR` 컬럼을 만나면 **즉시 잘라냅니다**.

- 정렬 컬럼을 연결하는 중에 `VARCHAR` 컬럼에 도달하면 36바이트를 채웠는지와 관계없이 해당 컬럼의 끝에서 잘라냅니다.
- 첫 번째 컬럼 자체가 `VARCHAR`이면 길이가 36바이트보다 짧더라도 해당 컬럼의 끝에서 잘라내며, 이후 컬럼은 접두사 인덱스에 추가하지 않습니다.

## 적용 시나리오 {#applicable-scenarios}

접두사 인덱스는 주로 다음과 같은 쿼리에 사용됩니다.

- **동등 조건 쿼리**: `col = value`, `col IN (...)`
- **범위 쿼리**: `col > value`, `BETWEEN ... AND ...` 등

`WHERE` 조건이 정렬 키의 **접두사**, 즉 첫 번째 컬럼부터 시작하는 왼쪽의 연속된 여러 컬럼에 해당하면 접두사 인덱스로 쿼리를 가속할 수 있습니다.

## 테이블 스키마 설계 권장 사항 {#table-schema-design-recommendations}

테이블에는 정렬 키 정의가 하나뿐이므로 **테이블당 접두사 인덱스 집합도 하나만 가질 수 있습니다**. 테이블을 생성할 때 선택한 정렬 키에 따라 접두사 인덱스의 가속 효과가 결정됩니다. 다음 지침을 참고하세요.

1. **`WHERE` 필터 조건에 가장 자주 등장하는 컬럼을 Key 컬럼으로 우선 선택하세요.**
2. **쿼리에 더 자주 사용되는 컬럼을 앞에 배치하세요.** 접두사 인덱스는 조건이 가장 왼쪽 컬럼부터 연속해서 일치할 때만 효과가 있기 때문입니다.
3. **정렬 키의 앞부분에 `VARCHAR` 컬럼을 배치할 때는 주의하세요.** 절단 규칙이 적용되어 이후 컬럼이 접두사 인덱스에 포함되지 못하는 상황을 피해야 합니다.

:::tip
정렬 키를 조정해도 자주 사용하는 쿼리 조건에 접두사 인덱스를 활용할 수 없다면, 아래의 [접두사 인덱스를 활용할 수 없을 때의 대안](#alternatives-when-the-prefix-index-cannot-be-hit) 절을 참고하세요.
:::

## 사용 예제 {#usage-examples}

### 예제 1: 절단이 발생하지 않는 접두사 인덱스 {#example-1-prefix-index-without-truncation}

다음 정렬 키의 접두사 인덱스는 `user_id (8 Bytes) + age (4 Bytes) + message (first 20 Bytes)`이며, 총 32바이트입니다.

| 컬럼 이름     | 타입         |
| -------------- | ------------ |
| user_id        | BIGINT       |
| age            | INT          |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

### 예제 2: 첫 번째 컬럼이 VARCHAR여서 절단이 발생하는 경우 {#example-2-first-column-is-varchar-and-triggers-truncation}

다음 정렬 키의 접두사 인덱스에는 `user_name (20 Bytes)`만 포함됩니다. 전체 길이가 36바이트에 도달하지 않았더라도 첫 번째 컬럼이 `VARCHAR`이므로 즉시 잘라내며, 이후 컬럼은 접두사 인덱스에 추가하지 않습니다.

| 컬럼 이름     | 타입         |
| -------------- | ------------ |
| user_name      | VARCHAR(20)  |
| age            | INT          |
| message        | VARCHAR(100) |
| max_dwell_time | DATETIME     |
| min_dwell_time | DATETIME     |

### 예제 3: 접두사 인덱스를 활용하는 쿼리와 활용하지 못하는 쿼리 {#example-3-query-hitting-vs-missing-the-prefix-index}

예제 1의 테이블 스키마를 기준으로 살펴보겠습니다.

- **접두사 인덱스 활용**: 조건이 가장 왼쪽의 정렬 컬럼 두 개를 포함하므로 효율이 높습니다.

    ```sql
    SELECT * FROM table WHERE user_id = 1829239 AND age = 20;
    ```

- **접두사 인덱스 활용 불가**: 조건에서 `user_id`를 건너뛰므로 접두사로 위치를 찾을 수 없습니다.

    ```sql
    SELECT * FROM table WHERE age = 20;
    ```

따라서 테이블을 생성할 때 컬럼 순서를 올바르게 선택하면 쿼리 효율을 크게 높일 수 있습니다.

## 인덱스 효과 확인 {#verifying-index-effectiveness}

접두사 인덱스는 **쿼리를 가속할 수 있을 때 별도의 구문 없이 자동으로 적용됩니다**. [쿼리 프로파일](../../query-acceleration/query-profile.md)의 다음 지표로 가속 효과를 확인할 수 있습니다.

| 지표 | 의미 |
| --- | --- |
| `RowsKeyRangeFiltered` | 접두사 인덱스로 필터링하여 제외한 행 수입니다. 다른 `Rows*` 지표와 비교하여 인덱스의 필터링 효과를 평가할 수 있습니다. |

## 접두사 인덱스를 활용할 수 없을 때의 대안 {#alternatives-when-the-prefix-index-cannot-be-hit}

자주 사용하는 쿼리 조건에서 접두사 인덱스를 활용할 수 없다면, 예를 들어 자주 사용하는 필터 컬럼이 정렬 키의 접두사가 아니라면 다음 두 가지 방법을 고려하세요.

1. **[역색인](./inverted-index/overview.md) 생성**: 테이블에 여러 역색인을 생성하여 다양한 쿼리 조건에 사용되는 컬럼을 유연하게 지원할 수 있습니다.
2. **단일 테이블 구체화된 뷰(Duplicate 모델) 사용**: 컬럼 순서가 다르고 강한 일관성을 보장하는 단일 테이블 [동기 구체화된 뷰](../../query-acceleration/materialized-view/sync-materialized-view.md)를 생성하면 간접적으로 여러 접두사 인덱스 집합을 구현할 수 있습니다.

## 자주 묻는 질문 {#faq}

**Q1: 접두사 인덱스를 수동으로 생성해야 하나요?**

아니요. 테이블을 생성하면 Doris가 정렬 키의 처음 36바이트를 자동으로 접두사 인덱스로 사용합니다. 이를 위한 전용 DDL 구문은 없습니다.

**Q2: 하나의 테이블에 여러 접두사 인덱스 집합을 둘 수 있나요?**

아니요. 정렬 키는 하나뿐이므로 테이블에는 접두사 인덱스 집합도 하나만 둘 수 있습니다. 여러 집합이 필요하다면 역색인이나 구체화된 뷰를 사용하세요.

**Q3: 접두사 인덱스가 예상보다 훨씬 짧은 이유는 무엇인가요?**

가장 흔한 이유는 정렬 키의 앞부분에 `VARCHAR` 컬럼이 있어 절단 규칙이 적용되기 때문입니다. `BIGINT`, `INT`, `DATETIME` 같은 고정 길이 타입을 정렬 키의 앞부분에 배치하세요.

**Q4: 접두사 인덱스로 `LIKE` 쿼리나 텍스트 검색을 가속할 수 있나요?**

아니요. `LIKE` 퍼지 매칭에는 [NGram BloomFilter Index](./ngram-bloomfilter-index.md)를, 전문 검색에는 [역색인](./inverted-index/overview.md)을 사용하세요.
