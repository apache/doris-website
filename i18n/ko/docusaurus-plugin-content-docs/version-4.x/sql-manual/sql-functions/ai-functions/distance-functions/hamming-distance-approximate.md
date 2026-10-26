---
{
    "title": "HAMMING_DISTANCE_APPROXIMATE",
    "language": "ko",
    "description": "두 바이트 벡터의 해밍 거리를 계산합니다. 해밍 거리는 비트 단위 XOR 연산 후 서로 다른 비트의 개수입니다. 배열이나 요소가 NULL이면 오류가 발생합니다."
}
---

## 설명 {#description}

두 바이트 벡터의 해밍 거리를 계산합니다. 해밍 거리는 비트 단위 XOR 연산 후 서로 다른 비트의 개수입니다. 배열이나 요소가 NULL이면 오류가 발생합니다.

이 함수가 포함된 Doris 4.2 빌드에서 사용할 수 있습니다. 조건을 충족하는 Lance Top-N 쿼리는 네이티브 근사 검색을 사용할 수 있으며, 그 외 쿼리는 스칼라 커널에서 실행됩니다.

## 구문 {#syntax}

```sql
HAMMING_DISTANCE_APPROXIMATE(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|---|---|
| `<array1>` | TINYINT, SMALLINT, INT 또는 BIGINT 정수 배열이며 ARRAY<BIGINT>로 강제 변환됩니다. 모든 요소는 `[0,255]` 범위에 있어야 합니다. 부동 소수점, decimal 및 LARGEINT 배열은 허용되지 않습니다. |
| `<array2>` | TINYINT, SMALLINT, INT 또는 BIGINT 정수 배열이며 ARRAY<BIGINT>로 강제 변환됩니다. 모든 요소는 `[0,255]` 범위에 있어야 합니다. 부동 소수점, decimal 및 LARGEINT 배열은 허용되지 않습니다. 두 배열의 길이는 같아야 합니다. |

## 반환값 {#return-value}

FLOAT를 반환하며, 값이 작을수록 두 벡터가 더 가깝습니다. 두 배열이 모두 비어 있으면 0을 반환합니다. N바이트 벡터의 최대 거리는 8N입니다. 배열의 길이가 다르거나 배열 또는 요소가 NULL이면 NULL을 반환하는 대신 오류가 발생합니다. 범위를 벗어난 요소도 오류를 발생시킵니다. 네이티브 검색의 후보로 사용될 수 있는 조건, 수치 정밀도, NULL/NaN 처리 방식은 스칼라 실행과 다를 수 있습니다. 자세한 내용은 [자동 검색](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search)을 참조하세요.

## 예제 {#example}

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([0,255,170], [255,0,85]) AS value;
```

```text
value
24
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([], []) AS value;
```

```text
value
0
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function hamming_distance_approximate cannot be null
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function hamming_distance_approximate cannot have null
```

```sql
SELECT HAMMING_DISTANCE_APPROXIMATE([256], [0]);
```

```text
ERROR: Hamming vector elements must be integers in [0, 255]
```
