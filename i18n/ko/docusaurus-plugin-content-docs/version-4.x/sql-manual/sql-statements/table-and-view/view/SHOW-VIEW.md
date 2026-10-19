---
{
    "title": "SHOW VIEW",
    "language": "ko",
    "description": "이 문은 지정된 테이블을 기반으로 생성된 모든 뷰를 표시하는 데 사용됩니다"
}
---

## 설명 {#description}

이 문은 지정된 테이블을 기반으로 생성된 모든 뷰를 표시하는 데 사용됩니다

## 구문 {#syntax}

```sql
  SHOW VIEW { FROM | IN } table [ FROM db ]
```

## 예제 {#example}

1. testTbl 테이블을 기반으로 생성된 모든 뷰 표시

    ```sql
    SHOW VIEW FROM testTbl;
    ```

## 키워드 {#keywords}

    SHOW, VIEW
