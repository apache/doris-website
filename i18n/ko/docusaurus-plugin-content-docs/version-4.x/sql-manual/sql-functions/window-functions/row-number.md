---
{
    "title": "ROW_NUMBER",
    "language": "ko",
    "description": "ROWNUMBER()은 파티션 내의 각 행에 고유한 일련번호를 부여하는 윈도우 함수입니다."
}
---

## 설명 {#description}

ROW_NUMBER()는 파티션 내의 각 행에 고유한 일련번호를 부여하는 윈도우 함수입니다. 번호는 1부터 시작하여 연속적으로 증가합니다. RANK() 및 DENSE_RANK()와 달리 ROW_NUMBER()는 값이 같더라도 서로 다른 번호를 부여하므로 각 행의 번호가 고유합니다.

## 구문 {#syntax}

```sql
ROW_NUMBER()
```

## 반환 값 {#return-value}

1부터 시작하여 연속적으로 증가하는 BIGINT 형식의 일련번호를 반환합니다. 번호는 각 파티션 내에서 고유합니다.

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE int_t (x INT, y INT) DISTRIBUTED BY HASH(x) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO int_t VALUES (1,1),(1,2),(1,2),(2,1),(2,2),(2,3),(3,1),(3,1),(3,2);
-->

```sql
select x, y, row_number() over(partition by x order by y) as rank from int_t;
```

```text
+-----+-----+------+
| x   | y   | rank |
| --- | --- | ---- |
| 1   | 1   | 1    |
| 1   | 2   | 2    |
| 1   | 2   | 3    |
| 2   | 1   | 1    |
| 2   | 2   | 2    |
| 2   | 3   | 3    |
| 3   | 1   | 1    |
| 3   | 1   | 2    |
| 3   | 2   | 3    |
+-----+-----+------+
```
