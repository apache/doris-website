---
{
    "title": "SHOW VARIABLES",
    "language": "ko",
    "description": "이 문은 Doris 시스템 변수를 표시하는 데 사용됩니다. 조건을 지정하여 변수를 쿼리할 수 있습니다."
}
---

## 설명 {#description}

이 문은 Doris 시스템 변수를 표시하는 데 사용됩니다. 조건을 지정하여 변수를 쿼리할 수 있습니다.

## 구문 {#syntax}

```sql
SHOW [<effective_scope>] VARIABLES [<like_pattern> | <where clause>]
```

## 선택적 매개변수 {#optional-parameters}
**1. `<effective_scope>`**
> 적용 범위는 `GLOBAL`, `SESSION`, `LOCAL` 중 하나입니다. 적용 범위를 지정하지 않으면 기본값은 `SESSION`입니다. `LOCAL`은 `SESSION`의 별칭입니다.

**2. `<like_pattern>`**
> like 문을 사용하여 조건에 일치하는 결과를 필터링합니다.

**3. `<where>`**
> where 문을 사용하여 조건에 일치하는 결과를 필터링합니다.

## 접근 제어 요구 사항 {#access-control-requirements}
이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.

| 권한  | 객체 | 참고                                        |
| :--------- | :----- | :------------------------------------------- |
| N/A      | 세션  | 변수를 표시하는 데 별도의 권한이 필요하지 않습니다. |


## 반환값 {#return-value}
| Variable_name | Value   | Default_Value                    | Changed |
|:--------------|:--------|:---------------------------------|:--------|
| 변수 이름1      | 값1 | 기본값1 |   0/1      |
| 변수 이름2      | 값2 | 기본값2 |   0/1      |


## 사용 시 참고 사항 {#usage-notes}

- SHOW VARIABLES는 주로 시스템 변수의 값을 확인하는 데 사용됩니다.
- SHOW VARIABLES 명령을 실행하는 데 별도의 권한은 필요하지 않으며, 서버에 연결할 수 있으면 됩니다.
- `Changed` 열(`Return Value` 참조)에서 0은 변경되지 않았음을, 1은 변경되었음을 나타냅니다.
- `SHOW` 문을 사용할 때는 다음과 같은 제한 사항이 있습니다.
  - where 절에서 `or`를 사용할 수 없습니다.
  - 열 이름은 왼쪽에 있어야 합니다.
  - where 절에서는 동등 비교만 지원합니다.
  - like 문을 사용하여 variable_name과 일치하는 항목을 찾습니다.
  - 퍼센트 와일드카드 %는 일치 패턴의 어느 위치에서나 사용할 수 있습니다.


## 예제 {#example}


- 기본적으로 Variable_name과 일치하는 항목을 찾습니다. 다음은 정확히 일치하는 항목을 찾는 예제입니다.

    ```sql
    show variables like 'max_connections';
    ```


- 퍼센트 기호(%) 와일드카드를 사용하면 여러 항목을 찾을 수 있습니다.

    ```sql
    show variables like '%connec%';
    ```


- Where 절을 사용하여 조건에 일치하는 항목을 쿼리합니다.

    ```sql
    show variables where variable_name = 'version';
    ```
