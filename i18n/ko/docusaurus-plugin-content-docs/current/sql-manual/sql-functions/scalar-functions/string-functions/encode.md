---
{
    "title": "ENCODE",
    "language": "ko",
    "description": "Hive와 호환되는 문자 변환을 위해 지정된 문자 집합을 사용하여 문자열을 VARBINARY 값으로 변환합니다."
}
---

<version since="dev">

</version>

## 설명 {#description}

지정된 문자 집합을 사용하여 문자열을 `VARBINARY` 값으로 변환합니다. 문자 집합 이름은 대소문자를 구분하지 않습니다. 지원되는 문자 집합은 `US-ASCII`, `ISO-8859-1`, `UTF-8`, `UTF-16BE`, `UTF-16LE`, `UTF-16`입니다.

## 구문 {#syntax}

```sql
ENCODE(<source>, <charset>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| :--- | :--- |
| `<source>` | 인코딩할 문자열입니다. 타입: STRING. |
| `<charset>` | 대상 문자 집합의 이름을 지정하는 문자열 리터럴 또는 `NULL`입니다. 지원되는 값은 `US-ASCII`, `ISO-8859-1`, `UTF-8`, `UTF-16BE`, `UTF-16LE`, `UTF-16`입니다. 컬럼이나 다른 표현식은 사용할 수 없습니다. |

## 반환 값 {#return-value}

인코딩된 바이트를 담은 `VARBINARY` 값을 반환합니다.

- `<charset>`이 `NULL`이거나, `<source>`가 `NULL`이고 `<charset>`이 유효하면 함수는 `NULL`을 반환합니다.
- `<source>`가 빈 문자열이면 함수는 빈 바이너리 값을 반환합니다.
- `UTF-16`은 입력이 비어 있지 않으면 빅 엔디언 바이트 순서 표시(BOM)를 기록합니다. `UTF-16BE`와 `UTF-16LE`는 BOM을 기록하지 않습니다.
- `<charset>`이 지원되지 않으면 `<source>`가 `NULL`이어도 함수는 오류를 반환합니다. `<source>`에 대상 문자 집합으로 표현할 수 없는 문자가 포함되어 있어도 함수는 오류를 반환합니다.

## 예제 {#example}

**UTF-8과 ISO-8859-1을 사용하여 동일한 문자 인코딩하기**

`HEX`를 사용하여 반환된 바이너리 바이트를 표시합니다.

```sql
SELECT
    HEX(ENCODE('é', 'UTF-8')) AS utf8_bytes,
    HEX(ENCODE('é', 'ISO-8859-1')) AS latin1_bytes;
```

```text
+------------+--------------+
| utf8_bytes | latin1_bytes |
+------------+--------------+
| C3A9       | E9           |
+------------+--------------+
```

**UTF-16 변형 비교하기**

```sql
SELECT
    HEX(ENCODE('中', 'UTF-16BE')) AS big_endian,
    HEX(ENCODE('中', 'UTF-16LE')) AS little_endian,
    HEX(ENCODE('中', 'UTF-16')) AS with_bom;
```

```text
+------------+---------------+----------+
| big_endian | little_endian | with_bom |
+------------+---------------+----------+
| 4E2D       | 2D4E          | FEFF4E2D |
+------------+---------------+----------+
```

**NULL 및 빈 입력**

```sql
SELECT
    ENCODE(NULL, 'UTF-8') IS NULL AS null_result,
    HEX(ENCODE('', 'UTF-16')) = '' AS empty_result;
```

```text
+-------------+--------------+
| null_result | empty_result |
+-------------+--------------+
|           1 |            1 |
+-------------+--------------+
```
