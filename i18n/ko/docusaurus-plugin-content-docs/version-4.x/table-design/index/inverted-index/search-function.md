---
{
    "title": "SEARCH 함수",
    "language": "ko",
    "description": "SEARCH 함수는 Apache Doris 4.0에서 제공하는 통합 전문 검색 진입점입니다. 간결한 DSL 표현식으로 쿼리 조건을 기술하고 역색인을 기반으로 검색어, 구문, 불리언, 와일드카드 및 정규 표현식 검색을 효율적으로 실행합니다."
}
---

<!-- Knowledge type: Function reference / Procedure -->
<!-- Use cases: Full-text search / Inverted index query / DSL expression authoring -->

`SEARCH` 함수는 Apache Doris 버전 4.0부터 제공되는 통합 전문 검색 쿼리 진입점입니다. 간결한 DSL(도메인 특화 언어)로 쿼리 조건을 기술하고 역색인을 기반으로 효율적으로 실행합니다.

`SEARCH`는 불리언 값을 반환하는 술어 함수입니다. `WHERE` 절에서 필터 조건으로 사용할 수 있습니다. 텍스트 매칭 규칙을 기술하는 SEARCH DSL 문자열을 받아 매칭 가능한 조건을 역색인으로 푸시다운하여 실행합니다.

**대표적인 사용 사례:**

- 텍스트 필드에서 검색어, 구문 및 불리언 조합 검색 수행
- 여러 컬럼에 걸친 조합 검색 실행
- 와일드카드나 정규 표현식을 사용한 패턴 매칭
- VARIANT 하위 컬럼에서 구조화된 텍스트 검색 수행
- Lucene/Elasticsearch의 query_string 구문 스타일과의 호환성 유지

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
| `<default_field>` | 선택 | DSL의 검색어에 필드가 명시되지 않았을 때 자동으로 적용할 컬럼 이름 |
| `<default_operator>` | 선택 | 여러 검색어로 이루어진 표현식에 사용할 기본 불리언 연산자. `and` 또는 `or`만 허용되며 대소문자를 구분하지 않음. 기본값은 `or` |

**사용 시 참고 사항:**

- **위치**: `WHERE` 절에서 행 필터링에 참여하는 술어로 사용
- **반환 타입**: NULL을 허용하지 않는 BOOLEAN(매칭되면 TRUE, 그렇지 않으면 FALSE; Doris 4.2부터 적용)

`default_field`를 지정하면 Doris는 필드가 지정되지 않은 검색어나 함수를 해당 필드에 적용되도록 자동 확장합니다. 예를 들면 다음과 같습니다.

- `SEARCH('foo bar', 'tags', 'and')`는 `SEARCH('tags:ALL(foo bar)')`와 동일합니다
- `SEARCH('foo bar', 'tags')`는 `tags:ANY(foo bar)`로 확장됩니다

DSL에 명시적으로 지정된 불리언 연산은 우선순위가 가장 높으며 기본 연산자보다 우선 적용됩니다.

### 옵션 매개변수(JSON 형식) {#options-parameter-json-format}

두 번째 매개변수에 JSON 문자열을 지정하여 고급 설정을 적용할 수도 있습니다.

```sql
SEARCH('<search_expression>', '<options_json>')
```

**지원 옵션:**

| 옵션 | 타입 | 설명 |
| --- | --- | --- |
| `default_field` | 문자열 | 필드가 명시되지 않은 검색어에 사용할 기본 컬럼 이름 |
| `default_operator` | 문자열 | 여러 검색어로 이루어진 표현식에 사용할 기본 연산자(`and` 또는 `or`) |
| `mode` | 문자열 | `standard`(기본값) 또는 `lucene` |
| `minimum_should_match` | 정수 | 매칭되어야 하는 SHOULD 절의 최소 개수(Lucene 모드에서만 사용) |
| `fields` | 문자열 배열 | 필드가 명시되지 않은 검색어에 적용할 대상 컬럼을 선택적으로 지정. 비어 있지 않은 `default_field`와 함께 사용할 수 없음 |
| `type` | 문자열 | 다중 필드 확장 방식을 선택적으로 지정: `best_fields`(기본값) 또는 `cross_fields`. 점수 계산이나 정렬 알고리즘을 선택하는 옵션은 아님 |

**예제:**

```sql
SELECT * FROM docs
WHERE SEARCH('apple banana',
             '{"default_field":"title","default_operator":"and","mode":"lucene"}');
```

### NULL과 두 값 매칭 {#null-and-three-valued-logic}

**버전:** 아래의 두 값 매칭 규칙, NULL/NOT 예제, VARIANT 인덱스 오류 동작은 Doris 4.2부터 적용됩니다.

`SEARCH`는 NULL을 허용하지 않는 BOOLEAN을 반환합니다. 매칭되면 TRUE, 매칭되지 않으면 FALSE를 반환합니다. 일반 검색어는 NULL 값이나 저장소에 존재하지 않는 것으로 확인된 VARIANT 경로와 매칭되지 않습니다. SEARCH는 UNKNOWN을 전파하지 않습니다.

standard 모드에서 `AND`는 매칭 집합의 교집합을, `OR`는 합집합을 구하며, `NOT`은 쿼리에서 볼 수 있는 행을 기준으로 여집합을 구합니다. 따라서 `SEARCH('NOT a:hit')`와 `NOT SEARCH('a:hit')` 모두 NULL 행을 포함합니다. Lucene 모드도 동일한 NULL 및 비매칭 규칙을 사용하지만, 아래에 설명한 자체 Boolean 파싱 규칙은 유지합니다. `score()`를 계산하거나 쿼리 캐시를 사용해도 전체 매칭 집합은 바뀌지 않습니다. 정렬과 LIMIT은 반환되는 행을 바꿀 수 있습니다.

일반 SQL 비교 연산과 `MATCH` 연산자는 SQL의 세 값 논리를 따릅니다. 입력이 NULL이면 `a != 'hit'`와 `NOT (a MATCH_ANY 'hit')`의 결과는 UNKNOWN이며 `WHERE`에서 걸러집니다. 바깥쪽 SQL 표현식은 다른 NULL 허용 피연산자로 인해 여전히 UNKNOWN을 반환할 수 있습니다.

#### 예제: NULL과 NOT

CREATE, INSERT, SELECT 권한이 있는 데이터베이스에서 다음 예제를 실행하세요. 아래의 단일 버킷과 복제본은 작은 예제 테이블을 위한 것입니다.

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

NULL 행도 제외하려면 `IS NOT NULL` 필터를 명시적으로 추가하세요:

```sql
SELECT id FROM search_null_demo
WHERE a IS NOT NULL AND NOT SEARCH('a:hit') ORDER BY id;
```

```text
id
2
```

이 세 행에 대해 SQL 조건 `a != 'hit'`와 텍스트 검색 조건 `NOT (a MATCH_ANY 'hit')`도 id 2만 반환합니다.

#### VARIANT: NULL, 누락된 경로, 사용할 수 없는 인덱스

`v.a:hit` 같은 일반 VARIANT 검색어에도 동일한 규칙이 적용됩니다:

| `v`에 기록된 값 | `v.a:hit` | `NOT v.a:hit` |
| --- | --- | --- |
| `{"a":"hit"}` | TRUE | FALSE |
| `{"a":"miss"}` | FALSE | TRUE |
| `{"a":null}` | FALSE | TRUE |
| `{}` (경로 `a`가 없음) | FALSE | TRUE |
| SQL NULL (VARIANT 컬럼 전체가 NULL) | FALSE | TRUE |

배열 외부에 저장된 객체에서는 JSON `null` 멤버가 제거되므로 해당 경로를 읽으면 누락된 멤버와 마찬가지로 SQL NULL이 반환됩니다. 이는 표현식 안에서 계산된 JSON `null`과 다릅니다. 자세한 내용은 [VARIANT 가이드](../../../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT.md)를 참조하세요.

JSON 객체를 삽입할 때는 `parse_to_variant`를 사용하세요. 다음 테이블은 예제에서 실행 가능한 인덱스가 있는 구체화된 하위 경로를 사용하도록 doc 모드를 비활성화합니다.

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

`NOT SEARCH('v.a:hit')`도 동일한 id를 반환합니다. 모든 행에 경로가 없으면 `SEARCH('v.absent:hit')`는 행을 반환하지 않고 `SEARCH('NOT v.absent:hit')`는 다섯 행을 모두 반환합니다. 대상 경로의 값이 NULL이 아닌 행만 남기려면 SEARCH 바깥에 `v['a'] IS NOT NULL`을 추가하세요.

**누락된 경로와 사용할 수 없는 인덱스는 서로 다른 상태입니다.** 경로에 데이터가 있지만 필요한 역인덱스를 실행할 수 없는 경우, 부정 쿼리를 포함해 SEARCH는 `SEARCH index unavailable for Variant field 'v.a'` 오류를 보고합니다. 예를 들어 CREATE INDEX 이후에도 인덱스가 아직 구축되지 않은 이전 rowset이나, 실행 가능한 리프 인덱스 없이 doc 저장소에만 유지된 경로가 이에 해당합니다. SEARCH는 이러한 상태를 빈 매칭 집합으로 취급하거나 자동으로 스캔으로 전환하지 않습니다. 조회하는 모든 데이터에 필요한 경로 인덱스를 사용할 수 있도록 하거나, 추출한 경로를 일반 SQL로 조회하세요.

## 시나리오별 SEARCH 사용법 {#using-search-by-scenario}

### 시나리오 1: 단일 검색어 매칭 {#scenario-1-single-term-match}

**사용 사례:** 필드에 특정 검색어가 포함된 문서를 검색합니다.

- **구문:** `column:term`
- **의미:** 컬럼을 토큰화한 결과에서 검색어를 매칭합니다. 대소문자 구분 여부는 인덱스 속성 `lower_case`에 따라 달라집니다
- **인덱스 권장 사항:** 컬럼에 적절한 `parser`/`analyzer`를 사용하는 역색인을 생성합니다

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Machine');
SELECT id, title FROM search_test_basic WHERE SEARCH('title:Python');
SELECT id, title FROM search_test_basic WHERE SEARCH('category:Technology');
```

### 시나리오 2: 여러 검색어의 OR 매칭(ANY) {#scenario-2-multi-term-or-match-any}

**사용 사례:** 후보 목록의 검색어 중 하나라도 매칭되면 일치하는 것으로 간주합니다. 태그 매칭이나 여러 키워드를 조합한 검색에 사용할 수 있습니다.

- **구문:** `column:ANY(term1 term2 ...)`
- **의미:** 컬럼을 토큰화한 결과에 목록의 검색어 중 하나라도 포함되어야 합니다(OR 의미). 순서는 상관없으며 중복 검색어는 무시됩니다
- **인덱스 권장 사항:** 컬럼에 토큰화 역색인을 생성합니다(예: `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python javascript)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(machine learning tutorial)');

-- Edge case: a single-value ANY is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ANY(python)');
```

### 시나리오 3: 여러 검색어의 AND 매칭(ALL) {#scenario-3-multi-term-and-match-all}

**사용 사례:** 여러 검색어가 모두 매칭되어야 합니다. 엄격한 주제 필터링 등에 사용할 수 있습니다.

- **구문:** `column:ALL(term1 term2 ...)`
- **의미:** 컬럼을 토큰화한 결과에 목록의 모든 검색어가 함께 포함되어야 합니다(AND 의미). 순서는 상관없으며 중복 검색어는 무시됩니다
- **인덱스 권장 사항:** 컬럼에 토큰화 역색인을 생성합니다(예: `english`/`chinese`/`unicode`)

```sql
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(machine learning)');
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(programming tutorial)');

-- Edge case: a single-value ALL is equivalent to a term query
SELECT id, title FROM search_test_basic WHERE SEARCH('tags:ALL(python)');
```

### 시나리오 4: 불리언 조합 쿼리 {#scenario-4-boolean-combination-query}

**사용 사례:** 여러 조건을 AND/OR/NOT으로 결합해야 할 때 사용합니다. 예를 들어 "A를 포함하고 B를 포함하지 않아야 함"과 같은 조건입니다.

- **구문:** `(expr) AND/OR/NOT (expr)`
- **의미:** SEARCH 내부의 하위 표현식을 `AND`, `OR`, `NOT`으로 결합합니다
- **인덱스 권장 사항:** 인덱스 푸시다운을 활용할 수 있도록 매칭 가능한 조건은 가급적 SEARCH 내부에 배치합니다. 추가 필터링에는 다른 WHERE 조건을 사용합니다

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Machine AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR title:Data');

SELECT id, title FROM search_test_basic
WHERE SEARCH('category:Technology AND NOT title:Machine');
```

### 시나리오 5: 복잡한 중첩 표현식 {#scenario-5-complex-nested-expressions}

**사용 사례:** 괄호로 불리언 연산의 우선순위를 제어하고 다단계로 중첩된 필터 조건을 구성합니다.

- **구문:** 괄호로 표현식을 그룹화합니다. 예: `(expr1 OR expr2) AND expr3`
- **의미:** 괄호로 불리언 연산의 우선순위를 제어합니다. 다단계 중첩을 지원합니다
- **인덱스 권장 사항:** 불리언 조합 쿼리와 동일합니다

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('(title:Machine OR title:Python) AND category:Technology');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ANY(python javascript) AND (category:Technology OR category:Programming)');
```

### 시나리오 6: Lucene/Elasticsearch 구문 호환성 {#scenario-6-luceneelasticsearch-syntax-compatibility}

**사용 사례:** Elasticsearch에서 마이그레이션하거나 Lucene query_string 의미 체계에 따라 표현식을 작성할 때 사용합니다.

Lucene 모드는 Elasticsearch/Lucene의 query_string 동작을 에뮬레이션합니다. 불리언 연산자는 전통적인 불리언 대수 규칙 대신 왼쪽에서 오른쪽으로 적용되는 수정자로 동작합니다.

**표준 모드와의 주요 차이점:**

- AND/OR/NOT은 인접한 검색어에 영향을 주는 수정자입니다
- 연산자 우선순위는 왼쪽에서 오른쪽으로 적용됩니다
- 내부적으로 MUST/SHOULD/MUST_NOT을 사용합니다(Lucene의 Occur 열거형과 유사)
- NOT만으로 구성된 쿼리는 전체 매칭 조건을 추가한 뒤 매칭되는 행을 제외합니다

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

| 쿼리 | 표준 모드 | Lucene 모드 |
| --- | --- | --- |
| `a AND b` | a ∩ b | +a +b (둘 다 MUST) |
| `a OR b` | a ∪ b | a b (둘 다 SHOULD, min=1) |
| `NOT a` | ¬a | a를 제외한 모든 문서와 매칭(`-a`) |
| `a AND NOT b` | a ∩ ¬b | +a -b (a는 MUST, b는 MUST_NOT) |
| `a AND b OR c` | (a ∩ b) ∪ c | +a b c (a만 MUST) |

> **참고:** Lucene 모드에서 `a AND b OR c`는 왼쪽에서 오른쪽으로 파싱됩니다. OR 연산자는 `b`를 MUST에서 SHOULD로 변경합니다. SHOULD 절의 매칭을 필수로 지정하려면 `minimum_should_match`를 사용하세요.

### 시나리오 7: 구문 쿼리 {#scenario-7-phrase-query}

**사용 사례:** 연속적이고 순서가 있는 구문을 검색합니다. 예를 들어 "machine learning"이 해당 순서로 나타나도록 요구할 수 있습니다.

- **구문:** `column:"quoted phrase"`
- **의미:** 컬럼의 분석기에 따라 연속적이고 순서가 있는 검색어를 매칭합니다. 전체 구문을 큰따옴표로 감싸야 합니다
- **인덱스 권장 사항:** 대상 컬럼은 위치 정보를 포함하는 토큰화 역색인을 사용해야 합니다(`parser`로 설정)

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('content:"machine learning"');
```

### 시나리오 8: 여러 컬럼에 걸친 조합 검색 {#scenario-8-combined-search-across-multiple-columns}

**사용 사례:** 하나의 쿼리로 여러 필드를 검색합니다. 예를 들어 제목, 태그 또는 작성자가 매칭되는 행을 반환할 수 있습니다.

- **구문:** `column1:term OR column2:ANY(...) OR ...`
- **의미:** 하나의 표현식에서 여러 컬럼을 매칭합니다. 각 컬럼에는 해당 컬럼의 인덱스/토크나이저 설정이 적용됩니다
- **인덱스 권장 사항:** 검색에 참여하는 각 컬럼에 적절한 역색인을 생성합니다

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('title:Python OR tags:ANY(database mysql) OR author:Alice');

SELECT id, title FROM search_test_basic
WHERE SEARCH('tags:ALL(tutorial) AND category:Technology');
```

### 시나리오 9: 와일드카드 쿼리 {#scenario-9-wildcard-query}

**사용 사례:** 접두사, 접미사 또는 포함 여부를 기준으로 매칭합니다. 예를 들어 "Chris"로 시작하는 모든 이름을 검색할 수 있습니다.

- **구문:** `column:prefix*`, `column:*mid*`, `column:?ingle`
- **의미:** `*`는 임의 길이의 문자열과 매칭하고, `?`는 단일 문자와 매칭합니다
- **인덱스 권장 사항:** 비토큰화 인덱스에 적합합니다. 토큰화 인덱스에서도 `lower_case`를 활성화하면 대소문자를 구분하지 않는 매칭에 사용할 수 있습니다

```sql
SELECT id, title FROM search_test_basic
WHERE SEARCH('firstname:Chris*');

-- Combine with the default field parameter
SELECT id, firstname FROM people
WHERE SEARCH('Chris*', 'firstname');
```

### 시나리오 10: 정규 표현식 쿼리 {#scenario-10-regular-expression-query}

**사용 사례:** Lucene 스타일의 정규 표현식으로 복잡한 패턴 매칭을 수행합니다.

- **구문:** `column:/regex/`
- **의미:** 슬래시로 감싼 패턴을 사용하여 Lucene 스타일의 정규 표현식으로 매칭합니다
- **인덱스 권장 사항:** 비토큰화 역색인만 지원합니다

```sql
SELECT id, title FROM corpus
WHERE SEARCH('title:/data.+science/');
```

### 시나리오 11: 완전 일치 매칭(EXACT) {#scenario-11-strict-equality-match-exact}

**사용 사례:** 컬럼의 원본 값 전체와 정확히 매칭합니다. 대소문자를 구분하며 토큰화하지 않습니다.

- **구문:** `column:EXACT(text)`
- **의미:** 컬럼 값 전체를 대상으로 정확히 매칭합니다. 대소문자를 구분하며 검색어 일부와는 매칭되지 않습니다
- **인덱스 권장 사항:** EXACT를 가속화하려면 컬럼에 비토큰화 역색인도 생성합니다(`parser`를 설정하지 않음)

```sql
SELECT id
FROM t
WHERE SEARCH('content:EXACT(machine learning)');
```

### 시나리오 12: VARIANT 하위 컬럼 쿼리 {#scenario-12-variant-subcolumn-query}

**사용 사례:** 반정형 VARIANT 필드 내의 특정 하위 경로를 검색합니다.

- **구문:** `variant_col.sub.path:term`
- **의미:** 점으로 구분된 경로를 통해 VARIANT 하위 컬럼에 접근하여 매칭합니다. 매칭 동작은 VARIANT 컬럼의 인덱스/분석기 설정을 따릅니다
- **지원 기능:** 불리언 조합, `ANY`/`ALL`, 중첩 경로. 존재하지 않는 하위 컬럼은 매칭 결과를 반환하지 않습니다

```sql
SELECT id
FROM test_variant_search_subcolumn
WHERE SEARCH('properties.message:alpha');
```

## 전체 예제 {#complete-example}

다음 종합 예제에서는 같은 컬럼에 토큰화 인덱스와 비토큰화 인덱스를 모두 생성하고, EXACT, ANY/ALL, 구문 및 와일드카드 쿼리를 조합하는 방법을 보여 줍니다.

### 테이블과 기본 인덱스 생성 {#create-the-table-and-base-indexes}

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

### 조건 조합과 간소화된 형식 {#combined-conditions-and-simplified-forms}

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

### VARIANT 컬럼 검색 예제 {#variant-column-search-example}

```sql
-- A VARIANT column with an inverted index
CREATE TABLE test_variant_search_subcolumn (
    id BIGINT,
    properties VARIANT<PROPERTIES("variant_max_subcolumns_count"="0")>,
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

DSL에서 특수 문자를 이스케이프하려면 백슬래시(`\`)를 사용합니다.

| 이스케이프 | 설명 | 예제 |
| --- | --- | --- |
| `\ ` | 리터럴 공백(검색어 연결) | `title:First\ Value`는 "First Value"와 매칭 |
| `\(` `\)` | 리터럴 괄호 | `title:hello\(world\)`는 "hello(world)"와 매칭 |
| `\:` | 리터럴 콜론 | `title:key\:value`는 "key:value"와 매칭 |
| `\\` | 리터럴 백슬래시 | `title:path\\to\\file`은 "path\to\file"과 매칭 |

**예제:**

```sql
-- Search for a value containing a space as a single term
SELECT * FROM docs WHERE SEARCH('title:First\\ Value');

-- Search for a value containing parentheses
SELECT * FROM docs WHERE SEARCH('title:hello\\(world\\)');

-- Search for a value containing a colon
SELECT * FROM docs WHERE SEARCH('title:key\\:value');
```

> **참고:** SQL 문자열에서는 백슬래시를 이중으로 이스케이프해야 합니다. SQL에서 `\\`를 사용하면 DSL에는 단일 `\`가 생성됩니다.

## 현재 제한 사항 {#current-limitations}

- 범위 및 목록 절(예: `field:[a TO b]` 및 `field:IN(...)`)은 여전히 일반 검색어 매칭으로 폴백합니다. 대신 일반 SQL 범위 필터나 `IN` 필터를 사용하세요.

대안으로 표준 연산자나 텍스트 검색 연산자를 사용할 수 있습니다.

```sql
-- Filter by range using SQL
SELECT * FROM t WHERE created_at >= '2024-01-01';
```


## 다중 필드 옵션 예제 {#multi-field-options-example}

`fields`와 `type`은 Doris 4.1.0에서 사용할 수 있습니다. `standard` 모드에서 `best_fields`는 전체 쿼리를 각 필드에 복사하고 복사본을 OR로 결합합니다. `cross_fields`는 각 검색어를 여러 필드로 확장합니다. 아래에서 같은 필드와 여러 필드를 구분할 때는 `AND` 또는 `default_operator="and"`를 사용합니다. 기본 OR 연산자에서도 같은 구분이 적용된다고 가정해서는 안 됩니다. `lucene` 모드에서는 절별로 확장하므로, 이러한 표준 모드의 AND 비교는 Lucene의 동작을 설명하지 않습니다.

CREATE, INSERT 및 SELECT 권한이 있는 데이터베이스에서 다음 데이터를 준비하세요.

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

부정 절만 포함하는 Lucene 쿼리는 모든 문서와 매칭되는 조건을 추가하고 부정된 검색어를 제외합니다.

```sql
SELECT id FROM search_multifield
WHERE SEARCH('NOT title:Alice', '{"mode":"lucene"}')
ORDER BY id;
```

```text
id
3
```
