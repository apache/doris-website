---
{
    "title": "TO_UUID_OR_NULL",
    "language": "ko",
    "description": "표준 형식 또는 압축 형식의 십육진수 문자열을 네이티브 UUID로 변환하며, strict cast 모드와 관계없이 텍스트가 유효하지 않거나 입력이 NULL이면 NULL을 반환합니다."
}
---

## 설명 {#description}

문자열을 UUID로 변환합니다. 텍스트가 유효하지 않으면 `NULL`을 반환하며, 입력이 `NULL`인 경우에도 마찬가지입니다.

## 별칭 {#alias}

`toUUIDOrNull`.

## 사용 시 참고 사항 {#usage-notes}

입력 문자열에 대한 실패 처리는 `enable_strict_cast`와 무관합니다.

## 구문 {#syntax}

```sql
TO_UUID_OR_NULL(<string>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<string>` | CHAR, VARCHAR 또는 STRING 값입니다. 하이픈이 포함된 36자 표준 형식의 텍스트 또는 32자리 십육진수를 허용하며, 대소문자를 구분하지 않습니다. 중괄호, 앞뒤 공백, 하이픈이 다른 위치에 있는 형식은 허용되지 않습니다. |

## 반환값 {#return-value}

반환 타입은 `UUID`입니다. 텍스트가 유효하지 않으면 `NULL`을 반환하며, 입력이 `NULL`인 경우에도 마찬가지입니다.

## 예제 {#example}

```sql
SELECT TO_UUID_OR_NULL('550E8400E29B41D4A716446655440000') AS parsed,
       TO_UUID_OR_NULL('bad') AS invalid,
       TO_UUID_OR_NULL(NULL) AS null_input;
```

```text
+--------------------------------------+---------+------------+
| parsed                               | invalid | null_input |
+--------------------------------------+---------+------------+
| 550e8400-e29b-41d4-a716-446655440000 | NULL    | NULL       |
+--------------------------------------+---------+------------+
```

```sql
SELECT TO_UUID_OR_NULL('{550e8400-e29b-41d4-a716-446655440000}') AS braces,
       TO_UUID_OR_NULL(' 550e8400-e29b-41d4-a716-446655440000') AS leading_space;
```

```text
+--------+---------------+
| braces | leading_space |
+--------+---------------+
| NULL   | NULL          |
+--------+---------------+
```
