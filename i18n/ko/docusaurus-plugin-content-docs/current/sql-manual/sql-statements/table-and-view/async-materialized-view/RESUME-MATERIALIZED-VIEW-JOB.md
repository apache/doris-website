---
{
    "title": "RESUME MATERIALIZED VIEW",
    "language": "ko",
    "description": "이 문은 구체화된 뷰의 정기 실행을 일시적으로 재개하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 구체화된 뷰의 정기 실행을 일시적으로 재개하는 데 사용됩니다.

## 구문 {#syntax}

```sql
RESUME MATERIALIZED VIEW JOB ON <mv_name>
```

## 필수 매개변수 {#required-parameters}
**1. `<mv_name>`**
> 구체화된 뷰 이름을 지정합니다.
>
> 구체화된 뷰 이름은 영문자로 시작해야 하며(unicode 이름 지원이 활성화된 경우 모든 언어의 문자 허용), 이름 문자열 전체를 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 구체화된 뷰 이름에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 예약 키워드를 참조하세요.

## 접근 제어 요구 사항 {#access-control-requirements}
이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다:

| 권한  | 객체 | 설명                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | 구체화된 뷰  | RESUME은 구체화된 뷰에 대한 ALTER 작업입니다 |


## 사용 시 참고 사항 {#usage-notes}

- 이 문은 일반적으로 구체화된 뷰 일시 중지 문을 실행한 후에 사용합니다.

## 예제 {#example}

- 구체화된 뷰 mv1의 정기 실행 재개

    ```sql
    RESUME MATERIALIZED VIEW JOB ON mv1;
    ```
