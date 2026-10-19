---
{
    "title": "SHOW COLLATION",
    "language": "ko",
    "description": "Doris에서 SHOW COLLATION 명령은 데이터베이스에서 사용할 수 있는 문자 집합의 collation을 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

Doris에서 SHOW COLLATION 명령은 데이터베이스에서 사용할 수 있는 문자 집합의 collation을 표시하는 데 사용됩니다. collation은 데이터의 정렬 및 비교 방식을 결정하는 규칙의 집합입니다. 이러한 규칙은 문자 데이터의 저장과 검색에 영향을 줍니다.

## 구문 {#syntax}

```sql
SHOW COLLATION
```

## 반환 값 {#return-value}

| 열 이름 | 설명  |
| -- |--------------|
| Collation | collation 이름         |
| Charset | 문자 집합          |
| Id | collation의 ID        |
| Default | 문자 집합의 기본 collation인지 여부 |
| Compiled | collation의 컴파일 여부        |
| Sortlen | 정렬 길이         |



## 사용 시 참고 사항 {#usage-notes}

Doris는 MySQL의 collation 설정 명령과 호환되지만, 해당 설정은 실제로 적용되지 않습니다. 실행 시에는 항상 utf8mb4_0900_bin이 비교 규칙으로 사용됩니다.

## 예제 {#examples}

```sql
SHOW COLLATION;
```

```text
+--------------------+---------+------+---------+----------+---------+
| Collation          | Charset | Id   | Default | Compiled | Sortlen |
+--------------------+---------+------+---------+----------+---------+
| utf8mb4_0900_bin   | utf8mb4 |  309 | Yes     | Yes      |       1 |
| utf8mb3_general_ci | utf8mb3 |   33 | Yes     | Yes      |       1 |
+--------------------+---------+------+---------+----------+---------+
```
