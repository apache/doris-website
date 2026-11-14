---
{
    "title": "관련성 점수 계산",
    "language": "ko",
    "description": "Doris 전문 검색은 BM25 알고리즘으로 쿼리 결과의 관련성 점수를 계산합니다. 단어 빈도, 역문서 빈도, 레코드 길이를 종합해 결과의 순위를 매기고 가장 관련성이 높은 콘텐츠를 먼저 반환합니다."
}
---

<!-- Knowledge type: Feature / Query usage -->
<!-- Applicable scenarios: Full-text search result ranking / Search relevance optimization -->

전문 검색 쿼리(예: `MATCH_ANY`, `MATCH_ALL`, `MATCH_PHRASE` 등)를 실행할 때는 가장 관련성이 높은 레코드를 먼저 반환하도록 ‘일치 정도’에 따라 결과를 정렬해야 하는 경우가 많습니다. Doris의 **관련성 점수 계산** 기능은 쿼리 조건에 따라 각 행에 숫자 점수를 부여합니다. 점수가 높을수록 관련성이 높습니다.

현재 Doris는 관련성 점수 계산의 기본 구현으로 **BM25 (Best Matching 25)** 알고리즘을 사용합니다.

**대표적인 사용 사례:**

- 검색 엔진 애플리케이션: 키워드를 기준으로 가장 관련성이 높은 문서 목록 반환
- 로그 분석: 관련성에 따라 정렬해 키워드와 가장 잘 일치하는 로그를 빠르게 찾기
- 콘텐츠 추천: 텍스트 유사도를 기준으로 우선순위를 둘 콘텐츠 선별
- 지식 베이스 검색: 질문과의 관련성에 따라 후보 답변의 순위를 매겨 반환

## 빠른 시작 {#quick-start}

다음 예제는 쿼리에서 관련성 점수를 계산하고 점수순으로 정렬하는 방법을 보여 줍니다.

```sql
SELECT *,
       score() AS relevance
FROM search_demo
WHERE content MATCH_ANY 'text search test'
ORDER BY relevance DESC
LIMIT 10;
```

실행하면 Doris가 BM25 알고리즘으로 각 행의 점수를 계산하고 관련성이 가장 높은 레코드 최대 10개를 반환합니다.

```text
+------+-----------------------------------+---------+--------------+-----------+
| id   | content                           | author  | publish_date | relevance |
+------+-----------------------------------+---------+--------------+-----------+
|    1 | Full text search engine test demo | Alice   | 2024-01-01   |  2.915228 |
|    7 | Text processing techniques        | Grace   | 2024-01-07   |  1.341931 |
|    5 | Performance test framework        | Eve     | 2024-01-05   |  1.341931 |
|    3 | Advanced search algorithms        | Charlie | 2024-01-03   |  1.341931 |
+------+-----------------------------------+---------+--------------+-----------+
```

## 활성화 조건 {#activation-conditions}

위와 같은 Top-N 점수 계산 형식을 사용하려면 `score()`를 계산하는 `SELECT`가 다음 세 가지 조건을 모두 충족해야 합니다.

1. `SELECT` 절에서 `score()` 함수를 명시적으로 호출해야 합니다.
2. 해당 `WHERE` 절에 `MATCH_*` 또는 `SEARCH` 조건이 하나 이상 있어야 합니다.
3. `ORDER BY`의 정렬 키가 점수 별칭 하나여야 하며 `LIMIT`도 있어야 합니다.

Doris 4.0.x와 4.1.0부터 4.1.5까지는 이 Top-N 형식이 필요합니다.

### 관련성 점수로 필터링 {#filter-by-relevance-score}

먼저 토큰화된 역색인이 있는 별도의 예제 테이블을 준비합니다. 데이터베이스와 테이블을 생성하고, 데이터를 적재하고, 쿼리할 권한이 있는 상태에서 다음 문을 실행하세요.

```sql
CREATE DATABASE IF NOT EXISTS score_filter_example;
USE score_filter_example;

CREATE TABLE score_filter_demo (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED
        PROPERTIES("parser" = "english", "support_phrase" = "true")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO score_filter_demo VALUES
(1, 'Full text search engine test demo'),
(2, 'Database performance analysis'),
(3, 'Search engine examples');
```

Doris 4.0.4부터는 `WHERE`에서 최소 점수를 직접 필터링할 수 있습니다. 다음 Top-N 형식은 Doris 4.0.4 이상에서 사용할 수 있습니다.

```sql
SELECT *, score() AS relevance
FROM score_filter_demo
WHERE content MATCH_ANY 'text search test'
  AND score() > 5
ORDER BY relevance DESC
LIMIT 10;
```

이 쿼리는 일치하는 행 중 점수가 5보다 높은 행을 최대 10개까지 점수 내림차순으로 반환합니다. 임계값을 넘는 행이 없으면 결과는 비어 있습니다. 점수는 쿼리와 데이터 집합에 따라 달라지므로 5는 예시 임계값일 뿐입니다.

`WHERE`에서는 `score()` 자체를 사용하고, `ORDER BY`에서는 SELECT 목록의 점수 별칭을 사용하세요. 직접 필터링은 최소 점수 조건 하나만 지원하며, 형식은 `score() > <threshold>` 또는 `score() >= <threshold>`입니다. 임계값은 숫자 리터럴이어야 합니다. 검색 조건과는 `AND`로 결합하세요. 상한 조건(`<`, `<=`), 동등 조건(`=`), 여러 점수 조건, `OR` 안에 중첩된 점수 조건은 지원하지 않습니다.

#### Doris 4.0.0부터 4.0.3까지의 호환 방식 {#compatibility-with-doris-400-to-403}

Doris 4.0.0부터 4.0.3까지는 `WHERE`에서 `score()`를 사용할 수 없습니다. 이 버전에서는 먼저 서브쿼리에서 점수가 계산된 후보를 제한된 개수만큼 선택하세요. `MATCH_*` 조건, 점수 별칭을 기준으로 하는 `ORDER BY`, `LIMIT`를 모두 서브쿼리 안에 넣은 다음 바깥 쿼리에서 별칭으로 필터링합니다.

```sql
SELECT a.*
FROM (
    SELECT *, score() AS relevance
    FROM score_filter_demo
    WHERE content MATCH_ANY 'text search test'
    ORDER BY relevance DESC
    LIMIT 1000
) AS a
WHERE a.relevance > 5
ORDER BY a.relevance DESC
LIMIT 10;
```

이 쿼리는 점수가 가장 높은 후보 1000개 중에서 점수가 5보다 높은 행을 최대 10개 반환합니다. 해당 후보 중 임계값을 넘는 행이 없으면 결과는 비어 있습니다. 애플리케이션에 맞게 후보 개수 제한을 정하세요. 이 방식은 후보 집합을 필터링하므로 임계값을 넘는 모든 일치 행을 반환하는 것은 아닙니다.

Doris 4.0.0부터 4.0.3까지는 내부 `LIMIT`를 유지하세요. 이 절이 없으면 내부 쿼리가 필수 Top-N 형태를 갖추지 못하고, 옵티마이저가 바깥 쿼리의 점수 조건을 점수 계산 쿼리 안으로 이동할 수 있습니다. 바깥 쿼리의 `ORDER BY`와 `LIMIT`만으로는 필요한 내부 Top-N 연산을 충족할 수 없습니다.

### 지원하는 인덱스 유형 {#supported-index-types}

| 인덱스 유형 | 점수 계산 지원 | 설명 |
| ---------- | -------------- | ---- |
| 토큰화된 역색인 | 예 | BM25 관련성 점수를 계산할 수 있음 |
| 토큰화되지 않은 역색인 | 아니요 | 정확히 일치하는 항목만 검색하며 점수는 계산하지 않음 |

### 지원하는 쿼리 유형 {#supported-query-types}

- `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `SEARCH`

## BM25 알고리즘 {#bm25-algorithm}

BM25는 확률 모델에 기반한 텍스트 관련성 알고리즘입니다. **단어 빈도(TF)**, **역문서 빈도(IDF)**, **레코드 길이**라는 세 요소를 함께 고려해 일치하는 결과에 가중 점수를 계산합니다. 기존 TF-IDF 모델과 비교하면 BM25는 견고성과 조정 가능성이 더 높으며, 긴 텍스트와 짧은 텍스트 사이의 점수 차이를 효과적으로 조절합니다.

### 핵심 공식 {#core-formula}

```text
score = IDF × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × |d| / avgdl))
```

공식에 사용된 변수의 의미는 다음과 같습니다.

| 변수 | 의미 |
| ---- | ---- |
| `tf` | 현재 행에서 쿼리 단어가 나타나는 횟수 |
| `IDF` | 단어가 얼마나 드문지를 나타내는 역문서 빈도 |
| `\|d\|` | 현재 행의 길이(토큰화한 뒤의 토큰 수) |
| `avgdl` | 테이블에 있는 모든 행의 평균 길이 |
| `k1`, `b` | 알고리즘 조정 매개변수 |

### 매개변수 {#parameters}

| 매개변수 | 기본값 | 설명 |
| -------- | ------ | ---- |
| `k1` | 1.2 | 단어 빈도가 점수에 미치는 영향의 크기를 제어 |
| `b` | 0.75 | 레코드 길이 정규화의 강도를 제어 |
| `boost` | 1.0 | 쿼리 수준의 가중치 계수 |

### 보조 통계량 {#auxiliary-statistics}

```text
IDF   = log(1 + (N - n + 0.5) / (n + 0.5))
avgdl = total_terms / total_rows
```

여기서:

- `N`: 테이블의 전체 행 수
- `n`: 쿼리 단어가 포함된 행 수

쿼리에 여러 단어가 포함되면 **최종 점수는 각 단어 점수의 합**입니다.

### 레코드 길이와 `norms` 속성 {#record-length-and-the-norms-property}

`norms` 인덱스 속성과 `inverted_index_skip_norms_for_variant` BE 설정은 Doris 4.1.5부터 지원됩니다.

`|d|` 값은 norms에서 가져옵니다. norms는 해당 필드에 값이 없는 행을 포함해 인덱싱된 필드마다 행당 한 바이트를 사용합니다. 토큰화된 인덱스는 기본적으로 norms를 기록하지만(`"norms" = "true"`), 토큰화되지 않은 인덱스는 기록하지 않습니다. 필터링에만 사용하는 인덱스에서는 공간을 절약하도록 `"norms" = "false"`로 설정하세요.

```sql
INDEX idx_content(content) USING INVERTED PROPERTIES("parser" = "english", "norms" = "false")
```

VARIANT 하위 경로는 인덱스의 `norms` 속성을 상속하며, 행 수 × 경로 수 바이트의 공간을 사용합니다. BE 설정인 `inverted_index_skip_norms_for_variant`를 `true`로 설정하면 모든 VARIANT 경로 인덱스에서 norms가 비활성화되며 인덱스 속성보다 우선합니다. 이 설정의 기본값은 `false`이고 실행 중에도 변경할 수 있습니다.

norms를 비활성화해도 `MATCH_*` 필터링에는 영향이 없지만, `score()`가 norms가 없는 세그먼트를 하나라도 읽으면 오류가 발생합니다. 이러한 설정은 새로 기록되는 세그먼트에만 적용되며, 기존 세그먼트는 compaction으로 다시 기록될 때까지 그대로 유지됩니다. 설정을 변경하기 전에 모든 BE를 해당 설정을 지원하는 버전으로 업그레이드하세요.

## 결과 해석 {#interpreting-the-results}

점수 계산 결과를 이해하면 관련성 순위를 더 정확하게 활용할 수 있습니다.

| 특성 | 설명 |
| ---- | ---- |
| 점수 범위 | 고정된 상한이 없는 양수입니다. 일반적으로 절댓값보다 상대적인 크기가 중요합니다. |
| 여러 단어가 포함된 쿼리 | 여러 단어가 포함되면 총점은 각 단어 점수의 합입니다. |
| 길이의 영향 | 일치하는 단어가 같다면 짧은 레코드가 약간 더 높은 점수를 받습니다. |
| 일치하는 단어가 없음 | 쿼리 단어가 테이블에 나타나지 않으면 해당 점수는 0입니다. |

## 자주 묻는 질문 {#faq}

**Q1: 쿼리가 점수를 반환하지 않는 이유는 무엇인가요?**

다음 항목을 순서대로 확인하세요.

1. `SELECT`에서 `score()` 함수를 호출했는지 확인합니다.
2. 동일한 `SELECT`의 `WHERE`에 `MATCH_*` 또는 `SEARCH` 조건이 있는지 확인합니다.
3. Top-N 형식이라면 `ORDER BY`가 점수 별칭을 참조하고 쿼리에 `LIMIT`가 있는지 확인합니다.
4. 인덱스가 토큰화된 역색인인지 확인합니다.

**Q2: BM25와 TF-IDF의 차이는 무엇인가요?**

BM25는 TF-IDF를 바탕으로 **단어 빈도 포화**와 **길이 정규화**라는 두 가지 개선 사항을 도입합니다. 이를 통해 긴 텍스트와 짧은 텍스트의 점수 균형을 개선하고 견고성을 높입니다.

**Q3: 서로 다른 쿼리의 점수를 비교할 수 있나요?**

권장하지 않습니다. BM25 점수는 구체적인 쿼리 단어와 테이블의 데이터 분포에 따라 달라집니다. 서로 다른 쿼리의 점수 절댓값은 비교할 수 없습니다. **상대적인 점수 크기는 동일한 쿼리의 결과 집합 안에서만 비교하세요.**
