---
{
    "title": "BUILD INDEX",
    "language": "ko",
    "description": "테이블 전체 또는 테이블 파티션에 인덱스를 빌드합니다. 테이블 이름과 인덱스 이름을 지정해야 하며, 파티션 목록은 선택적으로 지정할 수 있습니다."
}
---

## 설명 {#description}

테이블 전체 또는 테이블 파티션에 인덱스를 빌드합니다. 테이블 이름과 인덱스 이름을 지정해야 하며, 파티션 목록은 선택적으로 지정할 수 있습니다.

## 구문 {#syntax}

```sql
BUILD INDEX <index_name> ON <table_name> [partition_list]
```

여기서 파티션 목록의 구문은 다음과 같습니다.

```sql
partition_list
  : PARTITION (<partition_name1>[ , parition_name2 ][ ... ])
```
## 필수 매개변수 {#required-parameters}

**<index_name>**

> 인덱스의 식별자(이름)를 지정합니다. 이 식별자는 해당 테이블 내에서 고유해야 합니다.
>
> 식별자는 영문자(유니코드 이름 지원이 활성화된 경우 모든 언어의 문자)로 시작해야 하며, 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

**<table_name>**

> 테이블의 식별자(이름)를 지정합니다. 이 식별자는 해당 데이터베이스 내에서 고유해야 합니다.
>
> 식별자는 영문자(유니코드 이름 지원이 활성화된 경우 모든 언어의 문자)로 시작해야 하며, 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

## 선택 매개변수 {#optional-parameters}

**<partition_list>**

> 쉼표로 구분된 파티션 식별자(이름) 목록을 지정합니다. 각 식별자는 해당 테이블 내에서 고유해야 합니다.
>
> 식별자는 영문자(유니코드 이름 지원이 활성화된 경우 모든 언어의 문자)로 시작해야 하며, 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 가지고 있어야 합니다.

| 권한       | 객체   | 참고 사항                                    |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | 테이블 | BUILD INDEX는 테이블에 대한 ALTER 작업입니다 |

## 사용 시 참고 사항 {#usage-notes}

- 현재 inverted index에만 사용할 수 있으며, BloomFilter index 등의 다른 인덱스에는 사용할 수 없습니다.
- 현재 compute-storage integrated 모드에서만 사용할 수 있으며, compute-storage separated 모드에서는 사용할 수 없습니다.
- BUILD INDEX의 진행 상황은 SHOW BUILD INDEX를 통해 확인할 수 있습니다.

## 예제 {#examples}

- table1 전체에 index1 인덱스를 빌드합니다.

  ```sql
  BUILD INDEX index1 ON table1
  ```

- table1의 p1 및 p2 파티션에 index1 인덱스를 빌드합니다.

  ```sql
  BUILD INDEX index1 ON table1 PARTITION(p1, p2)
  ```
