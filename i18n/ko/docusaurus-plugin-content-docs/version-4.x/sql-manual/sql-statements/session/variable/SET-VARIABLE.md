---
{
    "title": "SET VARIABLE",
    "language": "ko",
    "description": "이 문은 주로 Doris 시스템 변수를 수정하는 데 사용됩니다. 이러한 시스템 변수는 전역 및 세션 수준에서 수정할 수 있습니다."
}
---

## 설명 {#description}

이 문은 주로 Doris 시스템 변수를 수정하는 데 사용됩니다. 이러한 시스템 변수는 전역 및 세션 수준에서 수정할 수 있으며, 일부는 동적으로 수정할 수도 있습니다. `SHOW VARIABLE`을 사용하여 이러한 시스템 변수를 확인할 수도 있습니다.

## 구문 {#syntax}

```sql
SET variable_assignment [, variable_assignment] [ ... ]
```

각 변수 할당의 구문은 다음과 같습니다.
```sql
variable_assignment
  : <user_var_name> = <expr>
  | [ <effective_scope> ] <system_var_name> = <expr>
```

## 필수 매개변수 {#required-parameters}
**1. `<user_var_name>`**
> 사용자 수준의 변수를 지정합니다. 예: @your_variable_name. 변수 이름은 `@`로 시작합니다.

**2. `<system_var_name>`**
> 시스템 수준의 변수를 지정합니다. 예: exec_mem_limit 등.

## 선택적 매개변수 {#optional-parameters}
**1. `<effective_scope>`**

> 적용 범위는 `GLOBAL`, `SESSION`, `LOCAL` 중 하나입니다. 적용 범위를 지정하지 않으면 기본값은 `SESSION`입니다. `LOCAL`은 `SESSION`의 별칭입니다.

## 접근 제어 요구 사항 {#access-control-requirements}
이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한  | 객체 | 참고 사항                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | 세션  | 전역 변수를 설정하려면 관리자 권한이 필요합니다. |


## 사용 시 참고 사항 {#usage-notes}

- ADMIN 사용자만 변수가 전역적으로 적용되도록 설정할 수 있습니다.
- 전역적으로 적용되는 변수는 현재 세션과 이후에 생성되는 새 세션에 영향을 주지만, 현재 존재하는 다른 세션에는 영향을 주지 않습니다.

## 예제 {#example}

- 시간대를 동팔구로 설정

   ```
   SET time_zone = "Asia/Shanghai";
   ```


- 전역 실행 메모리 크기 설정

   ```
   SET GLOBAL exec_mem_limit = 137438953472
   ```
- 사용자 변수 설정

   ```
   SET @your_variable_name = your_variable_value;
   ```
