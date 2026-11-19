---
{
    "title": "역색인(텍스트 검색)",
    "sidebar_label": "개요",
    "language": "ko",
    "description": "Doris 텍스트 검색은 역색인을 기반으로 하며, 전문 검색, 구문 일치, 정규식 일치, 사용자 지정 토큰화 및 BM25 관련성 점수를 지원합니다. 벡터 검색과 결합하여 RAG와 같은 하이브리드 검색 시나리오에 사용할 수 있습니다."
}
---

<!-- Knowledge type: Feature introduction + Quick start -->
<!-- Applicable scenarios: Keyword search / Phrase matching / RAG hybrid retrieval / Relevance ranking -->

텍스트 검색은 데이터 세트에서 특정 용어나 구문이 포함된 문서를 검색하고 관련성에 따라 결과 순위를 지정합니다.

| 검색 방법 | 강점 | 적용 시나리오 |
|----------|------|----------|
| 텍스트 검색 | "정확하게 찾기": 제어 가능하고 설명 가능한 정확한 일치로 키워드 적중과 필터 조건의 결정성을 보장 | 키워드 검색, 구문 일치, 부울 필터링 |
| 벡터 검색 | "폭넓게 찾기": 의미적 유사성을 사용해 검색 범위를 확장 | 의미 검색, 근사 일치 |

생성형 AI 애플리케이션, 특히 검색 증강 생성(RAG) 시나리오에서는 텍스트 검색과 벡터 검색이 서로 보완됩니다.

- 의미적 폭과 어휘적 정밀도의 균형 유지
- 결과의 정확성과 설명 가능성을 보장하면서 재현율 향상
- 함께 신뢰할 수 있는 검색 기반을 구축하여 대규모 언어 모델에 더 정확하고 관련성 높은 컨텍스트 제공

:::caution 4.1.5부터 V1 역색인 생성 금지

새 인덱스에는 V2 또는 V3을 사용하세요. 기존 V1 테이블은 계속 읽을 수 있지만, 역색인을 추가하거나 `ALTER TABLE`을 사용해 인덱스 스토리지 형식을 현재 위치에서 업그레이드할 수 없습니다. 대신 테이블을 다시 생성해야 합니다. 유효한 `inverted_index_storage_format` 구성이 `V1`로 남아 있으면 업그레이드 후 FE를 시작할 수 없습니다. 미리 `fe.conf`와 `fe_custom.conf`를 업데이트하세요. [4.1.5로 업그레이드](../../../admin-manual/cluster-management/upgrade.md)를 참조하세요.

:::

## Doris 텍스트 검색의 발전 {#evolution-of-text-search-in-doris}

2.0.0 버전부터 Doris는 고성능 전문 검색을 지원하기 위해 역색인을 도입했습니다. 검색 시나리오가 다양해지고 쿼리 복잡성이 증가함에 따라 Doris는 후속 릴리스에서 텍스트 검색 기능을 계속 확장해 왔습니다.

| 단계 | 버전 | 주요 기능 |
|------|------|----------|
| 기반 단계 | 2.0+ | 열 수준 역색인을 도입하고 기본 전문 검색 연산자(`MATCH_ANY`, `MATCH_ALL`)와 다국어 토크나이저를 제공하여 대규모 데이터 세트에서 효율적인 키워드 검색 지원 |
| 기능 확장 | 2.x~3.x | 연산자 시스템을 강화하고 구문 일치(`MATCH_PHRASE`), 접두사 검색(`MATCH_PHRASE_PREFIX`), 정규식 일치(`MATCH_REGEXP`)와 같은 고급 연산자를 추가했습니다. 3.1 버전에서는 사용자 지정 토큰화를 도입했습니다. |
| 기능 향상 | 4.0+ | BM25 관련성 점수와 통합 쿼리 진입점인 `SEARCH` 함수를 도입하여 텍스트 관련성 순위 지정과 하이브리드 순위 지정을 지원 |

4.0 이상 버전의 핵심 향상 기능은 다음과 같습니다.

- **BM25 관련성 점수**: `score()` 함수는 텍스트 관련성에 따라 결과 순위를 지정하며, 벡터 유사성 점수와 결합하여 하이브리드 순위 지정을 구현할 수 있습니다.
- **SEARCH 함수**: 통합 쿼리 DSL을 제공하고 열 간 쿼리와 부울 논리 조합을 지원합니다. 복잡한 쿼리 구성을 단순화하는 동시에 쿼리 성능을 더욱 향상합니다.

---

## Doris의 핵심 텍스트 검색 기능 {#core-text-search-features-in-doris}

### 1. 풍부한 텍스트 연산자 {#1-rich-text-operators}

Doris는 여러 검색 패턴을 포괄하는 전문 검색 연산자 집합을 제공하여 기본 키워드 일치부터 복잡한 구문 쿼리까지 다양한 요구를 충족합니다.

현재 버전에서 지원하는 주요 연산자는 다음과 같습니다.

| 연산자 | 설명 | 일반적인 시나리오 |
|------|------|----------|
| `MATCH_ANY` / `MATCH_ALL` | 임의의 용어 일치(OR) 및 모든 용어 일치(AND) | 일반 키워드 검색 |
| `MATCH_PHRASE` | 정확한 구문 일치. 사용자 지정 단어 간격(slop)과 순서 제어 지원 | 인접 단어 쿼리 |
| `MATCH_PHRASE_PREFIX` | 구문 접두사 일치 | 자동 완성, 증분 검색 |
| `MATCH_REGEXP` | 정규 표현식을 기반으로 한 일치 | 패턴 기반 텍스트 검색 |

이러한 연산자는 독립적으로 사용하거나 `SEARCH()` 함수를 통해 결합하여 복잡한 논리 쿼리를 구성할 수 있습니다. 예:

```sql
-- Exact phrase search
SELECT * FROM docs WHERE content MATCH_PHRASE 'inverted index';

-- Prefix search
SELECT * FROM docs WHERE content MATCH_PHRASE_PREFIX 'data ware';
```

[모든 연산자 보기](./search-operators.md)

---

### 2. 사용자 지정 토큰화(3.1+) {#2-custom-tokenization-31}

텍스트 검색에서 토큰화 방식은 검색 정밀도와 재현율을 직접 결정합니다. 3.1 버전부터 Doris는 **사용자 지정 분석기**를 지원하여 비즈니스 요구에 따라 토큰화 파이프라인을 유연하게 정의할 수 있습니다.

사용자 지정 토큰화는 다음 세 가지 유형의 구성 요소를 결합하여 세밀한 텍스트 제어를 구현합니다.

- **문자 필터(char_filter)**: 토큰화 전에 기호를 바꾸거나 제거하거나 정규화합니다.
- **토크나이저(tokenizer)**: 토큰화 알고리즘을 선택합니다. 다양한 언어와 구조의 텍스트를 처리하기 위해 `standard`, `ngram`, `edge_ngram`, `keyword`, `icu` 등의 유형을 지원합니다.
- **토큰 필터(token_filter)**: `lowercase`, `word_delimiter`, `ascii_folding` 등을 사용하여 토큰화 결과를 정규화하고 정제합니다.

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

### 3. BM25 관련성 점수(4.0+) {#3-bm25-relevance-scoring-40}

Doris는 텍스트 관련성을 계산하기 위해 **BM25(Best Matching 25)** 알고리즘을 구현하여 전문 검색에 순위 지정 및 점수 계산 기능을 제공합니다.

BM25의 핵심 특성은 다음과 같습니다.

- 용어 빈도(TF), 역문서 빈도(IDF), 문서 길이를 기반으로 하는 확률 모델
- 짧은 텍스트와 긴 텍스트 모두에 강건함
- `k1` 및 `b` 매개변수를 통해 가중치 전략 조정 가능

```sql
SELECT id, title, score() AS relevance
FROM docs
WHERE content MATCH_ANY 'real-time OLAP analytics'
ORDER BY relevance DESC
LIMIT 10;
```

[점수 계산 메커니즘 자세히 알아보기](./scoring.md)

---

### 4. SEARCH 함수: 통합 쿼리 진입점(4.0+) {#4-search-function-unified-query-entry-point-40}

`SEARCH()` 함수는 텍스트 검색을 위한 통합 구문 진입점을 제공하며, 여러 열 검색과 부울 논리 조합을 지원하므로 복잡한 쿼리를 더욱 간결하게 표현할 수 있습니다.

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
DISTRIBUTED BY HASH(id) BUCKETS 10;
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

RAG 애플리케이션에서 텍스트 검색과 벡터 유사성을 결합하면 더욱 포괄적인 검색이 가능합니다.

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

-- Compute-storage integrated mode: build the index for existing data
BUILD INDEX idx_content ON docs;
```

#### 컴퓨트-스토리지 분리 모드의 기존 데이터 {#cloud-index-build}

Doris 4.1.5에서는 위의 `parser="chinese"` 인덱스와 같은 토큰화된 역색인을 추가하면 스키마 변경 작업을 통해 기존 데이터가 빌드됩니다. 작업이 `FINISHED` 상태가 될 때까지 기다리세요. 해당 인덱스에는 별도의 `BUILD INDEX`가 필요하지 않습니다.

```sql
SHOW ALTER TABLE COLUMN WHERE TableName = 'docs';
```

토큰화되지 않은 역색인(`parser="none"`)과 NGram BloomFilter 인덱스의 경우 기본값인 `enable_add_index_for_new_data=false`도 스키마 변경을 통해 기존 데이터를 빌드합니다. 새 데이터에 먼저 인덱스를 추가한 후 기존 데이터를 별도로 백필하려면 이를 `true`로 설정하세요. 사용 가능한 컴퓨트 그룹이 있는 세션에서 다음 예를 실행합니다.

```sql
CREATE TABLE cloud_index_example (
    id INT,
    tag VARCHAR(64)
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1;

INSERT INTO cloud_index_example VALUES (1, 'doris'), (2, 'database');
SET enable_add_index_for_new_data = true;
CREATE INDEX idx_tag ON cloud_index_example(tag)
USING INVERTED PROPERTIES("parser" = "none");
BUILD INDEX ON cloud_index_example;
SHOW BUILD INDEX WHERE TableName = 'cloud_index_example';
```

빌드는 비동기적으로 실행됩니다. 기존 행에서 인덱스를 사용하기 전에 `SHOW BUILD INDEX`가 `FINISHED`를 보고할 때까지 기다리세요. 클라우드 구문에서는 인덱스 이름을 생략합니다. `BUILD INDEX idx_tag ON cloud_index_example`은 거부됩니다. 이 Doris 4.1.5 지침은 해당 버전에 존재하는 인덱스 형식을 설명하며, 최신 커널의 별도 SNII 빌드 경로는 다루지 않습니다.

### 인덱스 삭제 {#drop-an-index}

```sql
DROP INDEX idx_content ON docs;
```

### 인덱스 보기 {#view-indexes}

```sql
SHOW CREATE TABLE docs;
SHOW INDEX FROM docs;
```

## 자주 묻는 질문 {#inverted-index-faq}

### Doris 4.1.5는 일본어 토큰화와 오타 허용을 지원하나요? {#does-doris-415-support-japanese-tokenization-and-typo-tolerance}

Doris 4.1.5는 기본 제공 Kuromoji 토크나이저를 지원하지 않습니다. 대표적인 일본어 텍스트로 `icu` 또는 `unicode` 파서를 평가하고 `TOKENIZE()`로 출력을 확인하세요. 이러한 파서의 분할 방식은 Kuromoji 형태소 분석과 다릅니다. 더 최신 파서를 선택하기 전에 실제로 배포된 릴리스의 문서를 확인하세요.

[검색 연산자](./search-operators.md)는 접두사, 정규식 및 구문 slop 일치를 지원합니다. 이러한 기능은 편집 거리 기반 맞춤법 교정을 제공하지 않으므로 오타가 있는 용어가 사전의 가까운 용어로 자동 확장되지 않습니다.

## 추가 읽기 {#further-reading}

### 핵심 문서 {#core-documentation}

- [텍스트 검색 연산자](./search-operators.md): 전체 연산자 참조 및 쿼리 가속
- [SEARCH 함수](./search-function.md): 통합 쿼리 DSL 구문 및 예제
- [관련성 점수](./scoring.md): 관련성 순위 지정 알고리즘 및 사용법

### 고급 주제 {#advanced-topics}

- [사용자 지정 분석기](./custom-analyzer.md): 도메인별 토크나이저 및 필터 구축
- [벡터 검색](../vector-index/overview.md): 임베딩 벡터를 사용한 의미적 유사성 검색
