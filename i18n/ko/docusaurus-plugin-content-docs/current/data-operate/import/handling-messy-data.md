---
{
    "title": "비정상 데이터 처리",
    "language": "ko",
    "description": "데이터를 적재할 때 발생하는 타입 변환 실패, 필드 길이 초과, 정밀도 초과를 처리하는 방법을 설명합니다. strict_mode와 max_filter_ratio로 불량 데이터를 유연하게 제어할 수 있습니다.",
    "keywords": [
        "Doris 비정상 데이터 처리",
        "strict_mode",
        "max_filter_ratio",
        "데이터 적재 시 타입 변환 실패",
        "불량 데이터 필터링",
        "Stream Load 비정상 데이터",
        "Broker Load 데이터 필터링",
        "Routine Load strict_mode",
        "Insert Into enable_insert_strict"
    ]
}
---

<!-- Knowledge type: Configuration parameters + Operational steps -->
<!-- Applicable scenarios: Data import / Dirty data governance / Troubleshooting -->

데이터를 적재할 때 원본 열과 대상 열의 데이터 타입이 다를 수 있습니다. Doris는 적재 과정에서 서로 다른 타입을 변환하지만, 다음과 같은 문제로 일부 데이터를 올바르게 적재하지 못할 수 있습니다.

- 필드 타입 불일치(예: 문자열 `"abc"`를 `TinyInt` 열에 쓰는 경우)
- 필드 길이 초과(예: 11자를 `char(10)` 열에 쓰는 경우)
- 정밀도 불일치 또는 숫자 오버플로(예: `10`을 `Decimal(1,0)` 열에 쓰는 경우)

이러한 예외를 처리하기 위해 Doris는 두 가지 주요 적재 제어 매개변수를 제공합니다.

| 매개변수 | 기능 | 기본값 |
| --- | --- | --- |
| `strict_mode` | 열 타입 변환에 실패한 데이터 행을 필터링할지 제어 | `false` |
| `max_filter_ratio` | 전체 데이터에서 허용할 수 있는 비정상 데이터의 최대 비율 설정 | `0` |

> 두 매개변수를 함께 사용하면 데이터 품질을 엄격하게 보장하는 방식과 소량의 불량 데이터를 허용하는 방식 사이에서 유연하게 선택할 수 있습니다.

## 엄격 모드(strict_mode) {#strict-mode-strict_mode}

<!-- Knowledge type: Configuration parameter description -->

엄격 모드(`strict_mode`)의 주요 기능은 적재 과정에서 **열 타입 변환에 실패한** 데이터 행을 필터링하는 것입니다.

### 열 타입 변환 실패 시 필터링 방식 {#filtering-strategy-for-column-type-conversion-failures}

시스템은 엄격 모드 설정에 따라 데이터를 다르게 처리합니다.

- **엄격 모드 비활성화**: 변환에 실패한 필드는 `NULL`로 설정되며, 이러한 `NULL` 값이 포함된 비정상 데이터 행도 정상 데이터 행과 함께 적재됩니다.
- **엄격 모드 활성화**: 변환에 실패한 데이터 행을 필터링하고 정상 데이터 행만 적재합니다. 여기서 "변환 실패"란 원본 데이터가 `NULL`이 아닌데 열 타입 변환 후 결과가 `NULL`이 되는 경우를 뜻합니다. 함수 계산으로 생성된 `NULL` 값은 여기서 말하는 열 타입 변환 결과에 포함되지 않습니다.
- **NULL 값 처리**: 정상 데이터 행과 비정상 데이터 행 모두 `NULL` 값을 포함할 수 있습니다. 대상 열이 `NULL` 값을 허용하지 않도록 정의되어 있으면 `NULL` 값이 포함된 데이터 행은 필터링됩니다.

다음 세 가지 대표적인 열 타입 예시를 통해 엄격 모드의 활성화 여부에 따른 동작 차이를 살펴보겠습니다.

#### 예시 1: TinyInt 열 타입 {#example-1-column-type-tinyint}

| 원본 데이터 타입 | 원본 데이터 예시 | TinyInt로 변환한 값 | 엄격 모드 | 결과 |
| ------------ | ---------------- | --------------------- | ------------ | ---------------- |
| NULL 값 | `\N` | `NULL` | 활성화 또는 비활성화 | `NULL` |
| NULL이 아닌 값 | `"abc"` 또는 `2000` | `NULL` | 활성화 | 유효하지 않은 값(필터링됨) |
| NULL이 아닌 값 | `"abc"` 또는 `2000` | `NULL` | 비활성화 | `NULL` |
| NULL이 아닌 값 | `1` | `1` | 활성화 또는 비활성화 | 정상적으로 적재됨 |

:::tip
1. 표의 열은 NULL 값 적재를 허용합니다.
2. `TinyInt`로 변환하면 `abc`와 `2000`은 타입 또는 정밀도 문제로 `NULL`이 됩니다. 엄격 모드가 활성화되어 있으면 이러한 데이터가 필터링되고, 비활성화되어 있으면 `NULL`이 적재됩니다.
:::

#### 예시 2: Decimal(1,0) 열 타입 {#example-2-column-type-decimal10}

| 원본 데이터 타입 | 원본 데이터 예시 | Decimal로 변환한 값 | 엄격 모드 | 결과 |
| ------------ | ------------ | --------------------- | ------------ | ---------------- |
| NULL 값 | `\N` | `NULL` | 활성화 또는 비활성화 | `NULL` |
| NULL이 아닌 값 | `aaa` | `NULL` | 활성화 | 유효하지 않은 값(필터링됨) |
| NULL이 아닌 값 | `aaa` | `NULL` | 비활성화 | `NULL` |
| NULL이 아닌 값 | `10` | `NULL` (오버플로) | 활성화 | 필터링됨 |
| NULL이 아닌 값 | `10` | `NULL` (오버플로) | 비활성화 | `NULL` |

:::tip
1. 표의 열은 NULL 값 적재를 허용합니다.
2. `Decimal`로 변환하면 `aaa`는 타입 문제로 `NULL`이 됩니다. 엄격 모드가 활성화되어 있으면 이러한 데이터가 필터링되고, 비활성화되어 있으면 `NULL`이 적재됩니다.
3. `10`은 `Decimal(1, 0)`의 범위를 벗어나므로 `NULL`로 변환됩니다. 엄격 모드가 활성화되어 있으면 필터링되고, 비활성화되어 있으면 `NULL`이 적재됩니다.
:::

#### 예시 3: char(10) 열 타입 {#example-3-column-type-char10}

| 원본 데이터 타입 | 원본 데이터 예시 | char(10)으로 변환한 값 | 엄격 모드 | 결과 |
| ------------ | -------------- | ---------------------- | -------- | ------------------- |
| NULL 값 | `\N` | `NULL` | 활성화 또는 비활성화 | `NULL` |
| NULL이 아닌 값 | `a1234567890` | `a1234567890` | 활성화 | 길이 초과로 필터링됨 |
| NULL이 아닌 값 | `a1234567890` | `a1234567890` | 비활성화 | `a123456789` (잘림) |

:::tip
표의 열은 NULL 값 적재를 허용합니다.
:::

### 엄격 모드 활성화 {#enabling-strict-mode}

`strict_mode`의 기본값은 `false`입니다. 적재 방식별 엄격 모드 활성화 예시는 다음과 같습니다.

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

최대 필터링 비율(`max_filter_ratio`)은 적재 과정에서 전체 데이터 중 허용할 수 있는 비정상 데이터의 최대 비율을 정의하는 주요 적재 제어 매개변수입니다.

- 실제 필터링 비율이 설정한 최대 필터링 비율보다 **낮으면**, 적재 작업이 계속되고 비정상 데이터는 무시됩니다.
- 실제 필터링 비율이 설정한 최대 필터링 비율을 **초과하면**, 적재 작업이 실패합니다.

### 필터링 비율 계산 방법 {#how-the-filter-ratio-is-calculated}

적재 과정에서 데이터 행은 다음 세 범주로 나뉩니다.

| 범주 | 설명 |
| --- | --- |
| **Filtered Rows** | 데이터 품질 문제로 필터링된 행입니다. 데이터 품질 문제에는 타입 오류, 정밀도 오류, 문자열 길이 초과, 파일의 열 개수 불일치와 같은 데이터 형식 문제뿐 아니라 해당 파티션이 없어 필터링된 데이터 행도 포함됩니다. |
| **Unselected Rows** | [사전 필터](./load-data-convert.md#pre-filtering) 또는 [사후 필터](./load-data-convert.md#post-filtering) 조건에 의해 필터링된 데이터 행입니다. |
| **Loaded Rows** | 정상적으로 적재된 데이터 행입니다. |

필터링 비율은 다음과 같이 계산합니다.

```Plain
#Filtered Rows / (#Filtered Rows + #Loaded Rows)
```

즉, `Unselected Rows`는 필터링 비율 계산에 포함되지 않습니다.

### 최대 필터링 비율 설정 {#setting-the-maximum-filter-ratio}

`max_filter_ratio`의 기본값은 `0`이며, 이는 비정상 데이터를 허용하지 않는다는 뜻입니다. 적재 방식별 설정 예시는 다음과 같습니다.

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
CREATE TABLE insert_filter_ratio_example (id INT NOT NULL)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

SET enable_insert_strict = false;
SET insert_max_filter_ratio = 0.5;
INSERT INTO insert_filter_ratio_example VALUES (1), (NULL);
SELECT * FROM insert_filter_ratio_example;
```

```text
+------+
| id   |
+------+
|    1 |
+------+
```

`id`는 NULL을 허용하지 않으므로 두 번째 행이 필터링됩니다. 필터링 비율은 `1 / (1 + 1) = 0.5`로 임계값을 초과하지 않으므로 적재에 성공합니다.

:::tip
INSERT INTO 문에서는 `enable_insert_strict = false`일 때만 `insert_max_filter_ratio`가 적용되며, 기본값은 `1.0`입니다. 이 매개변수는 Doris 테이블, 외부 테이블, 파일 TVF를 포함한 VALUES와 SELECT에 적용됩니다. 실제 필터링 비율이 임계값을 초과하면 INSERT가 실패하고, 임계값과 같으면 허용됩니다. 이 매개변수는 다른 실행 오류를 무시하지 않습니다.
:::

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: FAQ -->

**Q1: `strict_mode`와 `max_filter_ratio`를 함께 사용하려면 어떻게 해야 하나요?**

- **엄격한 데이터 품질**이 필요하다면 `strict_mode = true`로 설정하고 `max_filter_ratio`를 `0`과 같은 작은 값으로 설정합니다. 변환에 실패한 데이터가 있으면 적재가 실패합니다.
- **소량의 불량 데이터**를 허용하려면 `strict_mode`를 비활성화하거나 기본값을 유지하고, `max_filter_ratio`를 `0.1`과 같이 허용할 수 있는 비율로 설정합니다. 비정상 데이터가 필터링되며 전체 적재에는 영향을 주지 않습니다.

**Q2: 함수 계산으로 생성된 `NULL` 값도 엄격 모드에서 필터링되나요?**

아니요. 엄격 모드는 원본 데이터가 NULL이 아닌데 열 타입 변환 후 결과가 NULL이 되는 경우에만 적용됩니다. 함수 계산으로 생성된 `NULL` 값은 이에 해당하지 않습니다.

**Q3: 사전 필터 또는 사후 필터 조건으로 필터링된 데이터 행도 `max_filter_ratio`에 포함되나요?**

아니요. `Unselected Rows`는 필터링 비율 계산에 포함되지 않습니다. 필터링 비율은 `Filtered Rows`와 `Loaded Rows`만을 기준으로 계산합니다.

**Q4: Insert Into에서 `enable_insert_strict`와 `insert_max_filter_ratio`는 어떤 관계인가요?**

`insert_max_filter_ratio`는 `enable_insert_strict = false`일 때만 적용됩니다. 기본값은 `1.0`이며, 이는 모든 비정상 데이터를 필터링하도록 허용한다는 뜻입니다.

**Q5: `char(10)` 열에 길이를 초과하는 데이터가 들어오면 엄격 모드와 비엄격 모드는 어떻게 다르게 동작하나요?**

- 엄격 모드 활성화: 길이를 초과하는 데이터가 필터링됩니다.
- 엄격 모드 비활성화: 길이를 초과하는 데이터를 잘라서 적재합니다. 예를 들어 `a1234567890`은 `a123456789`로 잘립니다.
