---
{
    "title": "오류 데이터 처리",
    "language": "ko",
    "description": "데이터 적재 중 타입 변환 실패, 필드 길이 초과, 정밀도 오버플로를 어떻게 처리할까요? strict_mode와 max_filter_ratio를 사용하여 오류 데이터를 유연하게 제어할 수 있습니다.",
    "keywords": [
        "Doris 오류 데이터 처리",
        "strict_mode",
        "max_filter_ratio",
        "데이터 적재 중 데이터 타입 변환 실패",
        "오류 데이터 필터링",
        "Stream Load 오류 데이터",
        "Broker Load 데이터 필터링",
        "Routine Load strict_mode",
        "Insert Into enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Configuration parameters + Operational steps -->
<!-- Applicable scenarios: Data import / Dirty data governance / Troubleshooting -->

데이터 적재 과정에서 원본 컬럼과 대상 컬럼의 데이터 타입이 일치하지 않을 수 있습니다. Doris는 데이터 적재 중 일치하지 않는 타입을 변환하지만, 변환 과정에서 다음과 같은 문제가 발생하여 일부 데이터가 정상적으로 적재되지 않을 수 있습니다.

- 필드 타입 불일치(예: 문자열 `"abc"`를 `TinyInt` 컬럼에 쓰는 경우)
- 필드 길이 초과(예: 11자 문자열을 `char(10)` 컬럼에 쓰는 경우)
- 정밀도 불일치 / 숫자 오버플로(예: `10`을 `Decimal(1,0)` 컬럼에 쓰는 경우)

이러한 예외 상황을 처리하기 위해 Doris는 데이터 적재를 제어하는 두 가지 핵심 매개변수를 제공합니다.

| 매개변수 | 기능 | 기본값 |
| --- | --- | --- |
| `strict_mode` | 컬럼 타입 변환에 실패한 데이터 행을 필터링할지 여부를 제어합니다 | `false` |
| `max_filter_ratio` | 전체 데이터에서 허용할 수 있는 비정상 데이터의 최대 비율을 설정합니다 | `0` |

> 이 두 매개변수를 조합하면 "데이터 품질을 엄격하게 보장"하는 방식과 "소량의 오류 데이터를 허용"하는 방식 사이에서 유연하게 균형을 맞출 수 있습니다.

## 엄격 모드(strict_mode) {#strict-mode-strict_mode}

<!-- Knowledge type: Configuration parameter description -->

엄격 모드(`strict_mode`)의 주요 기능은 데이터 적재 과정에서 **컬럼 타입 변환에 실패한** 데이터 행을 필터링하는 것입니다.

### 컬럼 타입 변환 실패 시 필터링 전략 {#filtering-strategy-for-column-type-conversion-failures}

엄격 모드 설정에 따라 시스템은 다음과 같이 서로 다른 처리 전략을 적용합니다.

- **엄격 모드 비활성화**: 변환에 실패한 필드를 `NULL`로 설정하고, 이러한 `NULL` 값을 포함한 비정상 데이터 행을 정상 데이터 행과 함께 적재합니다.
- **엄격 모드 활성화**: 시스템이 변환에 실패한 데이터 행을 필터링하고 정상 데이터 행만 적재합니다. 여기서 "변환 실패"는 원본 데이터가 `NULL`이 아니지만 컬럼 타입 변환 후 결과가 `NULL`이 되는 경우를 의미합니다. 이때 컬럼 타입 변환에는 함수 연산으로 생성된 `NULL` 값이 포함되지 않습니다.
- **NULL 값 처리**: 정상 데이터 행과 비정상 데이터 행 모두 `NULL` 값을 포함할 수 있습니다. 대상 컬럼이 `NULL` 값을 허용하지 않도록 정의되어 있으면 `NULL` 값을 포함한 데이터 행이 필터링됩니다.

다음 세 가지 대표적인 컬럼 타입 예시를 통해 엄격 모드 활성화 여부에 따른 동작 차이를 설명합니다.

#### 예제 1: TinyInt 컬럼 타입 {#example-1-column-type-tinyint}

| 원본 데이터 유형 | 원본 데이터 예시 | TinyInt 변환 후 값 | 엄격 모드 | 결과 |
| ------------ | ---------------- | --------------------- | ------------ | ---------------- |
| NULL 값 | `\N` | `NULL` | 활성화 또는 비활성화 | `NULL` |
| NULL이 아닌 값 | `"abc"` 또는 `2000` | `NULL` | 활성화 | 유효하지 않은 값(필터링됨) |
| NULL이 아닌 값 | `"abc"` 또는 `2000` | `NULL` | 비활성화 | `NULL` |
| NULL이 아닌 값 | `1` | `1` | 활성화 또는 비활성화 | 정상적으로 적재됨 |

:::tip
1. 테이블의 컬럼은 NULL 값 적재를 허용합니다.
2. `TinyInt`로 변환할 때 `abc`와 `2000`은 타입 또는 정밀도 문제로 인해 `NULL`이 됩니다. 엄격 모드를 활성화하면 이러한 데이터가 필터링되고, 비활성화하면 `NULL`이 적재됩니다.
:::

#### 예제 2: Decimal(1,0) 컬럼 타입 {#example-2-column-type-decimal10}

| 원본 데이터 유형 | 원본 데이터 예시 | Decimal 변환 후 값 | 엄격 모드 | 결과 |
| ------------ | ------------ | --------------------- | ------------ | ---------------- |
| NULL 값 | `\N` | `NULL` | 활성화 또는 비활성화 | `NULL` |
| NULL이 아닌 값 | `aaa` | `NULL` | 활성화 | 유효하지 않은 값(필터링됨) |
| NULL이 아닌 값 | `aaa` | `NULL` | 비활성화 | `NULL` |
| NULL이 아닌 값 | `10` | `NULL` (오버플로) | 활성화 | 필터링됨 |
| NULL이 아닌 값 | `10` | `NULL` (오버플로) | 비활성화 | `NULL` |

:::tip
1. 테이블의 컬럼은 NULL 값 적재를 허용합니다.
2. `Decimal`로 변환할 때 `aaa`는 타입 문제로 인해 `NULL`이 됩니다. 엄격 모드를 활성화하면 이러한 데이터가 필터링되고, 비활성화하면 `NULL`이 적재됩니다.
3. `10`은 `Decimal(1, 0)`의 범위를 초과하는 값이므로 `NULL`로 변환됩니다. 엄격 모드를 활성화하면 필터링되고, 비활성화하면 `NULL`이 적재됩니다.
:::

#### 예제 3: char(10) 컬럼 타입 {#example-3-column-type-char10}

| 원본 데이터 유형 | 원본 데이터 예시 | char(10) 변환 후 값 | 엄격 모드 | 결과 |
| ------------ | -------------- | ---------------------- | -------- | ------------------- |
| NULL 값 | `\N` | `NULL` | 활성화 또는 비활성화 | `NULL` |
| NULL이 아닌 값 | `a1234567890` | `a1234567890` | 활성화 | 길이 초과로 필터링됨 |
| NULL이 아닌 값 | `a1234567890` | `a1234567890` | 비활성화 | `a123456789` (잘림) |

:::tip
테이블의 컬럼은 NULL 값 적재를 허용합니다.
:::

### 엄격 모드 활성화 {#enabling-strict-mode}

`strict_mode`의 기본값은 `false`입니다. 데이터 적재 방식별로 엄격 모드를 활성화하는 예제는 다음과 같습니다.

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
    -H "strict_mode: true" \
    -T data.txt \
    http://host:port/api/example_db/test_table/_stream_load
```

**Broker Load**

```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Routine Load**

```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA (...);
```

**MySQL Load**

```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "strict_mode" = "true"
);
```

**Insert Into**

```sql
SET enable_insert_strict = true;
INSERT INTO test_table ...;
```

## 최대 필터링 비율(max_filter_ratio) {#maximum-filter-ratio-max_filter_ratio}

<!-- Knowledge type: Configuration parameter description -->

최대 필터링 비율(`max_filter_ratio`)은 데이터 적재 과정에서 전체 데이터 대비 허용할 수 있는 비정상 데이터의 최대 비율을 정의하는 중요한 제어 매개변수입니다.

- 실제 필터링 비율이 설정된 최대 필터링 비율보다 **낮으면**, 데이터 적재 작업이 계속 진행되고 비정상 데이터는 무시됩니다.
- 실제 필터링 비율이 설정된 최대 필터링 비율을 **초과하면**, 데이터 적재 작업이 실패합니다.

### 필터링 비율 계산 방식 {#how-the-filter-ratio-is-calculated}

데이터 적재 시 데이터 행은 다음 세 가지 범주로 나뉩니다.

| 범주 | 설명 |
| --- | --- |
| **필터링된 행** | 데이터 품질 문제로 필터링된 행입니다. 데이터 품질 문제에는 타입 오류, 정밀도 오류, 문자열 길이 초과, 파일의 컬럼 수 불일치 및 기타 데이터 형식 문제가 포함됩니다. 해당하는 파티션이 없어 필터링된 데이터 행도 포함됩니다. |
| **선택되지 않은 행** | [사전 필터](./load-data-convert.md#pre-filtering) 또는 [사후 필터](./load-data-convert.md#post-filtering) 조건에 의해 필터링된 데이터 행입니다. |
| **적재된 행** | 정상적으로 적재된 데이터 행입니다. |

필터링 비율은 다음과 같이 계산합니다.

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

즉, `Unselected Rows`는 필터링 비율 계산에 포함되지 않습니다.

### 최대 필터링 비율 설정 {#setting-the-maximum-filter-ratio}

`max_filter_ratio`의 기본값은 `0`이며, 이는 비정상 데이터를 허용하지 않는다는 의미입니다. 데이터 적재 방식별 예제는 다음과 같습니다.

**Stream Load**

```shell
curl --location-trusted -u user:passwd \
    -H "max_filter_ratio: 0.1" \
    -T data.txt \
    http://host:port/api/example_db/my_table/_stream_load
```

**Broker Load**

```sql
LOAD LABEL example_db.label_1
(
    DATA INFILE("s3://bucket/data.txt")
    INTO TABLE test_table
)
WITH S3 (...)
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Routine Load**

```sql
CREATE ROUTINE LOAD example_db.job1 ON test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
)
FROM KAFKA (...);
```

**MySQL Load**

```sql
LOAD DATA LOCAL INFILE 'data.txt'
INTO TABLE test_table
PROPERTIES
(
    "max_filter_ratio" = "0.1"
);
```

**Insert Into**

```sql
SET insert_max_filter_ratio = 0.1;
INSERT INTO test_table FROM S3/HDFS/LOCAL();
```

:::tip
Insert Into 문에서는 `insert_max_filter_ratio`가 `enable_insert_strict = false`일 때만 적용됩니다. 기본값은 `1.0`이며, 이는 모든 비정상 데이터를 필터링할 수 있음을 의미합니다.
:::

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**질문 1: `strict_mode`와 `max_filter_ratio`를 어떻게 함께 사용해야 하나요?**

- **엄격한 데이터 품질**이 필요한 경우: `strict_mode = true`를 활성화하고 `max_filter_ratio`를 작은 값(예: `0`)으로 설정합니다. 변환 실패가 발생하면 데이터 적재가 실패합니다.
- **소량의 오류 데이터를 허용**하려는 경우: `strict_mode`를 비활성화하거나 기본값을 유지하고, `max_filter_ratio`를 허용 가능한 비율(예: `0.1`)로 설정합니다. 전체 데이터 적재에 영향을 주지 않고 비정상 데이터를 필터링합니다.

**질문 2: 함수 연산으로 생성된 `NULL` 값도 엄격 모드에서 필터링되나요?**

아니요. 엄격 모드는 "원본 데이터가 NULL이 아니지만 컬럼 타입 변환 후 결과가 NULL이 되는 경우"에만 적용됩니다. 함수 연산으로 생성된 `NULL` 값은 여기에 해당하지 않습니다.

**질문 3: 사전 필터 또는 사후 필터 조건으로 필터링된 데이터 행도 `max_filter_ratio` 계산에 포함되나요?**

아니요. `Unselected Rows`는 필터링 비율 계산에 포함되지 않습니다. 필터링 비율은 `Filtered Rows`와 `Loaded Rows`만을 기준으로 계산합니다.

**질문 4: Insert Into에서 `enable_insert_strict`와 `insert_max_filter_ratio`는 어떤 관계인가요?**

`insert_max_filter_ratio`는 `enable_insert_strict = false`일 때만 적용됩니다. 기본값은 `1.0`이며, 이는 모든 비정상 데이터를 필터링할 수 있음을 의미합니다.

**질문 5: 엄격 모드와 비엄격 모드는 `char(10)` 컬럼에 길이를 초과하는 데이터가 들어올 때 어떻게 다르게 동작하나요?**

- 엄격 모드 활성화: 길이를 초과하는 데이터가 필터링됩니다.
- 엄격 모드 비활성화: 길이를 초과하는 데이터는 잘린 후 적재됩니다(예: `a1234567890`이 `a123456789`로 잘립니다).
