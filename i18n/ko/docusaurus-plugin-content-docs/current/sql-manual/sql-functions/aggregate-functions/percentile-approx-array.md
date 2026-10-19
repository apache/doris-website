---
{
    "title": "PERCENTILE_APPROX_ARRAY",
    "language": "ko",
    "description": "PERCENTILE_APPROX_ARRAY는 공유 T-Digest 상태를 사용하여 한 번의 집계로 여러 근사 백분위수를 계산합니다."
}
---

## 설명 {#description}

`PERCENTILE_APPROX_ARRAY`는 한 번의 집계로 여러 근사 백분위수를 계산합니다. 입력값으로 하나의 T-Digest를 생성하고 이 공유 상태에서 요청된 모든 백분위수를 계산하므로, 각 백분위수에 대해 `PERCENTILE_APPROX`를 개별적으로 호출하는 것보다 효율적입니다.

:::note
이 함수는 4.2.0부터 지원됩니다.
:::

## 구문 {#syntax}

```sql
PERCENTILE_APPROX_ARRAY(<col>, <quantiles> [, <compression>])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| -- | -- |
| `<col>` | 백분위수를 계산할 숫자 표현식입니다. 값은 `DOUBLE`로 변환됩니다. `NULL` 값은 무시됩니다. |
| `<quantiles>` | 상수 `ARRAY<DOUBLE>`입니다. 각 요소는 유한한 값이면서 NULL이 아니어야 하며, `[0.0, 1.0]` 범위에 있어야 합니다. 결과는 배열과 동일한 순서를 따르며, 중복된 백분위 수준도 그대로 유지됩니다. 빈 배열도 허용됩니다. |
| `<compression>` | 선택 사항인 상수 `DOUBLE`로, 값은 `[2048, 10000]` 범위여야 합니다. 일반적으로 값이 클수록 정확도가 높아지지만 더 많은 메모리를 사용합니다. 기본값은 `10000`이며, 유한하지 않은 값이나 유효 범위를 벗어난 값에도 `10000`을 사용합니다. |

## 반환값 {#return-value}

근사 백분위수로 구성된 `ARRAY<DOUBLE>`을 반환하며, `<quantiles>`의 각 요소에 해당하는 결과가 하나씩 포함됩니다. 이 함수는 `<quantiles>`가 비어 있거나 그룹에 NULL이 아닌 입력값이 없으면 빈 배열을 반환합니다. 유효하지 않은 백분위 수준이나 `<quantiles>`의 NULL 요소는 오류를 발생시킵니다.

## 예제 {#example}

```sql
CREATE TABLE percentile_approx_array_example (
    id INT,
    value DOUBLE NULL
) DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO percentile_approx_array_example VALUES
    (1, 1.0), (2, 2.0), (3, 3.0), (4, NULL),
    (5, 10.0), (6, 20.0), (7, 30.0), (8, 100.0);
```

기본 압축 수준으로 여러 근사 백분위수를 계산합니다:

```sql
SELECT percentile_approx_array(value, [0.0, 0.25, 0.5, 0.75, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+--------------------------+
| percentiles              |
+--------------------------+
| [1, 2.25, 10, 27.5, 100] |
+--------------------------+
```

압축 수준을 명시적으로 지정합니다:

```sql
SELECT percentile_approx_array(value, [0.25, 0.5, 0.75], 2048) AS percentiles
FROM percentile_approx_array_example;
```

```text
+------------------+
| percentiles      |
+------------------+
| [2.25, 10, 27.5] |
+------------------+
```

모든 입력값이 NULL이면 빈 배열을 반환합니다:

```sql
SELECT percentile_approx_array(CAST(NULL AS DOUBLE), [0.0, 0.5, 1.0]) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```

백분위수 배열이 비어 있어도 빈 배열을 반환합니다:

```sql
SELECT percentile_approx_array(value, []) AS percentiles
FROM percentile_approx_array_example;
```

```text
+-------------+
| percentiles |
+-------------+
| []          |
+-------------+
```
