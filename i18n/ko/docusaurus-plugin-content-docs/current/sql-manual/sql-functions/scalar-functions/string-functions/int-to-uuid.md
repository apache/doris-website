---
{
    "title": "INT_TO_UUID",
    "language": "ko",
    "description": "인코딩된 LARGEINT 입력값을 원래 UUID 문자열로 변환합니다."
}
---

## 설명 {#description}

인코딩된 LARGEINT 입력값을 원래 UUID 문자열로 변환합니다.

이 함수는 여전히 문자열을 반환합니다. 네이티브 [UUID 타입](../../../basic-element/sql-data-types/uuid.md)으로 마이그레이션하려면 `CAST(INT_TO_UUID(<int128>) AS UUID)`를 사용하세요. LARGEINT와 UUID 간의 직접 형 변환은 지원되지 않습니다.

## 구문 {#syntax}

```sql
INT_TO_UUID(<int128>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|------------|-----------------|
| `<int128>` | 인코딩된 LARGEINT 값 |

## 반환값 {#return-value}

매개변수 `<int128>`의 원래 UUID 문자열을 반환합니다.

- 입력값이 NULL이면 NULL을 반환합니다

## 예제 {#examples}

```sql
SELECT INT_TO_UUID(95721955514869408091759290071393952876)
```

```text
+-----------------------------------------------------+
| int_to_uuid(95721955514869408091759290071393952876) |
+-----------------------------------------------------+
| 6ce4766f-6783-4b30-b357-bba1c7600348                |
+-----------------------------------------------------+
```

```sql
SELECT INT_TO_UUID(NULL);
```

```text
+-------------------+
| INT_TO_UUID(NULL) |
+-------------------+
| NULL              |
+-------------------+
```
