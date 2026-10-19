---
{
    "title": "전문 검색 및 쿼리 가속 연산자",
    "language": "ko",
    "description": "Apache Doris 역색인에서 지원하는 전문 검색 및 쿼리 가속 연산자 참조 문서입니다. MATCH_ANY/ALL/PHRASE/REGEXP를 포함한 8개의 검색 연산자로 키워드, 구문, 접두사, 정규식 검색을 지원하며, 동등 비교, 범위, 배열 조건을 사용하는 구조화된 쿼리를 가속합니다."
}
---

<!-- Knowledge type: Operator reference / Usage examples -->
<!-- Applicable scenarios: Full-text search query authoring / Inverted index query acceleration -->

이 문서에서는 Apache Doris 역색인에서 지원하는 쿼리 연산자를 두 가지 범주로 나누어 소개합니다.

- **전문 검색 연산자**: 텍스트 필드에서 키워드, 구문, 접두사, 정규식 등의 퍼지 매칭에 사용합니다.
- **역색인 쿼리 가속**: 구조화된 필드에서 동등 비교, 범위, 집합, 배열 등의 조건으로 정확하게 필터링하는 데 사용합니다.

## 전문 검색 연산자 {#full-text-search-operators}

다음 테이블은 모든 전문 검색 연산자와 대표적인 사용 사례를 보여 줍니다.

| 연산자 | 대표적인 사용 사례 | 매칭 규칙 |
|------|----------|----------|
| `MATCH_ANY` | 키워드 "OR" 검색 | 키워드 중 하나라도 일치하면 매칭 |
| `MATCH_ALL` | 키워드 "AND" 검색 | 모든 키워드가 일치해야 매칭 |
| `MATCH_PHRASE` | 엄격한 구문 검색 | 검색어가 서로 인접하고 순서도 같아야 함 |
| `MATCH_PHRASE` (slop 사용) | 오차를 허용하는 구문 검색 | 검색어 사이에 간격 허용 |
| `MATCH_PHRASE` (엄격한 순서) | 검색어 순서가 고정된 구문 검색 | 허용된 간격 범위 내에서 검색어 순서가 고정됨 |
| `MATCH_PHRASE_PREFIX` | 입력 제안 / 접두사 자동 완성 | 마지막 검색어를 접두사로 매칭 |
| `MATCH_REGEXP` | 검색어 단위 정규식 매칭 | 토큰화 결과에 정규식 적용 |
| `MATCH_PHRASE_EDGE` | 양 끝부분 퍼지 매칭 | 첫 검색어는 접미사 매칭 + 중간 검색어는 정확한 매칭 + 마지막 검색어는 접두사 매칭 |

### 키워드 검색: MATCH_ANY / MATCH_ALL {#keyword-search-match_any--match_all}

여러 키워드가 주어졌을 때 해당 단어가 포함된 문서를 찾는 경우에 적합합니다.

- **MATCH_ANY**: 키워드 중 하나라도 포함된 행을 매칭합니다.

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ANY 'keyword1 keyword2';
    ```

- **MATCH_ALL**: 모든 키워드가 동시에 포함된 행을 매칭합니다.

    ```sql
    SELECT * FROM table_name WHERE content MATCH_ALL 'keyword1 keyword2';
    ```

### 구문 검색: MATCH_PHRASE 계열 {#phrase-search-match_phrase-family}

키워드가 서로 인접하거나 검색어 순서를 유지해야 하는 정확한 구문 매칭에 적합합니다.

#### 엄격한 구문 매칭 {#strict-phrase-matching}

검색어가 서로 인접하고 순서도 같아야 합니다. 인덱스 가속을 활성화하려면 인덱스 속성에 `"support_phrase" = "true"`를 설정합니다.

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2';
```

#### Slop을 사용한 구문 매칭 {#phrase-matching-with-slop}

키워드 사이에 최대 `slop`개의 단어를 허용하며, 검색어 순서는 달라도 됩니다.

```sql
-- Allow up to 3 words between keyword1 and keyword2
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3';
```

#### 엄격한 순서의 구문 매칭 {#strict-order-phrase-matching}

`+`를 slop과 함께 사용하면 검색어 순서가 고정되어야 합니다.

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE 'keyword1 keyword2 ~3+';
```

### 접두사 및 끝부분 매칭 {#prefix-and-edge-matching}

입력 제안이나 접두사/접미사 퍼지 매칭 등에 적합합니다.

#### MATCH_PHRASE_PREFIX {#match_phrase_prefix}

마지막 단어를 접두사로 매칭하는 구문 매칭입니다. 단어가 하나만 주어지면 해당 단어의 접두사 매칭으로 동작합니다.

```sql
-- The last word matches by prefix
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1 key';

-- A single word degenerates into a prefix match
SELECT * FROM table_name WHERE content MATCH_PHRASE_PREFIX 'keyword1';
```

#### MATCH_PHRASE_EDGE {#match_phrase_edge}

구문의 양 끝부분을 매칭하며, 다음 규칙을 따릅니다.

- 첫 번째 단어는 **접미사**로 매칭합니다.
- 중간 단어는 **정확한 매칭**을 사용합니다.
- 마지막 단어는 **접두사**로 매칭합니다.
- 검색어는 서로 인접해야 합니다.

```sql
SELECT * FROM table_name WHERE content MATCH_PHRASE_EDGE 'search engine optim';
```

### 정규식 매칭: MATCH_REGEXP {#regex-matching-match_regexp}

토큰화된 검색어에 정규식 매칭을 수행합니다.

```sql
SELECT * FROM table_name WHERE content MATCH_REGEXP '^key_word.*';
```

## USING ANALYZER로 분석기 지정 {#specifying-an-analyzer-with-using-analyzer}

하나의 컬럼에 서로 다른 분석기를 사용하는 역색인이 여러 개 생성되어 있으면, `USING ANALYZER` 절로 쿼리 시 사용할 분석기를 지정할 수 있습니다.

### 구문 {#syntax}

```sql
SELECT * FROM table_name WHERE column MATCH 'keywords' USING ANALYZER analyzer_name;
```

### 지원하는 연산자 {#supported-operators}

모든 MATCH 연산자는 `USING ANALYZER` 절을 지원합니다.

- `MATCH` / `MATCH_ANY`
- `MATCH_ALL`
- `MATCH_PHRASE`
- `MATCH_PHRASE_PREFIX`
- `MATCH_PHRASE_EDGE`
- `MATCH_REGEXP`

### 내장 분석기 {#built-in-analyzers}

| 이름 | 설명 |
|------|------|
| `none` | 토큰화 없이 정확한 매칭 수행 |
| `standard` | 표준 토큰화 |
| `chinese` | 중국어 토큰화 |

### 사용 예시 {#usage-examples}

```sql
-- Use the standard analyzer (tokenizes the text)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER std_analyzer;

-- Use the keyword analyzer (exact match, no tokenization)
SELECT * FROM articles WHERE content MATCH 'hello world' USING ANALYZER kw_analyzer;

-- Combined with MATCH_PHRASE
SELECT * FROM articles WHERE content MATCH_PHRASE 'hello world' USING ANALYZER std_analyzer;

-- Use built-in analyzers
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
```

### 참고 사항 {#notes}

- 지정한 분석기의 인덱스가 아직 구축되지 않았다면 쿼리는 자동으로 인덱스를 사용하지 않는 실행 경로로 전환됩니다. 결과는 정확하지만 성능은 느려집니다.
- 분석기를 지정하지 않으면 시스템은 사용 가능한 인덱스 중 하나를 사용합니다.

## 역색인 쿼리 가속 {#inverted-index-query-acceleration}

역색인은 전문 검색뿐 아니라 구조화된 필드의 정확한 필터링도 가속할 수 있습니다. 지원하는 연산자와 함수는 다음과 같습니다.

| 범주 | 연산자 / 함수 |
|------|---------------|
| 동등 비교 및 집합 | `=`, `!=`, `IN`, `NOT IN` |
| 범위 | `>`, `>=`, `<`, `<=`, `BETWEEN` |
| NULL 검사 | `IS NULL`, `IS NOT NULL` |
| 배열 | `array_contains`, `array_overlaps` |

사용 예시:

```sql
-- Range query
SELECT * FROM t WHERE price >= 100 AND price < 200;

-- Set query
SELECT * FROM t WHERE tags IN ('a', 'b', 'c');

-- Array query
SELECT * FROM t WHERE array_contains(attributes, 'color');
```
