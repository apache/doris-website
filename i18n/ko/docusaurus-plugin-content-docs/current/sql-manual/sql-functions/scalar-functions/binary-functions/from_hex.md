---
{
    "title": "FROM_HEX",
    "language": "ko",
    "description": "입력된 바이너리 데이터를 십육진수 인코딩을 사용하여 문자열로 변환합니다."
}
---

## 설명 {#description}

입력된 바이너리 데이터를 십육진수 인코딩을 사용하여 문자열로 변환합니다.

## 별칭 {#alias}

FROM_BINARY

## 구문 {#syntax}

```sql
FROM_HEX ( <varbinary> )
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
|-------|--------------|
| `<varbinary>` | 입력 매개변수는 바이너리 데이터입니다. |

## 반환값 {#return-value}

입력된 바이너리 데이터를 십육진수 인코딩을 사용하여 문자열로 변환합니다.

## 예제 {#example}

```sql
SELECT FROM_HEX(NULL);
```

```text
+----------------+
| FROM_HEX(NULL) |
+----------------+
| NULL           |
+----------------+
```

```sql
SELECT FROM_HEX(X'AB');
```

```text
+-----------------+
| FROM_HEX(X'AB') |
+-----------------+
| AB              |
+-----------------+
```

```sql
select *, from_binary(varbinary_c) from mysql_all_type_test.test_varbinary_db.test_varbinary
```

```text
+------+----------------------------+--------------------------+
| id   | varbinary_c                | from_binary(varbinary_c) |
+------+----------------------------+--------------------------+
|    1 | 0x48656C6C6F20576F726C64   | 48656C6C6F20576F726C64   |
|    2 | 0x48656C6C6F20576F726C6421 | 48656C6C6F20576F726C6421 |
|    3 | 0x48656C6C6F20576F726C6421 | 48656C6C6F20576F726C6421 |
|    4 | NULL                       | NULL                     |
|    5 | 0xAB                       | AB                       |
+------+----------------------------+--------------------------+
```
