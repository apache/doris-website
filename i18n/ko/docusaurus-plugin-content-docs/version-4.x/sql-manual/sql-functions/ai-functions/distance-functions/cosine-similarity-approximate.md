---
{
    "title": "COSINE_SIMILARITY_APPROXIMATE",
    "language": "ko",
    "description": "두 벡터 사이의 코사인 유사도를 계산합니다. 배열이 NULL이거나 NULL 요소가 있으면 오류가 발생합니다."
}
---

## 설명 {#description}

두 벡터 사이의 코사인 유사도를 계산합니다. 배열이 NULL이거나 NULL 요소가 있으면 오류가 발생합니다.

이 함수가 포함된 Doris 4.2 빌드에서 사용할 수 있습니다. 조건을 충족하는 Lance Top-N 쿼리는 네이티브 근사 검색을 사용할 수 있으며, 그 외 쿼리는 스칼라 커널을 실행합니다.

## 구문 {#syntax}

```sql
COSINE_SIMILARITY_APPROXIMATE(<array1>, <array2>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|---|---|
| `<array1>` | 암시적으로 ARRAY<FLOAT>로 변환되는 숫자 배열입니다. 변환 과정에서 정밀도가 달라질 수 있습니다. |
| `<array2>` | 암시적으로 ARRAY<FLOAT>로 변환되는 숫자 배열입니다. 변환 과정에서 정밀도가 달라질 수 있습니다. 두 배열의 길이는 같아야 합니다. |

## 반환값 {#return-value}

FLOAT를 반환하며, 값이 클수록 유사도가 높습니다. 스칼라 실행에서는 `dot(x,y) / (norm(x) * norm(y))`를 계산합니다. 두 배열이 모두 비어 있는 경우를 포함해 어느 한쪽의 노름이 영이면 0을 반환합니다. 두 배열의 길이가 다르거나 배열 또는 요소가 NULL이면 NULL을 반환하는 대신 오류가 발생합니다. 네이티브 검색의 후보 선정 조건, 수치 정밀도, NULL/NaN 처리 방식은 스칼라 실행과 다를 수 있습니다. 자세한 내용은 [자동 검색](../../../../lakehouse/best-practices/lance-hybrid-search.mdx#automatic-search)을 참조하세요.

## 예제 {#example}

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([1,0], [0,1]) AS value;
```

```text
value
0
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([0,0], [1,0]) AS value;
```

```text
value
0
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE(NULL, [0,1]);
```

```text
ERROR: First argument for function cosine_similarity_approximate cannot be null
```

```sql
SELECT COSINE_SIMILARITY_APPROXIMATE([0,NULL], [0,1]);
```

```text
ERROR: First argument for function cosine_similarity_approximate cannot have null
```
