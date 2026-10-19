---
{
    "title": "CANCEL BUILD INDEX",
    "language": "ko",
    "description": "인덱스 빌드를 위한 백그라운드 작업을 취소합니다."
}
---

## 설명 {#description}

인덱스 빌드를 위한 백그라운드 작업을 취소합니다.

## 구문 {#syntax}


```sql
CANCEL BUILD INDEX ON <table_name> [ job_list ]
```

각 항목은 다음과 같이 정의됩니다:

```sql
job_list
  : (<job_id1>[ , job_id2 ][ ... ])
```
## 필수 매개변수 {#required-parameters}

**<table_name>**

> 테이블의 식별자(즉, 이름)를 지정합니다. 식별자는 해당 데이터베이스(Database) 내에서 고유해야 합니다.
>
> 식별자는 영문자로 시작해야 합니다(unicode 이름 지원이 활성화된 경우 모든 언어의 문자로 시작할 수 있습니다). 식별자 문자열 전체를 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

## 선택적 매개변수 {#optional-parameters}

**<job_list>**

> 쉼표로 구분하고 괄호로 묶은 인덱스 빌드 작업 식별자 목록을 지정합니다.
>
> 식별자는 숫자여야 하며 SHOW BUILD INDEX로 확인할 수 있습니다.

## 액세스 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한       | 객체   | 참고                                                         |
| :--------- | :----- | :----------------------------------------------------------- |
| ALTER_PRIV | 테이블 | CANCEL BUILD INDEX는 테이블에 대한 ALTER 작업으로 간주됩니다 |

## 사용 시 유의 사항 {#usage-notes}

- 현재 역색인에만 적용되며 bloomfilter 인덱스와 같은 다른 인덱스에는 적용되지 않습니다.
- 현재 스토리지와 컴퓨팅이 통합된 모드에서만 적용되며 스토리지와 컴퓨팅이 분리된 모드에서는 적용되지 않습니다.
- BUILD INDEX의 진행 상황과 인덱스 빌드 작업은 SHOW BUILD INDEX로 확인할 수 있습니다.

## 예제 {#examples}

- 테이블 table1의 모든 인덱스 빌드 작업 취소

  ```sql
  CANCEL BUILD INDEX ON table1
  ```

- 테이블 table1의 인덱스 빌드 작업 jobid1 및 jobid2 취소

  ```sql
  CANCEL BUILD INDEX ON table1(jobid1, jobid2)
  ```
