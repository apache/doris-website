---
{
    "title": "CANCEL MATERIALIZED VIEW TASK",
    "language": "ko",
    "description": "이 문은 구체화된 뷰의 작업을 취소하는 데 사용됩니다"
}
---

## 설명 {#description}

이 문은 구체화된 뷰의 작업을 취소하는 데 사용됩니다

## 구문 {#syntax}

```sql
CANCEL MATERIALIZED VIEW TASK <task_id> ON <mv_name>
```

## 필수 매개변수 {#required-parameters}
**1. `<task_id>`**
> 구체화된 뷰의 작업 ID를 지정합니다.


**2. `<mv_name>`**
> 구체화된 뷰의 이름을 지정합니다.
>
> 구체화된 뷰 이름은 알파벳 문자로 시작해야 합니다(유니코드 이름 지원이 활성화된 경우 모든 언어의 문자로 시작할 수 있습니다). 전체 이름 문자열을 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 구체화된 뷰 이름에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 예약 키워드를 참조하세요.

## 접근 제어 요구 사항 {#access-control-requirements}
이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한  | 객체 | 설명                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | 구체화된 뷰  | CANCEL은 구체화된 뷰에 대한 ALTER 작업입니다 |

## 예제 {#example}

- 구체화된 뷰 mv1에서 ID가 1인 작업 취소

    ```sql
    CANCEL MATERIALIZED VIEW TASK 1 on mv1;
    ```
