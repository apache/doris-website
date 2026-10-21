---
{
    "title": "ALTER TABLE COMMENT",
    "language": "ko",
    "description": "이 문은 기존 테이블의 주석을 수정하는 데 사용됩니다. 작업은 동기식으로 실행되며, 명령이 반환되면 작업이 완료된 것입니다."
}
---

## 설명 {#description}

이 문은 기존 테이블의 주석을 수정하는 데 사용됩니다. 작업은 동기식으로 실행되며, 명령이 반환되면 작업이 완료된 것입니다.

## 구문 {#syntax}

```sql
ALTER TABLE [database.]table alter_clause;
```

1. 테이블 주석 수정

## 구문 {#syntax-1}

```sql
MODIFY COMMENT "new table comment";
```

2. 컬럼 주석 수정

## 구문 {#syntax-2}

```sql
MODIFY COLUMN col1 COMMENT "new column comment";
```

## 예제 {#example}

1. table1의 주석을 table1_comment로 변경

```sql
ALTER TABLE table1 MODIFY COMMENT "table1_comment";
```

2. table1의 col1 주석을 table1_comment로 변경

```sql
ALTER TABLE table1 MODIFY COLUMN col1 COMMENT "table1_col1_comment";
```

## 키워드 {#keywords}

```text
ALTER, TABLE, COMMENT, ALTER TABLE
```

## 모범 사례 {#best-practice}
