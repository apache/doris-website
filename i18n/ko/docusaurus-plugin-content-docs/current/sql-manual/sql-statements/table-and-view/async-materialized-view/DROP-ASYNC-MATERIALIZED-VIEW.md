---
{
    "title": "DROP ASYNC MATERIALIZED VIEW",
    "language": "ko",
    "description": "이 문은 비동기 구체화된 뷰를 삭제하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 비동기 구체화된 뷰를 삭제하는 데 사용됩니다.

구문:

```sql
DROP MATERIALIZED VIEW (IF EXISTS)? mvName=multipartIdentifier
```


1. IF EXISTS:
   구체화된 뷰가 존재하지 않아도 오류를 발생시키지 않습니다. 이 키워드를 지정하지 않은 상태에서 구체화된 뷰가 존재하지 않으면 오류가 발생합니다.

2. mv_name:
   삭제할 구체화된 뷰의 이름입니다. 필수 항목입니다.

## 예제 {#example}

1. 테이블의 구체화된 뷰 mv1 삭제

```sql
DROP MATERIALIZED VIEW mv1;
```
2.존재하는 경우 지정한 데이터베이스의 구체화된 뷰 삭제

```sql
DROP MATERIALIZED VIEW IF EXISTS db1.mv1;
```

## 키워드 {#keywords}

    DROP, ASYNC, MATERIALIZED, VIEW

## 모범 사례 {#best-practice}
