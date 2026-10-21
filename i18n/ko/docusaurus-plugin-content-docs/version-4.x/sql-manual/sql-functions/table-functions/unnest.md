---
{
    "title": "UNNEST",
    "language": "ko"
}
---

## 설명 {#description}
`unnest`는 array/collection/map 타입 표현식을 여러 행으로 펼치는 테이블 생성 함수입니다. SELECT 목록과 FROM 절에서 사용할 수 있으며, WITH ORDINALITY를 사용하여 펼쳐진 각 행에 순번을 추가할 수 있습니다. `explode` 함수 계열과 마찬가지로 `unnest`는 여러 매개변수와 Map, Bitmap 등의 타입을 지원하며, FROM/LATERAL 및 JOIN 사용 시 LEFT(외부 조인) 동작도 지원합니다.

## 구문 {#syntax}
```sql
UNNEST(<expr>[, ...]) [WITH ORDINALITY] [AS alias [(col1, col2, ...)]]
-- LATERAL can be added before the FROM clause: LATERAL UNNEST(...), where LATERAL is an optional keyword
```

## 매개변수 {#parameters}
- <expr>: ARRAY, MAP, BITMAP 또는 표현식 목록을 사용할 수 있습니다(여러 매개변수를 사용할 때는 ARRAY 타입만 지원됩니다).

## 반환 값 {#return-values}
- 단일 ARRAY 매개변수: 요소 타입의 값을 여러 행으로 구성한 단일 열을 반환합니다(요소당 한 행). 요소가 NULL이면 NULL을 출력합니다.
- 여러 ARRAY 매개변수: 각 매개변수에서 펼쳐진 요소를 위치별로 대응시켜 여러 열(또는 Struct)로 결합합니다. 펼쳐지는 행 수는 가장 긴 입력에 따라 결정되며, 길이가 짧은 열은 NULL로 채웁니다.
- MAP 매개변수: 두 열(Struct)(key, value)을 반환합니다. NULL인 키/값은 NULL로 유지됩니다.
- BITMAP 매개변수: 요소별로 정숫값을 반환합니다.
- WITH ORDINALITY: 출력에 0부터 시작하는 순번 열을 추가합니다(첫 번째 열로 추가되거나 별칭으로 지정됩니다).
- 빈 배열 또는 NULL:
  - 독립적인 테이블을 생성할 때(SELECT 목록 또는 FROM ... UNNEST) 매개변수가 NULL이거나 빈 배열이면 행을 생성하지 않습니다(0행).
  - FROM/LATERAL 및 LEFT JOIN과 함께 사용할 때(외부 조인 방식으로 행을 생성하는 경우), 상위 행에서 펼쳐진 행이 모두 필터링되거나 출력이 없으면 해당 상위 행에 대해 행 하나를 삽입하고 UNNEST 출력 열을 NULL로 설정합니다(왼쪽 테이블의 행을 유지하기 위함).

## 사용 시 참고 사항 {#usage-notes}
1. 매개변수 타입은 ARRAY / MAP / BITMAP이어야 하며, 다른 타입이면 오류가 발생합니다.
2. 여러 매개변수를 펼칠 때는 위치별로 요소를 짝지으며, 부족한 열은 NULL로 채웁니다.
3. AS와 함께 별칭을 사용하여 펼쳐진 열의 이름을 명시적으로 지정할 수 있습니다. 열 이름을 지정하지 않으면 시스템이 기본 열 이름을 생성합니다.
4. JOIN 사용 시:
   - INNER / CROSS JOIN: 펼쳐진 결과를 바탕으로 데카르트 곱을 계산하거나 일치하는 행을 결합합니다.
   - LEFT JOIN LATERAL: 외부 조인 동작을 구현합니다. 일치하는 행이 없거나 펼쳐진 결과가 모두 ON/필터 조건에 의해 필터링되면 NULL 값을 갖는 행을 생성합니다(왼쪽 테이블의 행을 유지하기 위함).
5. WITH ORDINALITY는 펼쳐진 행에 순번(0부터 시작)을 추가합니다.
6. SELECT 목록에서 UNNEST(...)를 직접 사용하면 단일 행으로 구성된 소스에 테이블 생성 함수를 적용하는 것과 같으며, 표현식이 여러 출력 행으로 펼쳐집니다.

## 예제 {#examples}
준비:
```sql
CREATE TABLE items (
    id INT,
    name VARCHAR(50),
    tags ARRAY<VARCHAR(50)>, 
    price DECIMAL(10,2),
    category_ids ARRAY<INT>  
) ENGINE=OLAP
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

INSERT INTO items (id, name, tags, price, category_ids) VALUES
        (1, 'Laptop', ['Electronics', 'Office', 'High-End', 'Laptop'], 5999.99, [1, 2, 3]),
        (2, 'Mechanical Keyboard', ['Electronics', 'Accessories'], 399.99, [1, 2]),
        (3, 'Basketball', ['Sports', 'Outdoor'], 199.99, [1,3]),
        (4, 'Badminton Racket', ['Sports', 'Equipment'], 299.99, [3]),
        (5, 'Shirt', ['Clothing', 'Office', 'Shirt'], 259.00, [4]);
```
1. SELECT 목록에서 사용(단일 표현식을 여러 행으로 펼침):
```sql
SELECT unnest([1,2,3]);
```
출력(예시):
```sql
+-----------------+
| unnest([1,2,3]) |
+-----------------+
|               1 |
|               2 |
|               3 |
+-----------------+
```
2. FROM / LATERAL에서 열 이름을 지정하여 펼치기:
```sql
SELECT i.id, t.tag
FROM items i, unnest(i.tags) AS t(tag)
ORDER BY i.id, t.tag;
```
출력(예시):
```sql
+------+-------------+
| id   | tag         |
+------+-------------+
|    1 | Electronics |
|    1 | High-End    |
|    1 | Laptop      |
|    1 | Office      |
|    2 | Accessories |
|    2 | Electronics |
|    3 | Outdoor     |
|    3 | Sports      |
|    4 | Equipment   |
|    4 | Sports      |
|    5 | Clothing    |
|    5 | Office      |
|    5 | Shirt       |
+------+-------------+
```
3. WITH ORDINALITY：
```sql
SELECT i.id, t.tag, t.ord
FROM items i, unnest(i.tags) WITH ORDINALITY AS t(ord, tag)
ORDER BY i.id, t.ord;
```
출력(예시):
```sql
+------+-------------+------+
| id   | tag         | ord  |
+------+-------------+------+
|    1 | Electronics |    0 |
|    1 | High-End    |    2 |
|    1 | Laptop      |    3 |
|    1 | Office      |    1 |
|    2 | Accessories |    1 |
|    2 | Electronics |    0 |
|    3 | Outdoor     |    1 |
|    3 | Sports      |    0 |
|    4 | Equipment   |    1 |
|    4 | Sports      |    0 |
|    5 | Clothing    |    0 |
|    5 | Office      |    1 |
|    5 | Shirt       |    2 |
+------+-------------+------+
```
4. INNER JOIN으로 일치하는 행 유지:
```sql
SELECT i.id, t.tag, i.name
FROM items i
INNER JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
출력(예시):
```sql
+------+--------+--------+
| id   | tag    | name   |
+------+--------+--------+
|    1 | Laptop | Laptop |
|    5 | Shirt  | Shirt  |
+------+--------+--------+
```
5. LEFT JOIN으로 왼쪽 테이블의 행 유지(일치하는 행이 없으면 UNNEST 열은 NULL이 됨):
```sql
SELECT i.id, t.tag, i.name
FROM items i
LEFT JOIN unnest(i.tags) AS t(tag) ON t.tag = i.name;
```
출력(예시):
```sql
+------+--------+---------------------+
| id   | tag    | name                |
+------+--------+---------------------+
|    1 | Laptop | Laptop              |
|    2 | NULL   | Mechanical Keyboard |
|    3 | NULL   | Basketball          |
|    4 | NULL   | Badminton Racket    |
|    5 | Shirt  | Shirt               |
+------+--------+---------------------+
```
6. 여러 ARRAY 매개변수 / Map / Bitmap:
```sql
SELECT * FROM unnest([1,2], ['a','b']) AS t(c1, c2) ORDER BY 1;
+------+------+
| c1   | c2   |
+------+------+
|    1 | a    |
|    2 | b    |
+------+------+

SELECT * FROM unnest(bitmap_or(to_bitmap(23), to_bitmap(24))) AS t(col) ORDER BY 1;
+------+
| col  |
+------+
|   23 |
|   24 |
+------+

SELECT * FROM unnest({1:2, 3:4}) AS t(k, v) ORDER BY 1;
+------+------+
| k    | v    |
+------+------+
|    1 |    2 |
|    3 |    4 |
+------+------+
```
7. SELECT 목록에서 사용
```sql
SELECT tags, category_ids, unnest(tags), unnest(category_ids) from items ORDER BY 1, 2;
+-------------------------------------------------+--------------+--------------+----------------------+
| tags                                            | category_ids | unnest(tags) | unnest(category_ids) |
+-------------------------------------------------+--------------+--------------+----------------------+
| ["Clothing", "Office", "Shirt"]                 | [4]          | Clothing     |                    4 |
| ["Clothing", "Office", "Shirt"]                 | [4]          | Office       |                 NULL |
| ["Clothing", "Office", "Shirt"]                 | [4]          | Shirt        |                 NULL |
| ["Electronics", "Accessories"]                  | [1, 2]       | Electronics  |                    1 |
| ["Electronics", "Accessories"]                  | [1, 2]       | Accessories  |                    2 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Electronics  |                    1 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Office       |                    2 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | High-End     |                    3 |
| ["Electronics", "Office", "High-End", "Laptop"] | [1, 2, 3]    | Laptop       |                 NULL |
| ["Sports", "Equipment"]                         | [3]          | Sports       |                    3 |
| ["Sports", "Equipment"]                         | [3]          | Equipment    |                 NULL |
| ["Sports", "Outdoor"]                           | [1, 3]       | Sports       |                    1 |
| ["Sports", "Outdoor"]                           | [1, 3]       | Outdoor      |                    3 |
+-------------------------------------------------+--------------+--------------+----------------------+
```
