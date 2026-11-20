---
{
    "title": "사용자 지정 분석기",
    "language": "ko",
    "description": "Doris 사용자 지정 분석기는 문자 필터, 토크나이저, 토큰 필터를 결합하여 텍스트 분할 전략을 유연하게 제어하고 역색인의 검색 관련성과 정밀도를 높입니다.",
    "keywords": [
        "custom analyzer",
        "inverted index tokenizer",
        "tokenizer",
        "token_filter",
        "char_filter",
        "edge_ngram",
        "word_delimiter",
        "USING ANALYZER",
        "multi-analyzer index",
        "ik_smart",
        "ik_max_word",
        "max_ngram_diff"
    ]
}
---

<!-- Knowledge type: Feature overview + Configuration parameters + Operating procedures -->
<!-- Applicable scenarios: Inverted index text tokenization customization / Multilingual search / Auto-completion / Exact match -->

사용자 지정 분석기는 **문자 필터(char_filter)**, **토크나이저(tokenizer)**, **토큰 필터(token_filter)**를 결합하여 비즈니스 요구에 따라 텍스트를 검색 가능한 용어로 분할하는 방식을 정밀하게 정의할 수 있게 합니다. 내장 분석기의 한계를 극복하고 검색 관련성과 데이터 분석의 정확도에 직접 영향을 줍니다.

![사용자 지정 분석기 다이어그램](/images/analyzer.png)

### 적용 시나리오 {#applicable-scenarios}

| 시나리오 | 권장 조합 |
| --- | --- |
| 다국어 혼합 텍스트 검색 | `icu` 토크나이저 + `icu_normalizer` 필터 |
| 전화번호 / 코드 접두사 일치 | `edge_ngram` 토크나이저 |
| 복잡한 영어 텍스트 분할(카멜 표기, 하이픈 등) | `standard` 토크나이저 + `word_delimiter` 필터 |
| 자동 완성 / 입력 제안 | `edge_ngram` 토크나이저 + `lowercase` 필터 |
| 정확한 일치(원래 용어 유지) | `keyword` 토크나이저 + `lowercase` / `asciifolding` 필터 |

---

## 핵심 구성 요소 {#core-components}

사용자 지정 분석기는 네 가지 종류의 객체로 구성되며, 원본 텍스트에 다음 순서로 적용됩니다.

```
Original text ──► [char_filter] ──► [tokenizer] ──► [token_filter] ──► Terms
```

| 구성 요소 | 용도 | 개수 |
| --- | --- | --- |
| `char_filter` | 토큰화 전에 문자를 전처리합니다(예: 대체 및 정규화). | 0 ~ N |
| `tokenizer` | 텍스트를 용어로 분할합니다. | 1 |
| `token_filter` | 결과 용어를 처리합니다(예: 소문자 변환 또는 ASCII 폴딩). | 0 ~ N |
| `analyzer` | 위 구성 요소를 완전한 토큰화 파이프라인으로 조합합니다. | 1 |

---

## 사용자 지정 분석기 생성 {#creating-a-custom-analyzer}

### 1. 문자 필터(char_filter) {#1-character-filter-char_filter}

```sql
CREATE INVERTED INDEX CHAR_FILTER IF NOT EXISTS x_char_filter
PROPERTIES (
    "type" = "char_replace"
    -- See below for other parameters
);
```

지원되는 문자 필터 유형:

- **`char_replace`**: 토큰화 전에 지정된 문자를 대상 문자로 대체합니다.
    - `char_filter_pattern`: 대체할 문자 목록
    - `char_filter_replacement`: 대체 문자(기본값: 공백)

- **`icu_normalizer`**: ICU 정규화를 사용하여 텍스트를 전처리합니다.
    - `name`: 정규화 형식(기본값 `nfkc_cf`). 옵션: `nfc`, `nfkc`, `nfkc_cf`, `nfd`, `nfkd`
    - `mode`: 정규화 모드(기본값 `compose`). 옵션: `compose`, `decompose`
    - `unicode_set_filter`: 정규화할 문자 집합을 지정합니다(예: `[a-z]`).

### 2. 토크나이저 {#2-tokenizer}

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS x_tokenizer
PROPERTIES (
    "type" = "standard"
);
```

지원되는 토크나이저 유형:

| 유형 | 설명 | 주요 매개변수 |
| --- | --- | --- |
| `standard` | 표준 토큰화(Unicode 텍스트 분할을 따름)로, 대부분의 언어에 적합합니다. | 없음 |
| `ngram` | N-그램으로 분할합니다. | `min_gram`, `max_gram`, `max_ngram_diff`, `token_chars` |
| `edge_ngram` | 단어의 시작 위치부터 N-그램을 생성합니다. | `min_gram`, `max_gram`, `token_chars` |
| `keyword` | 전체 텍스트를 하나의 용어로 출력하며, 일반적으로 token_filter와 함께 사용합니다. | 없음 |
| `char_group` | 지정된 문자로 분할합니다. | `tokenize_on_chars` |
| `basic` | 간단한 영어 / 숫자 / 중국어 / Unicode 토큰화입니다. | `extra_chars` |
| `icu` | ICU 국제화 토큰화로, 여러 언어의 복잡한 스크립트를 지원합니다. | 없음 |
| `ik_smart` | 완전한 단어를 우선하는 IK 스마트 중국어 토큰화이며, 4.1.5부터 사용자 지정 분석기에서 사용할 수 있습니다. | 없음 |
| `ik_max_word` | 겹칠 수 있는 용어를 더 많이 생성하는 IK 세분화 중국어 토큰화이며, 4.1.5부터 사용자 지정 분석기에서 사용할 수 있습니다. | 없음 |

매개변수 설명:

- `min_gram`: 최소 길이(기본값 1)
- `max_gram`: 최대 길이(기본값 2)
- `token_chars`: 유지할 문자 범주(기본값: 모두 유지). 옵션: `letter`, `digit`, `whitespace`, `punctuation`, `symbol`
- `tokenize_on_chars`: 문자 목록 또는 범주입니다. 범주는 `whitespace`, `letter`, `digit`, `punctuation`, `symbol`, `cjk`를 지원합니다.
- `extra_chars`: 추가로 분할할 ASCII 문자(예: `[]().`)

#### Ngram 범위 제한(4.1.5부터) {#ngram-range-limits-since-415}

4.1.5부터 `ngram` 토크나이저는 `max_ngram_diff`를 지원하여 최대 gram 길이와 최소 gram 길이의 차이에 대한 기존 제한 `1`을 완화할 수 있습니다. `mode` 속성이 없는 일반 `ngram` 토크나이저를 생성할 때는 다음 조건을 검증합니다.

| 매개변수 | 기본값 | 제약 조건 |
| --- | --- | --- |
| `min_gram` | `1` | `max_gram` 이하인 양의 정수이며, 새 `ngram` 토크나이저에서는 최대 `1024`입니다. |
| `max_gram` | `2` | `min_gram` 이상인 양의 정수이며, 새 `ngram` 토크나이저에서는 최대 `1024`입니다. |
| `max_ngram_diff` | `1` | `0`부터 `255`까지의 정수이며 `max_gram - min_gram <= max_ngram_diff`를 만족해야 합니다. 값이 `0`이면 길이가 고정된 N-그램만 허용됩니다. |

예를 들어 `min_gram=1` 및 `max_gram=8`에는 `max_ngram_diff`가 최소 `7`이어야 합니다. 이를 생략하면 `The difference between max_gram and min_gram in NGram Tokenizer must be less than or equal to: [ 1 ] but was [7]` 오류와 함께 생성이 실패합니다. 전체 사용법은 [예제 5](#example-5-expand-the-ngram-length-range-since-415)를 참조하세요.

이러한 제한과 `max_ngram_diff`는 `mode` 속성이 없는 일반 `ngram` 토크나이저에 적용됩니다. `mode`를 지정하는 토크나이저는 별도의 검증을 사용하며 이러한 제한을 무시합니다. `edge_ngram`은 이 매개변수를 허용하지 않으므로 전화번호 및 자동 완성 예제에서는 각각의 `min_gram` 및 `max_gram` 설정을 그대로 사용합니다. 범위가 넓을수록 입력 위치마다 더 많은 용어가 생성됩니다. 불필요한 인덱스 증가를 방지하려면 검색 요구 사항에 맞게 범위를 설정하세요.

### 3. 토큰 필터 {#3-token-filter}

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS x_token_filter
PROPERTIES (
    "type" = "word_delimiter"
);
```

지원되는 토큰 필터 유형:

| 유형 | 용도 |
| --- | --- |
| `word_delimiter` | 영숫자가 아닌 문자에서 분할하고 정규화를 수행할 수 있습니다. |
| `ascii_folding` | ASCII가 아닌 문자를 해당 ASCII 문자로 매핑합니다. |
| `lowercase` | 토큰 텍스트를 소문자로 변환합니다. |
| `icu_normalizer` | ICU 정화를 사용하여 토큰을 처리합니다. |

#### word_delimiter 세부 정보 {#word_delimiter-details}

기본 동작:

1. 영숫자가 아닌 문자를 구분 기호로 사용합니다(예: `Super-Duper`를 `Super`, `Duper`로 분할).
2. 토큰의 앞뒤 구분 기호를 제거합니다(예: `XL---42+'Autocoder'`를 `XL`, `42`, `Autocoder`로 변환).
3. 대소문자가 전환되는 지점에서 분할합니다(예: `PowerShot`을 `Power`, `Shot`으로 분할).
4. 문자와 숫자의 경계에서 분할합니다(예: `XL500`을 `XL`, `500`으로 분할).
5. 영어 소유격 `'s`를 제거합니다(예: `Neil's`를 `Neil`로 변환).

선택적 매개변수:

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `generate_number_parts` | `true` | 숫자 부분을 출력할지 여부 |
| `generate_word_parts` | `true` | 단어 부분을 출력할지 여부 |
| `protected_words` | 없음 | 분할하지 않을 보호된 단어 |
| `split_on_case_change` | `true` | 대소문자 변경 지점에서 분할할지 여부 |
| `split_on_numerics` | `true` | 문자와 숫자의 경계에서 분할할지 여부 |
| `stem_english_possessive` | `true` | 영어 소유격 `'s`를 제거할지 여부 |
| `type_table` | 없음 | 사용자 지정 문자 유형 매핑 테이블 |

`type_table`은 다음 매핑 유형을 지원합니다.

- `ALPHA`(문자)
- `ALPHANUM`(영숫자)
- `DIGIT`(숫자)
- `LOWER`(소문자)
- `SUBWORD_DELIM`(영숫자가 아닌 구분 기호)
- `UPPER`(대문자)

예: `["+ => ALPHA", "- => ALPHA"]`는 `+`와 `-`를 문자로 처리하여 분할 지점으로 사용하지 않습니다.

#### icu_normalizer 매개변수 {#icu_normalizer-parameters}

- `name`: 정규화 형식(기본값 `nfkc_cf`). 옵션: `nfc`, `nfkc`, `nfkc_cf`, `nfd`, `nfkd`
- `unicode_set_filter`: 정규화할 문자 집합을 지정합니다.

### 4. 분석기 {#4-analyzer}

위 구성 요소를 완전한 토큰화 파이프라인으로 조합합니다.

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS x_analyzer
PROPERTIES (
    "tokenizer" = "x_tokenizer",            -- A single tokenizer
    "token_filter" = "x_filter1, x_filter2" -- One or more token_filters, executed in order
);
```

---

## 테이블에서 사용자 지정 분석기 사용 {#using-a-custom-analyzer-in-a-table}

인덱스 `PROPERTIES`의 `analyzer` 필드를 통해 생성한 사용자 지정 분석기를 참조합니다.

```sql
CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("analyzer" = "x_custom_analyzer", "support_phrase" = "true")
)
table_properties;
```

참고:

1. 사용자 지정 분석기는 인덱스 `PROPERTIES`에서 `analyzer`를 통해 설정합니다.
2. `analyzer`와 함께 사용할 수 있는 속성은 `support_phrase`뿐입니다.

---

## 단일 열의 여러 분석기 인덱스 {#multiple-analyzer-indexes-on-a-single-column}

Doris는 동일한 열에 서로 다른 토크나이저를 사용하는 여러 역색인을 생성할 수 있으므로, 같은 데이터를 서로 다른 토큰화 전략으로 검색할 수 있습니다.

### 사용 사례 {#use-cases}

- **다국어 지원**: 동일한 텍스트 열에 여러 언어용 토크나이저를 사용합니다.
- **검색 정밀도와 재현율의 균형**: 정확한 일치에는 keyword 토크나이저를 사용하고 퍼지 검색에는 standard 토크나이저를 사용합니다.
- **자동 완성**: 접두사 일치에는 edge_ngram 토크나이저를 사용하고 일반 검색에는 standard 토크나이저를 사용합니다.

### 여러 인덱스 생성 {#creating-multiple-indexes}

```sql
-- 1. Create tokenizers with different tokenization strategies
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS std_analyzer
PROPERTIES ("tokenizer" = "standard", "token_filter" = "lowercase");

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS kw_analyzer
PROPERTIES ("tokenizer" = "keyword", "token_filter" = "lowercase");

CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS edge_ngram_tokenizer
PROPERTIES (
    "type" = "edge_ngram",
    "min_gram" = "1",
    "max_gram" = "20",
    "token_chars" = "letter"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS ngram_analyzer
PROPERTIES ("tokenizer" = "edge_ngram_tokenizer", "token_filter" = "lowercase");

-- 2. Create multiple indexes on the same column
CREATE TABLE articles (
    id INT,
    content TEXT,
    -- Standard tokenizer for tokenized search
    INDEX idx_content_std (content) USING INVERTED
        PROPERTIES("analyzer" = "std_analyzer", "support_phrase" = "true"),
    -- Keyword tokenizer for exact matching
    INDEX idx_content_kw (content) USING INVERTED
        PROPERTIES("analyzer" = "kw_analyzer"),
    -- edge n-gram tokenizer for auto-completion
    INDEX idx_content_ngram (content) USING INVERTED
        PROPERTIES("analyzer" = "ngram_analyzer")
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");
```

### 쿼리 시 분석기 지정 {#specifying-an-analyzer-at-query-time}

`USING ANALYZER` 절을 사용하여 사용할 인덱스를 지정합니다.

```sql
-- Insert test data
INSERT INTO articles VALUES
    (1, 'hello world'),
    (2, 'hello'),
    (3, 'world'),
    (4, 'hello world test');

-- Tokenized search: matches rows containing the term 'hello'
-- Returns: 1, 2, 4
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER std_analyzer ORDER BY id;

-- Exact match: matches only the exact 'hello' string
-- Returns: 2
SELECT id FROM articles WHERE content MATCH 'hello' USING ANALYZER kw_analyzer ORDER BY id;

-- Use edge n-gram for prefix matching
-- Returns: 1, 2, 4 (all rows starting with 'hel')
SELECT id FROM articles WHERE content MATCH 'hel' USING ANALYZER ngram_analyzer ORDER BY id;
```

내장 토크나이저를 직접 사용할 수도 있습니다.

```sql
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER standard;
SELECT * FROM articles WHERE content MATCH 'hello' USING ANALYZER none;
SELECT * FROM articles WHERE content MATCH 'Hello' USING ANALYZER chinese;
```

### 기존 테이블에 인덱스 추가 {#adding-an-index-to-an-existing-table}

```sql
-- Add a new index that uses a different tokenizer
ALTER TABLE articles ADD INDEX idx_content_chinese (content)
USING INVERTED PROPERTIES("parser" = "chinese");

-- Wait for the schema change to complete
SHOW ALTER TABLE COLUMN WHERE TableName='articles';
```

### 인덱스 빌드 {#building-an-index}

컴퓨트-스토리지 통합 모드에서는 기존 데이터에 대해 추가된 역색인을 명시적으로 빌드합니다.

```sql
BUILD INDEX idx_content_chinese ON articles;
SHOW BUILD INDEX WHERE TableName = 'articles';
```

Doris 4.1.5 컴퓨트-스토리지 분리 모드에서는 앞의 예제에서 추가한 토큰화 인덱스가 스키마 변경을 통해 기존 데이터를 빌드합니다. `SHOW ALTER TABLE COLUMN`이 `FINISHED`를 보고할 때까지 기다리세요. 해당 인덱스에 대해 추가로 `BUILD INDEX`를 실행하면 빌드할 필요가 없는 것으로 판단되어 거부됩니다.

`enable_add_index_for_new_data=true`로 추가한 비토큰화 역색인과 NGram BloomFilter 인덱스는 기존 데이터의 별도 보충 빌드를 지원합니다. 이 경우 클라우드 구문은 인덱스 이름 없이 `BUILD INDEX ON table_name`입니다. [배포별 빌드 예제](./overview.md#cloud-index-build)를 참조하세요. 이 Doris 4.1.5 동작은 최신 커널의 SNII 빌드 경로를 설명하지 않습니다.

### 주요 참고 사항 {#key-notes}

1. **토크나이저 식별성**: 동일한 `tokenizer` 및 `token_filter` 구성을 가진 두 토크나이저는 동일한 것으로 간주됩니다. 같은 열에 동일한 토크나이저 식별성을 공유하는 여러 인덱스를 생성할 수 없습니다.
2. **인덱스 선택 동작**:
    - `USING ANALYZER`를 지정하면 지정된 토크나이저의 인덱스가 존재하고 빌드된 경우 해당 인덱스를 사용합니다.
    - 인덱스가 빌드되지 않은 경우 쿼리는 인덱스를 사용하지 않는 경로로 대체됩니다(결과는 정확하지만 성능이 느립니다).
    - `USING ANALYZER`를 지정하지 않으면 사용 가능한 인덱스가 사용될 수 있습니다.
3. **성능 고려 사항**:
    - 인덱스를 추가할 때마다 스토리지 공간과 쓰기 오버헤드가 증가합니다.
    - 실제 쿼리 패턴에 따라 토크나이저를 선택하세요.
    - 쿼리 패턴을 예측할 수 있다면 더 적은 수의 인덱스를 사용하는 것을 고려하세요.

---

## 관리 및 유지 보수 {#management-and-maintenance}

### 보기 {#view}

```sql
SHOW INVERTED INDEX TOKENIZER;
SHOW INVERTED INDEX TOKEN_FILTER;
SHOW INVERTED INDEX ANALYZER;
```

### 삭제 {#delete}

```sql
DROP INVERTED INDEX TOKENIZER IF EXISTS x_tokenizer;
DROP INVERTED INDEX TOKEN_FILTER IF EXISTS x_token_filter;
DROP INVERTED INDEX ANALYZER IF EXISTS x_analyzer;
```

---

## 전체 예제 {#complete-examples}

### 예제 1: 전화번호 접두사 일치 {#example-1-phone-number-prefix-matching}

`edge_ngram`을 사용하여 전화번호의 모든 접두사 조각을 생성하면 입력하면서 검색할 수 있습니다.

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS edge_ngram_phone_number_tokenizer
PROPERTIES
(
    "type" = "edge_ngram",
    "min_gram" = "3",
    "max_gram" = "10",
    "token_chars" = "digit"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS edge_ngram_phone_number
PROPERTIES
(
    "tokenizer" = "edge_ngram_phone_number_tokenizer"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "edge_ngram_phone_number")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

SELECT tokenize('13891972631', '"analyzer"="edge_ngram_phone_number"');
```

결과:

```json
[
    {"token":"138"},
    {"token":"1389"},
    {"token":"13891"},
    {"token":"138919"},
    {"token":"1389197"},
    {"token":"13891972"},
    {"token":"138919726"},
    {"token":"1389197263"}
]
```

### 예제 2: 복잡한 영어 텍스트의 세분화된 토큰화 {#example-2-fine-grained-tokenization-for-complex-english-text}

`standard` 토크나이저를 `word_delimiter`와 함께 사용하여 더 세분화된 토큰화를 수행하고, 대소문자 정규화와 ASCII 폴딩을 추가합니다.

```sql
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS word_splitter
PROPERTIES
(
    "type" = "word_delimiter",
    "split_on_numerics" = "false",
    "split_on_case_change" = "false"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS lowercase_delimited
PROPERTIES
(
    "tokenizer" = "standard",
    "token_filter" = "asciifolding, word_splitter, lowercase"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "lowercase_delimited")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

SELECT tokenize('The server at IP 192.168.1.15 sent a confirmation to user_123@example.com, requiring a quickResponse before the deadline.', '"analyzer"="lowercase_delimited"');
```

결과:

```json
[
    {"token":"the"},
    {"token":"server"},
    {"token":"at"},
    {"token":"ip"},
    {"token":"192"},
    {"token":"168"},
    {"token":"1"},
    {"token":"15"},
    {"token":"sent"},
    {"token":"a"},
    {"token":"confirmation"},
    {"token":"to"},
    {"token":"user"},
    {"token":"123"},
    {"token":"example"},
    {"token":"com"},
    {"token":"requiring"},
    {"token":"a"},
    {"token":"quickresponse"},
    {"token":"before"},
    {"token":"the"},
    {"token":"deadline"}
]
```

### 예제 3: 원래 용어를 유지하는 정확한 일치 {#example-3-exact-match-with-original-term-preserved}

`keyword` 토크나이저를 사용하여 전체 텍스트를 그대로 유지한 다음 `lowercase`와 `asciifolding`을 적용하여 정규화합니다. 이는 대소문자를 구분하지 않는 문자열의 정확한 일치에 일반적으로 사용됩니다.

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS keyword_lowercase
PROPERTIES
(
    "tokenizer" = "keyword",
    "token_filter" = "asciifolding, lowercase"
);

CREATE TABLE tbl (
    `a` bigint NOT NULL AUTO_INCREMENT(1),
    `ch` text NULL,
    INDEX idx_ch (`ch`) USING INVERTED PROPERTIES("support_phrase" = "true", "analyzer" = "keyword_lowercase")
) ENGINE=OLAP
DUPLICATE KEY(`a`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

SELECT tokenize('hÉllo World', '"analyzer"="keyword_lowercase"');
```

결과:

```json
[
    {"token":"hello world"}
]
```

### 예제 4: IK 스마트 및 세분화된 중국어 토큰화(4.1.5부터) {#example-4-ik-smart-and-fine-grained-chinese-tokenization-since-415}

4.1.5부터 사용자 지정 분석기에서 내장 `ik_smart` 및 `ik_max_word` 토크나이저를 직접 참조하거나, 먼저 `type`이 지정된 이름 있는 토크나이저를 만든 다음 문자 필터 및 토큰 필터와 조합할 수 있습니다. 두 IK 토크나이저에는 추가 토크나이저 매개변수가 없습니다. 둘 다 BE 구성의 `inverted_index_dict_path` 아래 `ik` 디렉터리에 있는 사전을 사용합니다. 토큰화와 인덱스 빌드에 관여하는 모든 BE는 이러한 구성 요소를 지원하고 사전을 읽을 수 있어야 합니다.

아래 예제에서는 직접 참조와 이름 있는 토크나이저를 각각 보여 줍니다. 이러한 구성 요소를 생성하려면 전역 `ADMIN` 권한이 필요합니다. 테이블 생성, 데이터 적재 및 쿼리에는 대상 데이터베이스와 테이블에 대한 해당 권한도 필요합니다.

```sql
CREATE INVERTED INDEX ANALYZER IF NOT EXISTS cn_ik_smart
PROPERTIES ("tokenizer" = "ik_smart");

CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS cn_ik_max_tokenizer
PROPERTIES ("type" = "ik_max_word");

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS cn_ik_max
PROPERTIES ("tokenizer" = "cn_ik_max_tokenizer");
```

성공적으로 생성되면 `Query OK`가 반환됩니다. 구성 요소가 BE에 동기화된 후 `TOKENIZE`로 출력을 비교할 수 있습니다. 다음 결과는 내장 사전을 사용한 것입니다. 사전을 변경하면 토큰이 달라질 수 있습니다.

```sql
SELECT TOKENIZE('中华人民共和国', '"analyzer"="cn_ik_smart"');
```

```json
[{"token":"中华人民共和国"}]
```

```sql
SELECT TOKENIZE('中华人民共和国', '"analyzer"="cn_ik_max"');
```

```json
[
    {"token":"中华人民共和国"},
    {"token":"中华人民"},
    {"token":"中华"},
    {"token":"华人"},
    {"token":"人民共和国"},
    {"token":"人民"},
    {"token":"共和国"},
    {"token":"共和"},
    {"token":"国"}
]
```

테이블의 역색인에서 분석기를 사용합니다.

```sql
CREATE TABLE ik_articles (
    id INT,
    content STRING,
    INDEX idx_content(content) USING INVERTED
        PROPERTIES("analyzer" = "cn_ik_smart")
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_allocation" = "tag.location.default: 1");

INSERT INTO ik_articles VALUES (1, '中华人民共和国');

SELECT id FROM ik_articles
WHERE content MATCH '中华人民共和国' USING ANALYZER cn_ik_smart
ORDER BY id;
```

```text
+----+
| id |
+----+
|  1 |
+----+
```

완전한 중국어 단어를 유지해야 하는 검색에는 `ik_smart`를 사용하고, 더 많은 하위 단어 일치가 필요한 검색에는 `ik_max_word`를 사용하세요. 추가 토큰 처리가 필요하면 분석기의 `token_filter` 속성을 통해 토큰 필터를 추가합니다.

### 예제 5: Ngram 길이 범위 확장(4.1.5부터) {#example-5-expand-the-ngram-length-range-since-415}

이 토크나이저는 `max_ngram_diff=7`을 명시적으로 설정하여 길이 `1`부터 `8`까지의 N-그램을 생성합니다.

```sql
CREATE INVERTED INDEX TOKENIZER IF NOT EXISTS ngram_1_8_tokenizer
PROPERTIES (
    "type" = "ngram",
    "min_gram" = "1",
    "max_gram" = "8",
    "max_ngram_diff" = "7"
);

CREATE INVERTED INDEX ANALYZER IF NOT EXISTS ngram_1_8_analyzer
PROPERTIES ("tokenizer" = "ngram_1_8_tokenizer");
```

성공적으로 생성되고 BE에 동기화된 후 다음을 실행합니다.

```sql
SELECT TOKENIZE('abcdefgh', '"analyzer"="ngram_1_8_analyzer"');
```

```json
[
    {"token":"a"}, {"token":"ab"}, {"token":"abc"}, {"token":"abcd"},
    {"token":"abcde"}, {"token":"abcdef"}, {"token":"abcdefg"}, {"token":"abcdefgh"},
    {"token":"b"}, {"token":"bc"}, {"token":"bcd"}, {"token":"bcde"},
    {"token":"bcdef"}, {"token":"bcdefg"}, {"token":"bcdefgh"},
    {"token":"c"}, {"token":"cd"}, {"token":"cde"}, {"token":"cdef"},
    {"token":"cdefg"}, {"token":"cdefgh"},
    {"token":"d"}, {"token":"de"}, {"token":"def"}, {"token":"defg"}, {"token":"defgh"},
    {"token":"e"}, {"token":"ef"}, {"token":"efg"}, {"token":"efgh"},
    {"token":"f"}, {"token":"fg"}, {"token":"fgh"},
    {"token":"g"}, {"token":"gh"}, {"token":"h"}
]
```


---

## 제한 사항 {#limitations}

1. `tokenizer` 및 `token_filter`의 `type`과 매개변수에는 현재 지원되는 토크나이저와 토큰 필터만 사용할 수 있습니다. 그렇지 않으면 테이블 생성이 실패합니다.
2. 어떤 테이블도 사용하지 않는 경우에만 `analyzer`를 삭제할 수 있습니다.
3. 어떤 `analyzer`도 사용하지 않는 경우에만 `tokenizer` 또는 `token_filter`를 삭제할 수 있습니다.
4. 사용자 지정 분석기 DDL은 실행 후 10초가 지나면 BE에 동기화되며, 이후 데이터 적재에서는 오류가 발생하지 않습니다.

---

## 참고 사항 {#notes}

1. 사용자 지정 `analyzer`에 여러 구성 요소를 중첩하면 토큰화 성능이 저하될 수 있습니다.
2. `select tokenize` 토큰화 함수는 사용자 지정 분석기를 지원하며 토큰화 결과를 디버깅하는 데 사용할 수 있습니다.
3. 동일한 인덱스에는 사전 정의된 `built_in_analyzer`와 사용자 지정 `analyzer` 중 하나만 존재할 수 있습니다.
