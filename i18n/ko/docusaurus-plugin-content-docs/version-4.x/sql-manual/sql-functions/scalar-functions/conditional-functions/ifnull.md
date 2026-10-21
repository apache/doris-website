---
{
    "title": "IFNULL",
    "language": "ko",
    "description": "<expr1>의 값이 NULL이 아니면 <expr1>을 반환하고, 그렇지 않으면 <expr2>를 반환합니다."
}
---

## 설명 {#description}

`<expr1>`의 값이 `NULL`이 아니면 `<expr1>`을 반환하고, 그렇지 않으면 `<expr2>`를 반환합니다.

## 별칭 {#alias}

- NVL

## 구문 {#syntax}

```sql
IFNULL(<expr1>, <expr2>)
```

## 매개변수 {#parameters}
- `<expr1>`: `NULL`인지 확인할 표현식입니다.
- `<expr2>`: `<expr1>`이 `NULL`일 때 반환할 값입니다.

## 반환 값 {#return-value}
- `<expr1>`이 `NULL`이 아니면 `<expr1>`을 반환합니다.
- 그렇지 않으면 `<expr2>`를 반환합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    SELECT IFNULL(1, 0);
    ```
    ```text
    +--------------+
    | IFNULL(1, 0) |
    +--------------+
    |            1 |
    +--------------+
    ```
2. 예제 2
    ```sql
    SELECT IFNULL(NULL, 10);
    ```
    ```text
    +------------------+
    | IFNULL(NULL, 10) |
    +------------------+
    |               10 |
    +------------------+
    ```
3. 두 인수가 모두 NULL인 경우
    ```sql
    SELECT IFNULL(NULL, NULL);
    ```
    ```text
    +--------------------+
    | IFNULL(NULL, NULL) |
    +--------------------+
    |               NULL |
    +--------------------+
    ```
