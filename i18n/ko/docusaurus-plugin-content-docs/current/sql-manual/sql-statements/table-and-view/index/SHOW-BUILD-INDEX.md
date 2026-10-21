---
{
    "title": "SHOW BUILD INDEX",
    "language": "ko",
    "description": "인덱스 빌드 작업의 상태를 확인합니다."
}
---

## 설명 {#description}

인덱스 빌드 작업의 상태를 확인합니다.

## 구문 {#syntax}

```sql
SHOW BUILD INDEX [ (FROM | IN) <database_name>
[ where_clause ] [ sort_clause ] [ limit_clause ] ] 
```

각 절의 정의는 다음과 같습니다.

```sql
where_clause
  : WHERE <output_column_name = value>
```

각 절의 정의는 다음과 같습니다.

```sql
sort_clause
  :
   ORDER BY <output_column_name>
```

각 절의 정의는 다음과 같습니다.

```sql
limit_clause
  :
   LIMIT <n>
```
## 선택적 매개변수 {#optional-parameters}

**`<database_name>`**

> 데이터베이스의 식별자(이름)를 지정합니다. 식별자는 해당 클러스터 내에서 고유해야 합니다.
>
> 식별자는 문자로 시작해야 합니다(unicode 이름 지원이 활성화된 경우 모든 언어의 문자 사용 가능). 식별자 문자열 전체를 백틱으로 감싸지 않는 한 공백이나 특수 문자를 포함할 수 없습니다(예: `My Object`).
>
> 식별자에는 예약 키워드를 사용할 수 없습니다.
>
> 자세한 내용은 식별자 요구 사항 및 예약 키워드를 참조하세요.


**`<WHERE output_column_name = value>`**

> 출력 필터 조건을 지정합니다. output_column_name은 출력 필드 목록에 포함되어야 합니다.

**`<ORDER BY output_column_name>`**

> 출력 정렬 기준 열을 지정합니다. output_column_name은 출력 필드 목록에 포함되어야 합니다.

**`LIMIT <n>`**

> 출력 행 수의 상한을 지정합니다. n은 숫자여야 합니다.

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한 | 객체   | 비고 |
| :-------- | :------- | :---- |
| SHOW_PRIV | 데이터베이스 |       |

## 사용 시 참고 사항 {#usage-notes}

- 현재는 역색인에만 적용되며, bloomfilter 인덱스와 같은 다른 인덱스에는 적용되지 않습니다.
- 현재는 스토리지와 컴퓨팅이 통합된 모드에만 적용되며, 스토리지와 컴퓨팅이 분리된 모드에는 적용되지 않습니다.

## 예제 {#examples}

- 모든 인덱스 빌드 작업 조회

  ```sql
  SHOW BUILD INDEX
  ```

- database1 데이터베이스의 인덱스 빌드 작업 조회

  ```sql
  SHOW BUILD INDEX FROM database1
  ```

- table1 테이블의 인덱스 빌드 작업 조회

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1'
  ```

- table1 테이블의 인덱스 빌드 작업을 JobId 기준으로 정렬하여 처음 10개 행 조회

  ```sql
  SHOW BUILD INDEX WHERE TableName = 'table1' ORDER BY JobId LIMIT 10
  ```
