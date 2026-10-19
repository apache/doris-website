---
{
    "title": "NUMBERS",
    "language": "ko",
    "description": "열 이름이 number인 단일 열만 포함하는 임시 테이블을 생성하는 테이블 함수로, 조건이 충족되면 모든 요소의 값은 constvalue입니다."
}
---

## 설명 {#description}

열 이름이 `number`인 단일 열만 포함하는 임시 테이블을 생성하는 테이블 함수입니다. 모든 요소의 값은 `const_value`이며, 이는 `const_value`가 지정된 경우에 해당합니다. 지정되지 않은 경우에는 [0,`number`) 범위에서 순서대로 증가하는 값을 사용합니다.

## 구문 {#syntax}
```sql
NUMBERS(
    "number" = "<number>"
    [, "const_value" = "<const_value>" ]
  );
```

## 필수 매개변수 {#required-parameters}

| 필드         | 설명               |
|---------------|---------------------------|
| **number**    | 행 수        |

## 선택 매개변수 {#optional-parameters}

| 필드             | 설명                              |
|-------------------|------------------------------------------|
| **const_value**   | 생성할 상수 값을 지정합니다   |



## 반환 값 {#return-value}
| 필드      | 타입    | 설명                     |
|----------------|---------|---------------------------------|
| **number**     | BIGINT  | 각 행에 대해 반환되는 값 |


## 예제 {#examples}
```sql
select * from numbers("number" = "5");
```
```text
+--------+
| number |
+--------+
|      0 |
|      1 |
|      2 |
|      3 |
|      4 |
+--------+
```

```sql
select * from numbers("number" = "5", "const_value" = "-123");
```
```text
+--------+
| number |
+--------+
|   -123 |
|   -123 |
|   -123 |
|   -123 |
|   -123 |
+--------+
```
