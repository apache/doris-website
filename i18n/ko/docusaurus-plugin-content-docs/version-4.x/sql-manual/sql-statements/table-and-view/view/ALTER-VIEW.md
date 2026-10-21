---
{
    "title": "ALTER VIEW",
    "language": "ko",
    "description": "이 문은 논리 뷰의 정의를 수정하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 논리 뷰의 정의를 수정하는 데 사용됩니다.

## 구문 {#syntax}

```sql
ALTER VIEW [<db_name>.]<view_name> 
 [(<column_definition>)]
AS <query_stmt>
```

여기서:
```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```

## 필수 매개변수 {#required-parameters}

**1. `<view_name>`**
> 수정할 뷰의 식별자(즉, 이름)입니다.

**2. `<query_stmt>`**
> 뷰를 정의하는 SELECT 쿼리 문입니다.

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**
> 뷰가 속한 데이터베이스의 이름입니다. 지정하지 않으면 기본적으로 현재 데이터베이스를 사용합니다.

**2. `<column_definition>`**
> 뷰의 컬럼 정의입니다.  
> 각 항목은 다음과 같습니다.  
> **1. `<column_name>`**  
> 컬럼 이름입니다.  
> **2. `<comment>`**  
> 컬럼 주석입니다.

## 액세스 제어 요구 사항 {#access-control-requirements}

| 권한     | 객체   | 참고 사항                                                                 |
|---------------|----------|-----------------------------------------------------------------------|
| ALTER_PRIV   | 뷰     | 수정할 뷰에 대한 ALTER_PRIV 권한이 필요합니다.         |
| SELECT_PRIV  | 테이블, 뷰 | 쿼리 대상 테이블, 뷰 또는 구체화된 뷰에 대한 SELECT_PRIV 권한이 필요합니다. |

## 예제 {#example}

1. 뷰 `example_view`를 `example_db`에서 수정합니다.

  ```sql
  ALTER VIEW example_db.example_view
  (
    c1 COMMENT "column 1",
    c2 COMMENT "column 2",
    c3 COMMENT "column 3"
  )
  AS SELECT k1, k2, SUM(v1) FROM example_table 
  GROUP BY k1, k2
  ```
