---
{
    "title": "REGEXP_EXTRACT_ALL_ARRAY",
    "language": "ko",
    "description": "첫 번째 캡처 그룹의 모든 일치 항목을 문자열 배열로 추출합니다."
}
---

<version since="dev">

</version>

## 설명 {#description}

`<pattern>`에 있는 첫 번째 캡처 그룹의 겹치지 않는 모든 일치 항목을 `<str>`에서 추출하여 일치 순서대로 문자열 배열로 반환합니다. 두 인수 중 하나라도 `NULL`이면 `NULL`을 반환합니다.

## 구문 {#syntax}

```sql
REGEXP_EXTRACT_ALL_ARRAY(<str>, <pattern>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| --- | --- |
| `<str>` | 입력 문자열로, 타입은 `STRING`입니다. |
| `<pattern>` | 정규 표현식으로, 타입은 `STRING`입니다. 첫 번째 캡처 그룹을 추출하며, 그룹 인덱스를 지정하는 세 번째 인수는 지원하지 않습니다. |

## 반환값 {#return-value}

`ARRAY<STRING>`을 반환합니다. 일치 항목이나 캡처 그룹이 없으면 빈 배열 `[]`을 반환합니다. 두 인수 중 하나라도 `NULL`이면 `NULL`을 반환합니다. 정규 표현식이 유효하지 않으면 오류가 발생합니다.

기본 엔진은 RE2 구문을 사용하며 대소문자를 구분하여 일치 항목을 찾습니다. 세션 변수 `enable_extended_regex`를 사용하면 고급 정규 표현식 기능을 활성화할 수 있습니다. 자세한 내용은 [REGEXP_EXTRACT_ALL](./regexp-extract-all.md)을 참조하세요. 이 함수는 배열을 반환하며, `REGEXP_EXTRACT_ALL`은 형식이 지정된 문자열을 반환합니다.

## 예제 {#example}

```sql
SELECT regexp_extract_all_array('id=12,id=34', 'id=([0-9]+)') AS result;
```

```text
["12", "34"]
```

대소문자를 구분하지 않고 일치 항목을 찾으려면 `(?i)`를 사용합니다.

```sql
SELECT regexp_extract_all_array('Hello hello HELLO', '(?i)(hello)') AS result;
```

```text
["Hello", "hello", "HELLO"]
```

```sql
SELECT regexp_extract_all_array('abc', '([0-9]+)') AS no_match,
       regexp_extract_all_array('abc', 'abc') AS no_capture_group;
```

```text
[]    []
```

```sql
SELECT regexp_extract_all_array(NULL, '(a)') AS null_input,
       regexp_extract_all_array('a', NULL) AS null_pattern;
```

```text
NULL    NULL
```

결과를 배열 함수에 직접 전달할 수 있습니다.

```sql
SELECT array_size(regexp_extract_all_array('a1b2', '([0-9])')) AS matches;
```

```text
2
```
