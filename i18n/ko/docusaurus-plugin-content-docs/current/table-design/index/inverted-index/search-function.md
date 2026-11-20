---
{
    "title": "SEARCH 함수",
    "language": "ko",
    "description": "Apache Doris 4.0에서 제공하는 SEARCH 함수는 통합 전문 검색 진입점입니다. 간결한 DSL 표현식으로 쿼리 조건을 설명하고 역색인을 기반으로 용어, 구문, 부울, 와일드카드 및 정규식 검색을 효율적으로 실행합니다."
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

`SEARCH` 함수는 Apache Doris 4.0 버전부터 제공되는 통합 전문 검색 쿼리 진입점입니다. 간결한 DSL(도메인별 언어)로 쿼리 조건을 설명하고 역색인을 기반으로 효율적으로 실행합니다.

`SEARCH`는 부울 값을 반환하는 조건자 함수입니다. `WHERE` 절의 필터 조건으로 사용할 수 있습니다. 텍스트 일치 규칙을 설명하는 SEARCH DSL 문자열을 받아 일치 가능한 조건을 역색인으로 푸시다운하여 실행합니다.

**일반적인 사용 사례:**

- 텍스트 필드에서 용어, 구문 및 부울 조합 검색 수행
- 여러 열에 걸친 결합 검색 실행
- 패턴 일치에 와일드카드 또는 정규식 사용
- VARIANT 하위 열에서 구조화된 텍스트 검색 수행
- Lucene/Elasticsearch query_string 구문 스타일과의 호환성 유지

## 구문 {#syntax}

### 기본 호출 형식 {#basic-invocation-forms}

```sql
SEARCH('<search_expression>')
SEARCH('<search_expression>', '<default_field>')
SEARCH('<search_expression>', '<default_field>', '<default_operator>')
```

**매개변수 설명:**

| 매개변수 | 필수 여부 | 설명 |
| --- | --- | --- |
| `<search_expression>` | 필수 | SEARCH DSL 쿼리 표현식(문자열 리터럴) |
| `<default_field>` | 선택 사항 | DSL의 용어가 필드를 명시적으로 지정하지 않을 때 자동으로 적용되는 열 이름 |
| `<default_operator>` | 선택 사항 | 여러 용어 표현식에 사용할 기본 부울 연산자. `and` 또는 `or`만 허용되며(대소문자 구분 없음) 기본값은 `or`입니다. |

**사용 참고:**

- **위치**: `WHERE` 절에서 조건자로 사용되어 행 필터링에 참여
- **반환 유형**: NULL을 허용하지 않는 BOOLEAN(일치하면 TRUE, 그렇지 않으면 FALSE)

`default_field`를 지정하면 Doris는 필드가 없는 용어나 함수를 해당 필드로 자동 확장합니다. 예를 들면 다음과 같습니다.

- `SEARCH('foo bar', 'tags', 'and')`는 `SEARCH('tags:ALL(foo bar)')`와 같습니다.
- `SEARCH('foo bar', 'tags')`는 `tags:ANY(foo bar)`로 확장됩니다.

DSL에 명시적으로 나타나는 부울 연산은 가장 높은 우선순위를 가지며 기본 연산자를 재정의합니다.

### Options 매개변수(JSON 형식) {#options-parameter-json-format}

두 번째 매개변수는 고급 구성을 위한 JSON 문자열일 수도 있습니다.

```sql
SEARCH('<search_expression>', '<options_json>')
```

**지원되는 옵션:**

| 옵션 | 유형 | 설명 |
| --- | --- | --- |
| `default_field` | string | 필드를 명시하지 않은 용어에 사용되는 기본 열 이름 |
| `default_operator` | string | 여러 용어 표현식의 기본 연산자(`and` 또는 `or`) |
| `mode` | string | `standard`(기본값) 또는 `lucene` |
| `minimum_should_match` | integer | SHOULD 절의 최소 일치 수(Lucene 모드만 해당) |
| `fields` | array of strings | 선택 사항. 명시적 필드가 없는 용어의 대상 열을 지정하며, 비어 있지 않은 `default_field`와 상호 배타적 |
| `type` | string | 선택 사항. 다중 필드 확장 방식인 `best_fields`(기본값) 또는 `cross_fields`; 점수 계산이나 정렬 알고리즘을 선택하지 않음 |

**예시:**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL 및 이진 일치 {#null-and-three-valued-logic}

**버전:** 아래의 이진 일치 규칙, NULL/NOT 예시 및 VARIANT 인덱스 오류 동작은 Doris 4.2부터 적용됩니다.

`SEARCH`는 NULL을 허용하지 않는 BOOLEAN을 반환합니다. 일치하면 TRUE, 일치하지 않으면 FALSE입니다. 일반 용어는 NULL 값이나 저장소에서 존재하지 않는 것으로 확인된 VARIANT 경로와 일치하지 않습니다. SEARCH는 UNKNOWN을 전파하지 않습니다.

standard 모드에서 `AND`는 일치 집합의 교집합을, `OR`는 합집합을, `NOT`은 쿼리에서 볼 수 있는 행을 기준으로 여집합을 취합니다. 따라서 `SEARCH('NOT a:hit')`와 `NOT SEARCH('a:hit')` 모두 NULL 행을 포함합니다. Lucene 모드도 동일한 NULL/불일치 규칙을 사용하지만 아래에 설명된 고유한 부울 구문 분석 규칙을 유지합니다. `score()`를 계산하거나 쿼리 캐시를 사용해도 전체 일치 집합은 변경되지 않으며, 정렬과 LIMIT에 따라 반환되는 행이 달라질 수 있습니다.

일반 SQL 비교와 `MATCH` 연산자는 SQL의 삼값 논리를 유지합니다. 입력이 NULL이면 `a != 'hit'`와 `NOT (a MATCH_ANY 'hit')`는 UNKNOWN이 되어 `WHERE`에서 필터링됩니다. 외부 SQL 표현식의 다른 NULL 허용 피연산자로 인해 여전히 UNKNOWN이 생성될 수 있습니다.

#### 예시: NULL 및 NOT {#example-null-and-not}

CREATE, INSERT 및 SELECT 권한이 있는 데이터베이스에서 예시를 실행하십시오. 아래의 단일 버킷과 단일 복제본은 소규모 데모 테이블을 위한 설정입니다.

```sql
CREATE TABLE search_null_demo (
    id INT,
    a VARCHAR(16) NULL,
    INDEX idx_a(a) USING INVERTED PROPERTIES("parser"="unicode")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num"="1");

INSERT INTO search_null_demo VALUES (1, 'hit'), (2, 'miss'), (3, NULL);
```

```sql
SELECT id FROM search_null_demo WHERE SEARCH('a:hit') ORDER BY id;
```

```text
id
1
```

```sql
SELECT id FROM search_null_demo WHERE SEARCH('NOT a:hit') ORDER BY id;
```

```text
id
2
3
```

```sql
SELECT id FROM search_null_demo WHERE NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
3
```

NULL 행도 제외하려면 명시적인 `IS NOT NULL` 필터를 추가하십시오.

```sql
SELECT id FROM search_null_demo
WHERE a IS NOT NULL AND NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
```

이 세 행에서 SQL 조건 `a != 'hit'`와 텍스트 검색 조건 `NOT (a MATCH_ANY 'hit')`도 id 2만 반환합니다.

#### VARIANT: NULL, 누락된 경로 및 사용할 수 없는 인덱스 {#variant-null-missing-paths-and-unavailable-indexes}

`v.a:hit`와 같은 일반 VARIANT 용어는 동일한 규칙을 따릅니다.

| `v`에 기록된 값 | `v.a:hit` | `NOT v.a:hit` |
| --- | --- | --- |
| `{"a":"hit"}` | TRUE | FALSE |
| `{"a":"miss"}` | FALSE | TRUE |
| `{"a":null}` | FALSE | TRUE |
| `{}`(경로 `a`가 누락됨) | FALSE | TRUE |
| SQL NULL(전체 VARIANT 열이 NULL) | FALSE | TRUE |

배열 외부의 저장된 객체에서는 JSON `null` 멤버가 제거되므로 해당 경로를 읽으면 누락된 멤버와 마찬가지로 SQL NULL이 반환됩니다. 이는 표현식에서 계산된 JSON `null`과 다릅니다. [VARIANT NULL 의미](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md#null-semantics)를 참조하십시오.

`parse_to_variant`를 사용하여 JSON 객체를 삽입하십시오. 다음 테이블은 doc 모드를 비활성화하므로 예시에서 실행 가능한 인덱스가 있는 구체화된 하위 경로를 사용합니다.

```sql
CREATE TABLE search_variant_null_demo (
    id INT,
    v VARIANT<PROPERTIES("variant_enable_doc_mode"="false")>,
    INDEX idx_v(v) USING INVERTED PROPERTIES("parser"="unicode")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES("replication_num"="1");

INSERT INTO search_variant_null_demo VALUES
    (1, parse_to_variant('{"a":"hit"}')),
    (2, parse_to_variant('{"a":"miss"}')),
    (3, parse_to_variant('{"a":null}')),
    (4, parse_to_variant('{}')),
    (5, NULL);
```

```sql
SELECT id FROM search_variant_null_demo WHERE SEARCH('v.a:hit') ORDER BY id;
```

```text
id
1
```

```sql
SELECT id FROM search_variant_null_demo WHERE SEARCH('NOT v.a:hit') ORDER BY id;
```

```text
id
2
3
4
5
```

`NOT SEARCH('v.a:hit')`도 동일한 id를 반환합니다. 어떤 행에도 경로가 없으면 `SEARCH('v.absent:hit')`는 행을 반환하지 않고 `SEARCH('NOT v.absent:hit')`는 다섯 행 모두를 반환합니다. 대상 경로에 NULL이 아닌 값이 있는 행만 유지하려면 SEARCH 외부에 `v['a'] IS NOT NULL`을 추가하십시오.

**경로 누락과 인덱스 사용 불가는 서로 다른 상태입니다.** 경로에 데이터가 있지만 필요한 역색인을 실행할 수 없으면 SEARCH는 부정 쿼리에서도 `SEARCH index unavailable for Variant field 'v.a'` 오류를 보고합니다. 예를 들어 CREATE INDEX 후 과거 rowset에 인덱스가 아직 구축되지 않았거나, 경로가 실행 가능한 리프 인덱스 없이 doc 저장소에만 보존된 경우가 있습니다. SEARCH는 이러한 상태를 빈 일치 집합으로 처리하거나 자동으로 스캔으로 대체하지 않습니다. 쿼리 대상인 모든 데이터에 필요한 경로 인덱스를 사용할 수 있는지 확인하거나, 추출한 경로를 일반 SQL로 쿼리하십시오.

## 시나리오별 SEARCH 사용 {#using-search-by-scenario}

### 시나리오 1: 단일 용어 일치 {#scenario-1-single-term-match}

**사용 사례:** 필드에 특정 용어가 포함된 문서를 검색합니다.

- **구문:** `column:term`
- **의미:** 열의 토큰화된 결과에 대해 용어를 일치시킵니다. 대소문자 구분 여부는 인덱스 속성 `lower_case`에 따라 달라집니다.
- **인덱스 권장 사항:** 적절한 `parser`/`analyzer`가 있는 역색인을 열에 생성합니다.

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### 시나리오 2: 여러 용어 OR 일치(ANY) {#scenario-2-multi-term-or-match-any}

**사용 사례:** 후보 목록의 용어 중 하나라도 일치하면 성공합니다. 예를 들어 태그 일치나 키워드 결합 검색에 사용합니다.

- **구문:** `column:ANY(term1 term2 ...)`
- **의미:** 열의 토큰화된 결과에 목록의 용어가 하나라도 포함됩니다(OR 의미). 순서는 중요하지 않으며 중복 용어는 무시됩니다.
- **인덱스 권장 사항:** 열에 토큰화된 역색인을 생성합니다(`english`/`chinese`/`unicode` 등).

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### 시나리오 3: 여러 용어 AND 일치(ALL) {#scenario-3-multi-term-and-match-all}

**사용 사례:** 여러 용어가 모두 일치해야 합니다. 예를 들어 엄격한 주제 필터링에 사용합니다.

- **구문:** `column:ALL(term1 term2 ...)`
- **의미:** 열의 토큰화된 결과에 목록의 모든 용어가 동시에 포함됩니다(AND 의미). 순서는 중요하지 않으며 중복 용어는 무시됩니다.
- **인덱스 권장 사항:** 열에 토큰화된 역색인을 생성합니다(`english`/`chinese`/`unicode` 등).

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### 시나리오 4: 부울 조합 쿼리 {#scenario-4-boolean-combination-query}

**사용 사례:** 여러 조건을 AND/OR/NOT으로 결합해야 합니다. 예를 들어 “A를 포함하고 B는 포함하지 않아야 함”과 같은 경우입니다.

- **구문:** `(expr) AND/OR/NOT (expr)`
- **의미:** SEARCH 내부에서 `AND`, `OR`, `NOT`을 사용하여 하위 표현식을 결합합니다.
- **인덱스 권장 사항:** 인덱스 푸시다운을 얻을 수 있도록 가능한 경우 일치 가능한 조건을 SEARCH 내부에 배치합니다. 추가 필터링에는 다른 WHERE 조건을 사용합니다.

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### 시나리오 5: 복잡한 중첩 표현식 {#scenario-5-complex-nested-expressions}

**사용 사례:** 괄호로 부울 우선순위를 제어하고 다단계 중첩 필터 조건을 구성합니다.

- **구문:** 괄호로 표현식을 그룹화합니다. 예: `(expr1 OR expr2) AND expr3`
- **의미:** 괄호로 부울 우선순위를 제어합니다. 다단계 중첩이 지원됩니다.
- **인덱스 권장 사항:** 부울 조합 쿼리와 동일합니다.

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### 시나리오 6: Lucene/Elasticsearch 구문 호환성 {#scenario-6-luceneelasticsearch-syntax-compatibility}

**사용 사례:** Elasticsearch에서 마이그레이션하거나 Lucene query_string 의미 체계에 따라 표현식을 작성하려는 경우입니다.

Lucene 모드는 Elasticsearch/Lucene의 query_string 동작을 모방합니다. 부울 연산자는 기존 부울 대수 대신 왼쪽에서 오른쪽으로 적용되는 수정자로 작동합니다.

**standard 모드와의 주요 차이점:**

- AND/OR/NOT은 인접 용어에 영향을 주는 수정자입니다.
- 연산자 우선순위는 왼쪽에서 오른쪽입니다.
- 내부적으로 MUST/SHOULD/MUST_NOT을 사용합니다(Lucene의 Occur 열거형과 유사).
- 순수 NOT 쿼리는 match-all 조건을 추가하고 일치하는 행을 제외합니다.

**Lucene 모드 활성화:**

```sql
-- Basic Lucene mode
SELECT * FROM docs
WHERE SEARCH('apple AND banana',
             '{"default_field":"title","mode":"lucene"}');

-- Use minimum_should_match
SELECT * FROM docs
WHERE SEARCH('apple AND banana OR cherry',
             '{"default_field":"title","mode":"lucene","minimum_should_match":1}');
```

**동작 비교:**

| 쿼리 | standard 모드 | Lucene 모드 |
| --- | --- | --- |
| `a AND b` | a ∩ b | +a +b(둘 다 MUST) |
| `a OR b` | a ∪ b | a b(둘 다 SHOULD, min=1) |
| `NOT a` | ¬a | a를 제외한 모든 문서와 일치(`-a`) |
| `a AND NOT b` | a ∩ ¬b | +a -b(MUST a, MUST_NOT b) |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c(a만 MUST) |

> **참고:** Lucene 모드에서 `a AND b OR c`는 왼쪽에서 오른쪽으로 구문 분석됩니다. OR 연산자가 `b`를 MUST에서 SHOULD로 변경합니다. SHOULD 절이 일치하도록 하려면 `minimum_should_match`를 사용하십시오.

### 시나리오 7: 구문 쿼리 {#scenario-7-phrase-query}

**사용 사례:** 연속적이고 순서가 있는 구문을 검색합니다. 예를 들어 “machine learning”이 순서대로 나타나야 하는 경우입니다.

- **구문:** `column:"quoted phrase"`
- **의미:** 열의 분석기에 따라 연속적이고 순서가 있는 용어를 일치시킵니다. 전체 구문을 큰따옴표로 감싸야 합니다.
- **인덱스 권장 사항:** 대상 열은 위치 정보를 포함하는 토큰화된 역색인을 사용해야 합니다(`parser`로 구성).

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### 시나리오 8: 여러 열에 걸친 결합 검색 {#scenario-8-combined-search-across-multiple-columns}

**사용 사례:** 단일 쿼리로 여러 필드를 처리합니다. 예를 들어 제목, 태그 또는 작성자와 일치하는 행을 반환합니다.

- **구문:** `column1:term OR column2:ANY(...) OR ...`
- **의미:** 단일 표현식에서 여러 열을 대상으로 일치시킵니다. 각 열에는 고유한 인덱스/토크나이저 구성이 적용됩니다.
- **인덱스 권장 사항:** 관련된 각 열에 적절한 역색인을 구축합니다.

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### 시나리오 9: 와일드카드 쿼리 {#scenario-9-wildcard-query}

**사용 사례:** 접두사, 접미사 또는 포함 일치를 수행합니다. 예를 들어 “Chris”로 시작하는 모든 이름을 검색합니다.

- **구문:** `column:prefix*`, `column:*mid*`, `column:?ingle`
- **의미:** `*`는 임의 길이의 문자열과 일치하고 `?`는 단일 문자와 일치합니다.
- **인덱스 권장 사항:** 토큰화되지 않은 인덱스에 적합합니다. 대소문자를 구분하지 않는 일치를 얻기 위해 `lower_case`가 활성화된 토큰화 인덱스에서도 사용할 수 있습니다.

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### 시나리오 10: 정규식 쿼리 {#scenario-10-regular-expression-query}

**사용 사례:** 복잡한 패턴 일치를 위해 Lucene 스타일 정규식을 사용합니다.

- **구문:** `column:/regex/`
- **의미:** 슬래시로 감싼 패턴을 Lucene 스타일 정규식으로 일치시킵니다.
- **인덱스 권장 사항:** 토큰화되지 않은 역색인만 지원됩니다.

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### 시나리오 11: 엄격한 동등성 일치(EXACT) {#scenario-11-strict-equality-match-exact}

**사용 사례:** 열의 원래 전체 값과 정확히 일치시킵니다. 대소문자를 구분하며 토큰화하지 않습니다.

- **구문:** `column:EXACT(text)`
- **의미:** 전체 열 값에 대해 정확히 일치시킵니다. 대소문자를 구분하며 부분 용어와는 일치하지 않습니다.
- **인덱스 권장 사항:** EXACT를 가속하려면 열에 토큰화되지 않은 역색인도 구축합니다(`parser`를 설정하지 않음).

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### 시나리오 12: VARIANT 하위 열 쿼리 {#scenario-12-variant-subcolumn-query}

**사용 사례:** 반구조화된 VARIANT 필드 내 특정 하위 경로를 검색합니다.

- **구문:** `variant_col.sub.path:term`
- **의미:** 점으로 구분된 경로를 통해 VARIANT 하위 열에 액세스하여 일치시킵니다. 일치 동작은 VARIANT 열의 인덱스/분석기 구성에 따릅니다.
- **지원 기능:** 부울 조합, `ANY`/`ALL`, 중첩 경로. 존재하지 않는 하위 열은 일치를 반환하지 않습니다.

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## 전체 예시 {#complete-example}

다음 종합 예시는 동일한 열에 토큰화된 인덱스와 토큰화되지 않은 인덱스를 모두 구축하고 EXACT, ANY/ALL, 구문 및 와일드카드 쿼리를 결합하는 방법을 보여줍니다.

### 테이블 및 기본 인덱스 생성 {#create-the-table-and-base-indexes}

```sql
-- Build both tokenized and non-tokenized inverted indexes
CREATE TABLE t (
    id INT,
    content STRING,
    INDEX idx_untokenized(content) USING INVERTED,
    INDEX idx_tokenized(content)  USING INVERTED PROPERTIES("parser" = "standard")
);
```

### EXACT와 토큰화 쿼리 비교 {#comparing-exact-and-tokenized-queries}

```sql
-- Strict equality match (uses the non-tokenized index)
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning)')
ORDER BY id;

-- EXACT does not match partial terms
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine)')
ORDER BY id;

-- ANY/ALL use the tokenized index
SELECT id, content FROM t WHERE SEARCH('content:ANY(machine learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ALL(machine learning)') ORDER BY id;

-- Compare EXACT and ANY
SELECT id, content FROM t WHERE SEARCH('content:EXACT(deep learning)') ORDER BY id;
SELECT id, content FROM t WHERE SEARCH('content:ANY(deep learning)') ORDER BY id;
```

### 결합 조건 및 단순화된 형식 {#combined-conditions-and-simplified-forms}

```sql
-- Combined conditions
SELECT id, content
FROM t
WHERE SEARCH('content:EXACT(machine learning) OR content:ANY(intelligence)')
ORDER BY id;

-- Simplified form using a default field and default operator
SELECT id, tags
FROM tag_dataset
WHERE SEARCH('deep learning', 'tags', 'and'); -- Automatically expands to tags:ALL(deep learning)

-- Use a phrase and a wildcard together
SELECT id, content FROM t
WHERE SEARCH('content:"deep learning" OR content:AI*')
ORDER BY id;
```

### VARIANT 열 검색 예시 {#variant-column-search-example}

```sql
-- A VARIANT column with an inverted index
CREATE TABLE test_variant_search_subcolumn (
    id BIGINT,
    properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="2048")>,
    INDEX idx_properties (properties) USING INVERTED PROPERTIES (
        "parser" = "unicode",
        "lower_case" = "true",
        "support_phrase" = "true"
    )
);

-- Single-term query
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha')
ORDER BY id;

-- AND / ALL queries
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha AND properties.message:beta')
ORDER BY id;

SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:ALL(alpha beta)')
ORDER BY id;

-- OR query across different subcolumns
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:hello OR properties.category:beta')
ORDER BY id;
```

## 이스케이프 문자 {#escape-characters}

DSL의 특수 문자를 이스케이프하려면 백슬래시(`\`)를 사용합니다.

| 이스케이프 | 설명 | 예시 |
| --- | --- | --- |
| `\ ` | 리터럴 공백(용어 연결) | `title:First\ Value`는 "First Value"와 일치합니다. |
| `\(` `\)` | 리터럴 괄호 | `title:hello\(world\)`는 "hello(world)"와 일치합니다. |
| `\:` | 리터럴 콜론 | `title:key\:value`는 "key:value"와 일치합니다. |
| `\\` | 리터럴 백슬래시 | `title:path\\to\\file`은 "path\to\file"과 일치합니다. |

**예시:**

```sql
-- Search for a value containing a space as a single term
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- Search for a value containing parentheses
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- Search for a value containing a colon
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **참고:** SQL 문자열에서는 백슬래시를 이중으로 이스케이프해야 합니다. SQL에서 `\\`를 사용하면 DSL에서 단일 `\`가 생성됩니다.

## 현재 제한 사항 {#current-limitations}

- 범위 및 목록 절(예: `field:[a TO b]` 및 `field:IN(...)`)은 여전히 일반 용어 일치로 대체됩니다. 대신 일반 SQL 범위 또는 `IN` 필터를 사용하십시오.

대안으로 표준 연산자나 텍스트 검색 연산자를 사용할 수 있습니다.

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```


## 다중 필드 옵션 예시 {#multi-field-options-example}

`fields`와 `type`은 Doris 4.1.0에서 사용할 수 있습니다. `standard` 모드에서 `best_fields`는 전체 쿼리를 각 필드에 복사한 후 복사본을 OR로 결합합니다. `cross_fields`는 각 용어를 여러 필드로 확장합니다. 아래의 동일 필드와 교차 필드 구분은 `AND` 또는 `default_operator="and"`를 사용할 때만 적용되며, 기본 OR 연산자에 대해서는 그렇게 가정해서는 안 됩니다. `lucene` 모드에서는 절별로 확장되므로 이 standard 모드 AND 비교는 Lucene 동작을 설명하지 않습니다.

CREATE, INSERT 및 SELECT 권한이 있는 데이터베이스에서 다음 데이터를 준비하십시오.

```sql
CREATE TABLE search_multifield (
    id INT,
    title STRING,
    content STRING,
    INDEX title_idx(title) USING INVERTED PROPERTIES ("parser"="unicode", "lower_case"="true"),
    INDEX content_idx(content) USING INVERTED PROPERTIES ("parser"="unicode", "lower_case"="true")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num"="1");
INSERT INTO search_multifield VALUES
(1, 'Alice', 'Smith'),
(2, 'Alice Smith', 'other'),
(3, 'Bob', 'Smith');
```

```sql
SELECT id FROM search_multifield
WHERE SEARCH('Alice Smith',
  '{"fields":["title","content"],"type":"best_fields","default_operator":"and"}')
ORDER BY id;
```

```text
id
2
```

```sql
SELECT id FROM search_multifield
WHERE SEARCH('Alice Smith',
  '{"fields":["title","content"],"type":"cross_fields","default_operator":"and"}')
ORDER BY id;
```

```text
id
1
2
```

부정 절만 포함된 Lucene 쿼리는 match-all 조건을 추가한 후 부정 용어를 제외합니다.

```sql
SELECT id FROM search_multifield
WHERE SEARCH('NOT title:Alice', '{"mode":"lucene"}')
ORDER BY id;
```

```text
id
3
```
