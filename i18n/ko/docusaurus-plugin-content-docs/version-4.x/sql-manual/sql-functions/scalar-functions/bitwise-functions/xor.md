---
{
    "title": "XOR | 비트 연산 함수",
    "language": "ko",
    "description": "두 BOOLEAN 값에 비트 XOR 연산을 수행합니다.",
    "sidebar_label": "XOR"
}
---

# XOR {#xor}

## 설명 {#description}
두 BOOLEAN 값에 비트 XOR 연산을 수행합니다.

## 구문 {#syntax}
```sql
<lhs> XOR <rhs>
```

## 매개변수 {#parameters}
- `<lhs>`: 비트 XOR 연산에 사용할 첫 번째 BOOLEAN 값입니다.
- `<rhs>`: 비트 XOR 연산에 사용할 두 번째 BOOLEAN 값입니다.

## 반환 값 {#return-value}
두 BOOLEAN 값의 XOR 연산 결과를 반환합니다.

## 예제 {#examples}
1. 예제 1
    ```sql
    select true XOR false, true XOR true;
    ```
    ```text
    +----------------+---------------+
    | true XOR false | true XOR true |
    +----------------+---------------+
    |              1 |             0 |
    +----------------+---------------+
    ```
2. NULL 인수
    ```sql
    select true XOR NULL, NULL XOR true, false XOR NULL, NULL XOR false, NULL XOR NULL;
    ```
    ```text
    +---------------+---------------+----------------+----------------+---------------+
    | true XOR NULL | NULL XOR true | false XOR NULL | NULL XOR false | NULL XOR NULL |
    +---------------+---------------+----------------+----------------+---------------+
    |          NULL |          NULL |           NULL |           NULL |          NULL |
    +---------------+---------------+----------------+----------------+---------------+
    ```
