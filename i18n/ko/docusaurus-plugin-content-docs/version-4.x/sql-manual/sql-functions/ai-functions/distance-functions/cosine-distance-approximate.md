---
{
    "title": "COSINE_DISTANCE_APPROXIMATE",
    "language": "ko",
    "description": "두 벡터 사이의 코사인 거리를 계산합니다. NULL 배열이나 NULL 요소가 있으면 오류가 발생합니다."
}
---

## 설명 {#description}

두 벡터 사이의 코사인 거리를 계산합니다. NULL 배열이나 NULL 요소가 있으면 오류가 발생합니다.

이 함수가 포함된 Doris 4.2 빌드에서 사용할 수 있습니다. 조건을 충족하는 Lance Top-N 쿼리는 네이티브 근사 검색을 사용할 수 있으며, 그 밖의 쿼리는 스칼라 커널로 실행됩니다.

## 구문 {#syntax}

```sql
COSINE_DISTANCE_APPROXIMATE(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|---|---|
| `<array1>` | 숫자 배열입니다. 암시적으로 ARRAY<FLOAT>로 변환되며, 변환 과정에서 정밀도가 달라질 수 있습니다. |
| `<array2>` | 숫자 배열입니다. 암시적으로 ARRAY<FLOAT>로 변환되며, 변환 과정에서 정밀도가 달라질 수 있습니다. 두 배열의 길이는 같아야 합니다. |

## 반환 값 {#return-value}

FLOAT를 반환하며, 값이 작을수록 두 벡터가 가깝습니다. 스칼라 실행에서는 `1 - dot(x,y) / (norm(x) * norm(y))`를 계산합니다. 두 배열이 모두 비어 있는 경우를 포함해 어느 한쪽의 노름이 영이면 2를 반환합니다. 두 배열의 길이가 다르거나 NULL 배열 또는 NULL 요소가 있으면 NULL을 반환하는 대신 오류가 발생합니다. 네이티브 검색의 후보 적격성, 수치 정밀도, NULL/NaN 처리는 스칼라 실행과 다를 수 있습니다. 자세한 내용은 [자동 검색](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search)을 참조하세요.

## 예제 {#example}

```sql
SELECT COSINE_DISTANCE_APPROXIMATE([1,0], [0,1]) AS value;
```

```text
value
1
```

```sql
SELECT COSINE_DISTANCE_APPROXIMATE([0,0], [1,0]) AS value;
```

```text
value
2
```

```sql
SELECT COSINE_DISTANCE_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function cosine_distance_approximate cannot be null
```

```sql
SELECT COSINE_DISTANCE_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function cosine_distance_approximate cannot have null
```
