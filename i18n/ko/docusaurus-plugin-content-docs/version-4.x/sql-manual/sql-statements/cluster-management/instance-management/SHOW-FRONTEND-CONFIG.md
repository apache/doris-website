---
{
    "title": "SHOW FRONTEND CONFIG",
    "language": "ko",
    "description": "이 문은 현재 클러스터의 구성을 표시하는 데 사용됩니다(현재는 FE의 구성 항목만 지원됩니다)"
}
---

## 설명 {#description}

이 문은 현재 클러스터의 구성을 표시하는 데 사용됩니다(현재는 FE의 구성 항목만 지원됩니다).

4.1.5부터 비어 있지 않은 민감한 구성 값은 `********`로 마스킹되어 `Value`에 표시됩니다. 여기에는 초기 root 비밀번호와 TLS, HTTPS 및 MySQL SSL 비밀번호가 포함됩니다. 설정되지 않은 빈 값은 그대로 비어 있습니다. 마스킹해도 실제 구성 값은 변경되지 않습니다.

## 구문 {#syntax}

```sql
SHOW FRONTEND CONFIG [LIKE "<pattern>"];
```

## 선택적 매개변수 {#optional-parameters}
**`<pattern>`**
> 일반 문자와 와일드카드를 포함할 수 있는 문자열입니다.


## 반환 값 {#return-values}
| 열 이름 | 설명                                            |
|-------------|-----------------------------------------------------|
| Value       | 구성 항목의 값                            |
| Type        | 구성 항목의 유형                             |
| IsMutable   | `ADMIN SET CONFIG` 명령으로 설정할 수 있는지 여부 |
| MasterOnly  | Master FE에만 적용되는지 여부                  |
| Comment     | 구성 항목의 설명                      |


## 예시 {#example}

1. 현재 FE 노드의 구성 확인

   ```sql
   SHOW FRONTEND CONFIG;
   ```

2. like 조건자를 사용하여 현재 Fe 노드의 구성 검색

   ```sql
    SHOW FRONTEND CONFIG LIKE '%check_java_version%';
    ```
    ```text
    +--------------------+-------+---------+-----------+------------+---------+
    | Key                | Value | Type    | IsMutable | MasterOnly | Comment |
    +--------------------+-------+---------+-----------+------------+---------+
    | check_java_version | true  | boolean | false     | false      |         |
    +--------------------+-------+---------+-----------+------------+---------+
    ```
