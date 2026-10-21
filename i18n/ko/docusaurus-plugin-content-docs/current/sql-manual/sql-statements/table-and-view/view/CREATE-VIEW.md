---
{
    "title": "CREATE VIEW",
    "language": "ko",
    "description": "지정된 쿼리 문을 사용하여 논리적 뷰를 생성하는 구문입니다."
}
---

## 설명 {#description}

지정된 쿼리 문을 사용하여 논리적 뷰를 생성하는 구문입니다.

## 구문 {#syntax}

```sql
CREATE VIEW [IF NOT EXISTS] [<db_name>.]<view_name>
   [(<column_definition>)]
[AS] <query_stmt>
```

각 항목의 정의는 다음과 같습니다.
```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```

## 필수 매개변수 {#required-parameters}

**1. `<view_name>`**
> 뷰의 식별자(이름)입니다. 뷰가 생성되는 데이터베이스 내에서 고유해야 합니다.  
> 식별자는 문자로 시작해야 하며(유니코드 이름 지원이 활성화된 경우 모든 언어의 문자를 사용할 수 있음), 식별자 문자열 전체를 백틱으로 감싸지 않으면 공백이나 특수 문자를 포함할 수 없습니다(예: `My View`).  
> 식별자에는 예약 키워드를 사용할 수 없습니다.  
> 자세한 내용은 식별자 요구 사항과 예약 키워드를 참조하세요.

**2. `<query_stmt>`**
> 뷰를 정의하는 SELECT 쿼리 문입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**
> 뷰가 속한 데이터베이스의 이름입니다. 지정하지 않으면 기본적으로 현재 데이터베이스를 사용합니다.

**2. `<column_definition>`**
> 뷰의 컬럼 정의입니다.  
> 각 항목의 의미는 다음과 같습니다.  
> **1. `<column_name>`**  
> 컬럼 이름입니다.  
> **2. `<comment>`**  
> 컬럼에 대한 설명입니다.

## 접근 제어 요구 사항 {#access-control-requirements}

| 권한   | 객체   | 설명                                                                |
|-------------|----------|----------------------------------------------------------------------|
| CREATE_PRIV | 데이터베이스 | 데이터베이스에 대한 CREATE_PRIV 권한이 필요합니다.                   |
| SELECT_PRIV | 테이블, 뷰 | 쿼리 대상 테이블, 뷰 또는 구체화된 뷰에 대한 SELECT_PRIV 권한이 필요합니다. |

## 참고 사항 {#notes}

- 뷰는 논리적 객체이며 물리적 저장 공간이 없습니다. 뷰에 대한 모든 쿼리는 해당 서브쿼리에 대한 쿼리와 동일합니다.
- 뷰를 생성하거나 삭제해도 기반 테이블의 데이터에는 영향을 주지 않습니다.

## 예제 {#examples}

1. `example_view` 뷰를 `example_db`에 생성합니다.

    ```sql
    CREATE VIEW example_db.example_view (k1, k2, k3, v1)
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```

2. 컬럼 정의를 포함하여 뷰를 생성합니다.

    ```sql
    CREATE VIEW example_db.example_view
    (
        k1 COMMENT "first key",
        k2 COMMENT "second key",
        k3 COMMENT "third key",
        v1 COMMENT "first value"
    )
    COMMENT "my first view"
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```
