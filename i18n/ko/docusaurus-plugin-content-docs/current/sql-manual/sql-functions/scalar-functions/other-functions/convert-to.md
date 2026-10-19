---
{
    "title": "CONVERT_TO",
    "language": "ko",
    "description": "컬럼의 문자 인코딩을 지정된 대상 문자 집합으로 변환합니다."
}
---

## 설명 {#description}

컬럼의 문자 인코딩을 지정된 대상 문자 집합으로 변환합니다. 이 함수는 일반적으로 ORDER BY 절에서 중국어 문자가 포함된 컬럼을 pinyin 순서로 정렬하는 데 사용됩니다. 현재는 `'gbk'`로의 변환만 지원합니다.

## 구문 {#syntax}

```sql
CONVERT_TO(<column>, <character>)
```

## 매개변수 {#parameters}

| 매개변수        | 설명                                                                        |
|----------------|-----------------------------------------------------------------------------|
| `<column>`     | 인코딩을 변환할 VARCHAR 컬럼입니다.                                          |
| `<character>`  | 대상 문자 집합입니다. 현재는 `'gbk'`만 지원합니다.                          |

## 반환 값 {#return-value}

변환된 인코딩의 VARCHAR 값을 반환합니다. ORDER BY 절에서 사용하면 pinyin 순서로 올바르게 정렬할 수 있습니다.

## 예제 {#examples}

<!-- setup-sql
CREATE TABLE class_test (class_id INT, class_name VARCHAR(50), student_ids ARRAY<INT>) DISTRIBUTED BY HASH(class_id) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO class_test VALUES (1,'啊',[1]),(2,'哈',[2]),(3,'哦',[3]),(4,'张',[4]),(5,'我',[5]),(6,'asd',[6]),(7,'qwe',[7]),(8,'z',[8]);
-->

```sql
SELECT * FROM class_test ORDER BY class_name;
```

```text
+----------+------------+-------------+
| class_id | class_name | student_ids |
+----------+------------+-------------+
|        6 | asd        | [6]         |
|        7 | qwe        | [7]         |
|        8 | z          | [8]         |
|        2 | 哈         | [2]         |
|        3 | 哦         | [3]         |
|        1 | 啊         | [1]         |
|        4 | 张         | [4]         |
|        5 | 我         | [5]         |
+----------+------------+-------------+
```

```sql
SELECT * FROM class_test ORDER BY CONVERT_TO(class_name, 'gbk');
```

```text
+----------+------------+-------------+
| class_id | class_name | student_ids |
+----------+------------+-------------+
|        6 | asd        | [6]         |
|        7 | qwe        | [7]         |
|        8 | z          | [8]         |
|        1 | 啊         | [1]         |
|        2 | 哈         | [2]         |
|        3 | 哦         | [3]         |
|        5 | 我         | [5]         |
|        4 | 张         | [4]         |
+----------+------------+-------------+
```
