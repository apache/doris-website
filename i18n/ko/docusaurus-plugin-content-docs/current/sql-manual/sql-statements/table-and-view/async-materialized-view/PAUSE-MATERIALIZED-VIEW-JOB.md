---
{
    "title": "PAUSE MATERIALIZED VIEW JOB",
    "language": "ko",
    "description": "이 문은 구체화된 뷰의 예약 실행을 일시 중지하는 데 사용됩니다"
}
---

## 설명 {#description}

이 문은 구체화된 뷰의 예약 실행을 일시 중지하는 데 사용됩니다

## 구문 {#syntax}

```sql
PAUSE MATERIALIZED VIEW JOB ON <mv_name>
```

## 필수 매개변수 {#required-parameters}
**1. `<mv_name>`**
> 구체화된 뷰의 이름을 지정합니다.
>
> 구체화된 뷰 이름은 영문자로 시작해야 합니다(unicode 이름 지원이 활성화된 경우 모든 언어의 문자로 시작할 수 있습니다). 전체 구체화된 뷰 이름 문자열을 백틱으로 묶지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 구체화된 뷰 이름에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 예약 키워드를 참조하세요.


## 접근 제어 요구 사항 {#access-control-requirements}
이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.

| 권한  | 객체 | 참고 사항                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | 구체화된 뷰  | PAUSE는 구체화된 뷰에 대한 ALTER 작업입니다 |


## 사용 시 참고 사항 {#usage-notes}

- 이 문을 사용한 후 RESUME 구체화된 뷰 문을 사용하여 예약 실행을 재개할 수 있습니다.


## 예시 {#example}

- 구체화된 뷰 mv1의 예약 실행 일시 중지

    ```sql
    PAUSE MATERIALIZED VIEW JOB ON mv1;
    ```
