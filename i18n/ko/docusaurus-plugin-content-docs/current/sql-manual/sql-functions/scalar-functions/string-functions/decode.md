---
{
    "title": "DECODE",
    "language": "ko",
    "description": "Hive와 호환되는 문자 변환을 위해 지정된 문자 집합을 사용하여 VARBINARY 값을 문자열로 변환합니다."
}
---

<version since="dev">

</version>

## 설명 {#description}

지정된 문자 집합을 사용하여 `VARBINARY` 값을 문자열로 변환합니다. 문자 집합 이름은 대소문자를 구분하지 않습니다. 지원되는 문자 집합은 `US-ASCII`, `ISO-8859-1`, `UTF-8`, `UTF-16BE`, `UTF-16LE`, `UTF-16`입니다.

## 구문 {#syntax}

```sql
DECODE(<binary>, <charset>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| :--- | :--- |
| `<binary>` | 디코딩할 바이너리 값입니다. 타입: VARBINARY. |
| `<charset>` | 입력 바이트에 사용된 문자 집합의 이름을 나타내는 문자열 리터럴 또는 `NULL`입니다. 지원되는 값은 `US-ASCII`, `ISO-8859-1`, `UTF-8`, `UTF-16BE`, `UTF-16LE`, `UTF-16`입니다. 컬럼이나 다른 표현식은 허용되지 않습니다. |

## 반환 값 {#return-value}

디코딩된 텍스트를 포함하는 `STRING` 값을 반환합니다.

- `<charset>`이 `NULL`이거나, `<binary>`가 `NULL`이고 `<charset>`이 유효하면 함수는 `NULL`을 반환합니다.
- `<binary>`가 비어 있으면 함수는 빈 문자열을 반환합니다.
- `UTF-16`의 경우 함수는 big-endian (`FE FF`) 및 little-endian (`FF FE`) BOM을 인식하고 결과에서 BOM을 제거합니다. BOM이 없으면 입력을 big-endian으로 디코딩합니다. `UTF-16BE`와 `UTF-16LE`는 항상 명시된 바이트 순서를 사용합니다.
- `<charset>`이 지원되지 않으면 `<binary>`가 `NULL`이어도 함수는 오류를 반환합니다. `<binary>`가 지정된 문자 집합의 형식에 맞지 않는 경우에도 함수는 오류를 반환합니다.

## 예제 {#example}

**UTF-8 바이트 디코딩**

```sql
SELECT DECODE(CAST(UNHEX('E4B8AD') AS VARBINARY), 'UTF-8') AS decoded_text;
```

```text
+--------------+
| decoded_text |
+--------------+
| 中           |
+--------------+
```

**BOM이 있는 little-endian UTF-16 디코딩**

문자 집합 이름을 소문자로 지정한 이 예제는 대소문자를 구분하지 않고 이름을 비교한다는 점도 보여 줍니다.

```sql
SELECT DECODE(CAST(UNHEX('FFFE2D4E') AS VARBINARY), 'utf-16') AS decoded_text;
```

```text
+--------------+
| decoded_text |
+--------------+
| 中           |
+--------------+
```

**NULL 및 빈 입력**

```sql
SELECT
    DECODE(CAST(NULL AS VARBINARY), 'UTF-8') IS NULL AS null_result,
    DECODE(CAST(UNHEX('') AS VARBINARY), 'UTF-16') = '' AS empty_result;
```

```text
+-------------+--------------+
| null_result | empty_result |
+-------------+--------------+
|           1 |            1 |
+-------------+--------------+
```
