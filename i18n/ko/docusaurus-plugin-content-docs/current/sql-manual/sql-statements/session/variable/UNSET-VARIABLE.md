---
{
    "title": "UNSET VARIABLE",
    "language": "ko",
    "description": "Doris 시스템 변수를 복원하는 데 사용하는 문입니다. 이 시스템 변수는 전역 또는 세션 수준에서 변경할 수 있습니다."
}
---

## 설명 {#description}

Doris 시스템 변수를 복원하는 데 사용하는 문입니다. 이 시스템 변수는 전역 또는 세션 수준에서 변경할 수 있습니다.

## 구문 {#syntax}

```sql
UNSET [<effective_scope>] VARIABLE (<variable_name>)
```

## 필수 매개변수 {#required-parameters}
**1. `<variable_name>`**
> 변수 이름을 지정합니다. 모든 변수를 초기화하려면 이 매개변수에 키워드 `ALL`을 지정할 수 있습니다.

## 선택적 매개변수 {#optional-parameters}
**1. `<effective_scope>`**
> 적용 범위는 `GLOBAL`, `SESSION`, `LOCAL` 중 하나입니다. 적용 범위를 지정하지 않으면 기본값은 `SESSION`입니다. `LOCAL`은 `SESSION`의 별칭입니다.

## 접근 제어 요구 사항 {#access-control-requirements}
이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한  | 객체 | 참고                                        |
| :--------- | :----- | :------------------------------------------- |
| ADMIN_PRIV | 세션  | 전역 변수를 초기화하려면 관리자 권한이 필요합니다. |

## 사용 시 참고 사항 {#usage-notes}

- ADMIN 사용자만 변수를 초기화하여 전역으로 적용할 수 있습니다.
- `GLOBAL`로 변수를 복원하면 현재 사용 중인 세션과 새로 열리는 세션에만 적용됩니다. 이미 열려 있는 다른 세션에는 영향을 주지 않습니다.



## 예제 {#example}

- 시간대 값 복원

   ```
   UNSET VARIABLE time_zone;
   ```


- 전역 실행 메모리 크기 복원

   ```
   UNSET GLOBAL VARIABLE exec_mem_limit;
   ```


- 모든 변수를 전역으로 복원

   ```
   UNSET GLOBAL VARIABLE ALL;
   ```
