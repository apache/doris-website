---
{
    "title": "SHOW INDEX",
    "language": "ko",
    "description": "이 문은 테이블의 인덱스 정보를 표시하는 데 사용됩니다. 현재는 역색인과 ann 인덱스만 지원합니다."
}
---

## 설명 {#description}

이 문은 테이블의 인덱스 정보를 표시하는 데 사용됩니다. 현재는 역색인과 ann 인덱스만 지원합니다.

## 구문 {#syntax}

```SQL
SHOW INDEX [ ES ] FROM [ <db_name>. ] <table_name> [ FROM <db_name> ];
```

## 대체 구문 {#varaint-syntax}

```SQL
SHOW KEY[ S ] FROM [ <db_name>. ] <table_name> [ FROM <db_name> ];
```
## 필수 매개변수 {#required-parameters}

**1. `<table_name>`**: 인덱스가 속한 테이블의 이름입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**: 데이터베이스 이름이며, 생략할 수 있습니다. 지정하지 않으면 기본적으로 현재 데이터베이스를 사용합니다.

## 반환값 {#return-value}

| 열 이름        | 유형   | 설명                                                                                                           |
|----------------|--------|----------------------------------------------------------------------------------------------------------------|
| Table          | string | 인덱스가 있는 테이블의 이름입니다.                                                                              |
| Non_unique     | int    | 인덱스의 고유 여부를 나타냅니다: <br> - `0`: 고유 인덱스 <br> - `1`: 비고유 인덱스                               |
| Key_name       | string | 인덱스의 이름입니다.                                                                                           |
| Seq_in_index   | int    | 인덱스에서 열의 위치입니다. 이 열은 인덱스 내 열의 순서를 나타내며, 여러 열이 복합 인덱스를 구성할 때 사용됩니다. |
| Column_name    | string | 인덱스가 설정된 열의 이름입니다.                                                                                |
| Collation      | string | 인덱스 열의 정렬 순서입니다: <br> - `A`: 오름차순 <br> - `D`: 내림차순.                                         |
| Cardinality    | int    | 인덱스 내 고유 값의 개수입니다. 이 값은 쿼리 효율성을 추정하는 데 사용되며, 값이 클수록 인덱스 선택도와 쿼리 효율성이 높아집니다. |
| Sub_part       | int    | 인덱스에서 사용하는 접두부 길이입니다. 인덱스 열이 문자열 유형이면 `Sub_part`는 인덱스에 사용되는 문자열 앞부분의 길이를 나타냅니다. |
| Packed         | string | 인덱스의 압축 여부입니다.                                                                                      |
| Null           | string | `NULL` 값의 허용 여부입니다: <br> - `YES`: NULL 값 허용 <br> - `NO`: NULL 값 허용 안 함                          |
| Index_type     | string | 인덱스 유형입니다: <br> - `BTREE`: B+ 트리 인덱스(MySQL의 기본 유형) <br> - `HASH`: 해시 인덱스 <br> - `RTREE`: R 트리 인덱스 <br> - `INVERTED`: 역색인(예: 전문 인덱스) |
| Comment        | string | 인덱스의 주석 또는 설명이며, 일반적으로 사용자가 작성한 비고입니다.                                             |
| Properties     | string | 인덱스의 추가 속성입니다.                                                                                      |


## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다:

| 권한       | 객체      | 참고 |
|:-----------|:----------|:------|
| SHOW_PRIV  | 데이터베이스 |       |

## 예시 {#examples}

- 지정된 `table_name`의 인덱스 표시

     ```SQL
      SHOW INDEX FROM example_db.table_name;
     ```
