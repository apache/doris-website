---
{
    "title": "사용자 정의 Normalizer",
    "language": "ko",
    "description": "Doris 역색인용 사용자 정의 Normalizer 안내: 전체 텍스트를 하나의 토큰으로 처리하고, 대소문자 변환과 악센트 정규화 등을 통해 키워드 정확 일치 시나리오를 지원합니다."
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenario: Keyword exact match / Standardization preprocessing without tokenization -->

사용자 정의 Normalizer는 텍스트에 일관된 전처리를 적용합니다. **텍스트를 분할하지 않고**, 전체 텍스트를 하나의 완전한 토큰으로 처리합니다. 문자 필터(`char_filter`)와 토큰 필터(`token_filter`)를 조합하여 대소문자 변환, 문자 정규화 등의 기능을 지원합니다. 주로 키워드 검색처럼 토큰화는 필요하지 않지만 정규화가 필요한 시나리오에 사용합니다.

**Normalizer와 Analyzer의 차이점**

| 비교 항목 | Normalizer | Analyzer |
| --- | --- | --- |
| 텍스트 분할 여부 | 분할하지 않으며, 전체 텍스트를 하나의 토큰으로 처리 | 규칙에 따라 텍스트를 여러 토큰으로 분할 |
| 일반적인 사용 시나리오 | 키워드 정확 일치(예: 제품 코드, ID) | 전문 검색(예: 문서 본문) |
| 자주 사용하는 필터 | lowercase, ascii_folding 등 | tokenizer + 다양한 필터 |

## 적용 시나리오 {#applicable-scenarios}

- **키워드 검색**: 제품 코드, 제품명, 사용자 ID 등 토큰화는 필요하지 않지만 형식을 통일해야 하는 필드.
- **대소문자를 구분하지 않는 매칭**: `ProductA`와 `producta`를 같은 값으로 처리합니다.
- **악센트 및 특수 문자 정규화**: `Café`를 `cafe`로 정규화하여 기호 차이로 인한 매칭 누락을 방지합니다.

## 사용 절차 {#usage-workflow}

전체 절차는 세 단계로 구성됩니다.

1. (선택 사항) 사용자 정의 `char_filter`와 `token_filter`를 생성합니다.
2. 위 필터를 조합하는 사용자 정의 Normalizer를 생성합니다.
3. 테이블 생성 구문의 역색인 속성에서 Normalizer를 참조합니다.

### 1단계: 사용자 정의 필터 생성(선택 사항) {#step-1-create-custom-filters-optional}

기본 제공 필터가 요구 사항을 충족하지 못하면 먼저 사용자 정의 필터를 생성할 수 있습니다.

> `char_filter`와 `token_filter`를 생성하는 방법은 [사용자 정의 Analyzer](./custom-analyzer.md) 문서를 참조하세요.

### 2단계: 사용자 정의 Normalizer 생성 {#step-2-create-a-custom-normalizer}

```sql
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS x_normalizer
PROPERTIES (
    "char_filter" = "x_char_filter",          -- Optional, one or more character filters
    "token_filter" = "x_filter1, x_filter2"   -- Optional, one or more token filters, executed in order
);
```

**매개변수 설명**

| 매개변수 | 필수 여부 | 설명 |
| --- | --- | --- |
| `char_filter` | 아니요 | 쉼표로 구분한 하나 이상의 문자 필터 이름 |
| `token_filter` | 아니요 | 선언된 순서대로 실행할 하나 이상의 토큰 필터 이름 |

### 3단계: 테이블 생성 구문에서 Normalizer 참조 {#step-3-reference-the-normalizer-in-the-table-creation-statement}

역색인 속성에서 `normalizer`를 사용하여 적용할 Normalizer를 지정합니다.

```sql
CREATE TABLE tbl (
    `id` bigint NOT NULL,
    `code` text NULL,
    INDEX idx_code (`code`) USING INVERTED PROPERTIES("normalizer" = "x_custom_normalizer")
)
...
```

:::caution 참고
`normalizer`와 `analyzer`는 상호 배타적이므로 같은 인덱스에 함께 지정할 수 없습니다.
:::

## 사용자 정의 Normalizer 관리 {#managing-custom-normalizers}

| 작업 | SQL 구문 |
| --- | --- |
| 조회 | `SHOW INVERTED INDEX NORMALIZER;` |
| 삭제 | `DROP INVERTED INDEX NORMALIZER IF EXISTS x_normalizer;` |

## 전체 예제: 대소문자와 악센트 기호 무시 {#complete-example-ignore-case-and-accent-marks}

**시나리오**: 제품명 필드에서 대소문자를 구분하지 않고 악센트 기호도 무시하는 정확 일치를 지원해야 합니다. 예를 들어 `Café-Products`와 `cafe-products`를 같은 값으로 처리합니다.

**구현 단계**:

1. 악센트 기호를 제거하는 사용자 정의 토큰 필터 `my_ascii_folding`을 생성합니다.
2. Normalizer `lowercase_ascii_normalizer`를 생성하여 기본 제공 `lowercase` 필터와 이전 단계의 `my_ascii_folding`을 결합합니다.
3. 테이블을 생성하고 `product_name` 필드에 Normalizer를 적용합니다.
4. `tokenize` 함수로 정규화 결과를 확인합니다.

**SQL 예제**:

```sql
-- 1. Create a custom token filter (when specific parameters are needed)
--    Here, create an ascii_folding filter
CREATE INVERTED INDEX TOKEN_FILTER IF NOT EXISTS my_ascii_folding
PROPERTIES
(
    "type" = "ascii_folding",
    "preserve_original" = "false"
);

-- 2. Create the normalizer
--    Combine lowercase (built-in) and my_ascii_folding
CREATE INVERTED INDEX NORMALIZER IF NOT EXISTS lowercase_ascii_normalizer
PROPERTIES
(
    "token_filter" = "lowercase, my_ascii_folding"
);

-- 3. Use the normalizer when creating a table
CREATE TABLE product_table (
    `id` bigint NOT NULL,
    `product_name` text NULL,
    INDEX idx_name (`product_name`) USING INVERTED PROPERTIES("normalizer" = "lowercase_ascii_normalizer")
) ENGINE=OLAP
DUPLICATE KEY(`id`)
DISTRIBUTED BY RANDOM BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- 4. Verification test
select tokenize('Café-Products', '"normalizer"="lowercase_ascii_normalizer"');
```

**예상 결과**:

```json
[
    {"token":"cafe-products"}
]
```

위 결과처럼 `Café-Products`는 분할되지 않고 하나의 토큰으로 처리되며, 소문자 변환과 악센트 제거가 모두 적용됩니다.

## 제한 사항 {#limitations}

1. `char_filter`와 `token_filter`에서 참조하는 이름은 기본 제공 필터이거나 이미 생성된 필터의 이름이어야 합니다.
2. Normalizer는 이를 사용하는 테이블이 없을 때만 삭제할 수 있습니다.
3. `char_filter` 또는 `token_filter`는 이를 참조하는 Normalizer가 없을 때만 삭제할 수 있습니다.
4. 사용자 정의 Normalizer 구문을 실행한 후 BE에 동기화되기까지 약 10초가 걸립니다. 동기화 이후에 적재되는 데이터부터 정상적으로 적용됩니다.
5. `normalizer`와 `analyzer`는 같은 역색인에 함께 지정할 수 없습니다.
