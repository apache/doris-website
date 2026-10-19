---
{
    "title": "DESC FUNCTION",
    "language": "ko",
    "description": "desc function tablevaluedfunction을 사용하여 해당 테이블 반환 함수의 스키마 정보를 가져옵니다."
}
---

## 설명 {#description}

desc function table_valued_function을 사용하여 해당 테이블 반환 함수의 스키마 정보를 가져옵니다.

## 구문 {#syntax}

```sql
DESC FUNCTION <table_valued_function>
```

## 필수 매개변수 {#required-parameters}

**<table_valued_function>**

> table_valued_function은 CATALOGS와 같은 테이블 반환 함수의 이름입니다. 지원되는 테이블 반환 함수 목록은 "[테이블 반환 함수](https://doris.apache.org/docs/dev/lakehouse/file-analysis)" 섹션을 참조하세요.

## 예제 {#examples}

테이블 반환 함수 CATALOGS의 정보를 쿼리합니다:

```sql
DESC FUNCTION catalogs();
```

결과는 다음과 같습니다:

```sql
+-------------+--------+------+-------+---------+-------+
| Field       | Type   | Null | Key   | Default | Extra |
+-------------+--------+------+-------+---------+-------+
| CatalogId   | bigint | No   | false | NULL    | NONE  |
| CatalogName | text   | No   | false | NULL    | NONE  |
| CatalogType | text   | No   | false | NULL    | NONE  |
| Property    | text   | No   | false | NULL    | NONE  |
| Value       | text   | No   | false | NULL    | NONE  |
+-------------+--------+------+-------+---------+-------+
```
