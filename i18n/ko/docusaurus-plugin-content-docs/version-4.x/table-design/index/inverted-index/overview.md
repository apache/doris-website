---
{
    "title": "역색인(텍스트 검색)",
    "sidebar_label": "개요",
    "language": "ko",
    "description": "Doris의 텍스트 검색은 역색인을 기반으로 하며 전문 검색, 구문 일치, 정규식 일치, 사용자 지정 토큰화 및 BM25 관련도 점수 계산을 지원합니다. 벡터 검색과 결합하여 RAG와 같은 하이브리드 검색 시나리오에 활용할 수 있습니다."
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

텍스트 검색은 데이터 세트에서 특정 용어나 구문이 포함된 문서를 검색하고 관련도에 따라 결과의 순위를 매깁니다.

| 검색 방식 | 장점 | 활용 시나리오 |
|----------|------|----------|
| 텍스트 검색 | "정확하게 찾기": 제어 가능하고 설명 가능한 정확 일치 검색으로, 키워드 일치 여부와 필터 조건을 명확하게 판별 | 키워드 검색, 구문 일치, 불리언 필터링 |
| 벡터 검색 | "폭넓게 찾기": 의미적 유사성을 사용하여 검색 범위를 확장 | 의미 검색, 근사 일치 |

생성형 AI 애플리케이션, 특히 검색 증강 생성(RAG) 시나리오에서 텍스트 검색과 벡터 검색은 서로를 보완합니다.

- 의미적 검색 범위와 어휘적 정확성 사이의 균형 유지
- 결과의 정확성과 설명 가능성을 보장하면서 재현율 향상
- 대규모 언어 모델에 더 정확하고 관련성 높은 컨텍스트를 제공하는 신뢰할 수 있는 검색 기반 구축

:::caution 4.1.5부터 V1 역색인 생성 금지

새 인덱스에는 V2 또는 V3를 사용하세요. 기존 V1 테이블은 계속 읽을 수 있지만, `ALTER TABLE`로 역색인을 추가하거나 인덱스 저장 형식을 제자리에서 업그레이드할 수는 없습니다. 대신 테이블을 다시 생성하세요. 업그레이드 후에도 유효한 `inverted_index_storage_format` 설정이 `V1`으로 남아 있으면 FE가 시작되지 않습니다. 미리 `fe.conf`와 `fe_custom.conf`를 업데이트하세요. [4.1.5로 업그레이드](../../../admin-manual/cluster-management/upgrade.md)를 참고하세요.

:::

## Doris의 텍스트 검색 발전 과정 {#evolution-of-text-search-in-doris}

Doris는 2.0.0 버전부터 역색인을 도입하여 고성능 전문 검색을 지원하기 시작했습니다. 검색 시나리오가 다양해지고 쿼리의 복잡성이 높아짐에 따라, 이후 버전에서도 텍스트 검색 기능을 지속적으로 확장해 왔습니다.

| 단계 | 버전 | 주요 기능 |
|------|------|----------|
| 기반 구축 | 2.0+ | 컬럼 수준의 역색인 도입. 기본 전문 검색 연산자(`MATCH_ANY`, `MATCH_ALL`)와 다국어 토크나이저를 제공하여 대규모 데이터 세트에서 효율적인 키워드 검색 지원 |
| 기능 확장 | 2.x에서 3.x | 연산자 체계를 강화하고 구문 일치(`MATCH_PHRASE`), 접두사 검색(`MATCH_PHRASE_PREFIX`), 정규식 일치(`MATCH_REGEXP`) 등의 고급 연산자 추가. 3.1 버전에서 사용자 지정 토큰화 도입 |
| 기능 강화 | 4.0+ | BM25 관련도 점수 계산과 통합 쿼리 진입점인 `SEARCH` 함수를 도입하여 텍스트 관련도 순위 지정 및 하이브리드 순위 지정 지원 |

4.0+의 핵심 개선 사항은 다음과 같습니다.

- **BM25 관련도 점수 계산**: `score()` 함수는 텍스트 관련도에 따라 결과의 순위를 매기며, 벡터 유사도 점수와 결합하여 하이브리드 순위 지정을 구현할 수 있습니다.
- **SEARCH 함수**: 여러 컬럼에 걸친 쿼리와 불리언 논리 조합을 지원하는 통합 쿼리 DSL을 제공합니다. 복잡한 쿼리를 더 쉽게 작성할 수 있으며 쿼리 성능도 향상됩니다.

---

## Doris의 핵심 텍스트 검색 기능 {#core-text-search-features-in-doris}

### 1. 다양한 텍스트 연산자 {#1-rich-text-operators}

Doris는 다양한 검색 패턴을 처리하는 전문 검색 연산자를 제공하여 기본적인 키워드 일치부터 복잡한 구문 쿼리까지 폭넓은 요구 사항을 충족합니다.

현재 버전에서 지원하는 주요 연산자는 다음과 같습니다.

| 연산자 | 설명 | 일반적인 시나리오 |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | 용어 중 하나라도 일치(OR) 및 모든 용어 일치(AND) | 일반적인 키워드 검색 |
| `MATCH_PHRASE` | 사용자 지정 slop 및 순서 제어를 지원하는 정확한 구문 일치 | 인접 단어 쿼리 |
| `MATCH_PHRASE_PREFIX` | 구문 접두사 일치 | 자동 완성, 증분 검색 |
| `MATCH_REGEXP` | 정규식 기반 일치 | 패턴 기반 텍스트 검색 |

이 연산자들은 독립적으로 사용하거나 `SEARCH()` 함수를 통해 조합하여 복잡한 논리 쿼리를 구성할 수 있습니다. 예를 들면 다음과 같습니다. 여기서 참조하는 `docs` 테이블은 아래 [빠른 시작](#quick-start) 섹션에서 생성하는 테이블입니다.

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[모든 연산자 보기](./search-operators.md)

---

### 2. 사용자 지정 토큰화 (3.1+) {#2-custom-tokenization-31}

텍스트 검색에서 토큰화 방식은 검색 정밀도와 재현율을 직접 결정합니다. Doris는 3.1 버전부터 **사용자 지정 분석기**를 지원하여 비즈니스 요구 사항에 맞게 토큰화 파이프라인을 유연하게 정의할 수 있습니다.

사용자 지정 토큰화는 다음 세 가지 유형의 구성 요소를 조합하여 텍스트를 세밀하게 제어합니다.

- **문자 필터(char_filter)**: 토큰화 전에 기호를 대체, 제거 또는 정규화합니다.
- **토크나이저(tokenizer)**: 토큰화 알고리즘을 선택합니다. 서로 다른 언어와 구조의 텍스트를 처리할 수 있도록 `standard`, `ngram`, `edge_ngram`, `keyword`, `icu` 등의 유형을 지원합니다.
- **토큰 필터(token_filter)**: `lowercase`, `word_delimiter`, `ascii_folding` 등을 사용하여 토큰화 결과를 정규화하고 다듬습니다.

```sql
-- Example: Define a custom analyzer
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES (
    "tokenizer" = "keyword",
    "token_filter" = "asciifolding, lowercase"
);

-- Use the custom analyzer when creating a table
CREATE TABLE docs (
    id BIGINT,
    content TEXT,
    INDEX idx_content (content) USING INVERTED PROPERTIES(
        "analyzer" = "keyword_lowercase",
        "support_phrase" = "true"
    )
);
```

[사용자 지정 토큰화 알아보기](./custom-analyzer.md)

---

### 3. BM25 관련도 점수 계산 (4.0+) {#3-bm25-relevance-scoring-40}

Doris는 텍스트 관련도 계산을 위해 **BM25 (Best Matching 25)** 알고리즘을 구현하여 전문 검색에 순위 지정 및 점수 계산 기능을 제공합니다.

BM25의 주요 특징은 다음과 같습니다.

- 용어 빈도(TF), 역문서 빈도(IDF), 문서 길이에 기반한 확률 모델
- 짧은 텍스트와 긴 텍스트 모두에서 안정적으로 작동
- `k1` 및 `b` 매개변수를 통해 가중치 전략 조정 가능

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[점수 계산 방식 자세히 알아보기](./scoring.md)

---

### 4. SEARCH 함수: 통합 쿼리 진입점 (4.0+) {#4-search-function-unified-query-entry-point-40}

`SEARCH()` 함수는 텍스트 검색을 위한 통합 구문 진입점을 제공합니다. 여러 컬럼에 걸친 검색과 불리언 논리 조합을 지원하므로 복잡한 쿼리를 더 간결하게 표현할 수 있습니다.

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE SEARCH('title:Machine AND tags:ANY(database sql)')
ORDER BY relevance DESC
LIMIT 20;
```

[SEARCH 함수 전체 가이드](./search-function.md)

---

## 빠른 시작 {#quick-start}

### 1단계: 역색인이 있는 테이블 생성 {#step-1-create-a-table-with-inverted-indexes}

```sql
CREATE TABLE docs (
    id BIGINT,
    title STRING,
    content STRING,
    category STRING,
    tags ARRAY<STRING>,
    created_at DATETIME,
    -- Text search indexes
    INDEX idx_title(title) USING INVERTED PROPERTIES ("parser" = "chinese"),
    INDEX idx_content(content) USING INVERTED PROPERTIES ("parser" = "chinese", "support_phrase" = "true"),
    INDEX idx_category(category) USING INVERTED,
    INDEX idx_tags(tags) USING INVERTED
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES ("replication_num" = "1");
```

### 2단계: 텍스트 쿼리 실행 {#step-2-run-text-queries}

```sql
-- Simple keyword search
SELECT * FROM docs WHERE content MATCH_ANY 'apache doris';

-- Phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'full-text search';

-- Boolean query with SEARCH
SELECT * FROM docs
WHERE SEARCH('title:apache AND (category:database OR tags:ANY(sql nosql))');

-- Relevance-based ranking
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time analytics OLAP'
ORDER BY relevance DESC
LIMIT 10;
```

## 하이브리드 검색: 텍스트 + 벡터 {#hybrid-search-text--vector}

RAG 애플리케이션에서 텍스트 검색과 벡터 유사도를 결합하면 더 폭넓은 검색이 가능합니다.

```sql
-- Hybrid retrieval: semantic similarity + keyword filtering
SELECT id, title, score() AS text_relevance
FROM docs
WHERE
    -- Vector filter for semantic similarity
    cosine_distance(embedding, [0.1, 0.2, ...]) < 0.3
    -- Text filter for keyword constraints
    AND SEARCH('title:search AND content:engine AND category:technology')
ORDER BY text_relevance DESC
LIMIT 10;
```

## 역색인 관리 {#managing-inverted-indexes}

### 인덱스 생성 {#create-an-index}

```sql
-- Create at table creation time
CREATE TABLE t (
    content STRING,
    INDEX idx(content) USING INVERTED PROPERTIES ("parser" = "chinese")
);

-- Create on an existing table
CREATE INDEX idx_content ON docs(content) USING INVERTED PROPERTIES ("parser" = "chinese");

-- Build the index for existing data
BUILD INDEX idx_content ON docs;
```

### 인덱스 삭제 {#drop-an-index}

```sql
DROP INDEX idx_content ON docs;
```

### 인덱스 조회 {#view-indexes}

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## 추가 자료 {#further-reading}

### 핵심 문서 {#core-documentation}

- [텍스트 검색 연산자](./search-operators.md): 전체 연산자 참조 및 쿼리 가속
- [SEARCH 함수](./search-function.md): 통합 쿼리 DSL 구문 및 예제
- [관련도 점수 계산](./scoring.md): 관련도 순위 지정 알고리즘 및 사용법

### 고급 주제 {#advanced-topics}

- [사용자 지정 분석기](./custom-analyzer.md): 도메인에 특화된 토크나이저와 필터 구성
- [벡터 검색](../vector-index/overview.md): 임베딩 벡터를 사용한 의미적 유사도 검색
