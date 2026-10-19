---
{
    "title": "BOOLEAN",
    "language": "ko",
    "description": "BOOL, BOOLEAN: TINYINT와 마찬가지로 0은 false를, 1은 true를 나타냅니다."
}
---

## 설명 {#description}

BOOLEAN(별칭: BOOL)은 Doris에서 불리언 값인 true와 false를 나타내는 데이터 타입입니다.

내부적으로 BOOLEAN은 uint8 값으로 저장되며, 0은 false를, 1은 true를 나타냅니다.

BOOLEAN이 TINYINT(1)의 별칭인 MySQL과 달리, Doris는 PostgreSQL, Oracle 및 기타 데이터베이스 시스템처럼 BOOLEAN을 별도의 데이터 타입으로 취급합니다.

## 값 범위 {#value-range}

BOOLEAN 값으로는 다음 값만 사용할 수 있습니다:
- `true` (표시할 때는 1로 나타남)
- `false` (표시할 때는 0으로 나타남)

메모리에서 BOOLEAN 타입은 0 또는 1로만 존재하며, 다른 값은 가질 수 없습니다.

## 리터럴 값 {#literal-values}

Doris에서는 대소문자를 구분하지 않는 키워드 `true`와 `false`를 사용하여 불리언 리터럴 값을 나타낼 수 있습니다:

```sql
mysql> select TrUe, False, true;
+------+-------+------+
| TrUe | False | true |
+------+-------+------+
|    1 |     0 |    1 |
+------+-------+------+
```

## 지원 연산 {#supported-operations}

### 논리 연산 {#logical-operations}

BOOLEAN 타입은 AND, OR, NOT, XOR 등의 논리 연산을 지원합니다:

```sql
mysql> select true AND false, true OR false, NOT true, true XOR false;
+----------------+---------------+----------+----------------+
| true AND false | true OR false | NOT true | true XOR false |
+----------------+---------------+----------+----------------+
|              0 |             1 |        0 |              1 |
+----------------+---------------+----------+----------------+
```

### 산술 연산 {#arithmetic-operations}

BOOLEAN은 산술 연산을 직접 지원하지 않지만, 암시적 타입 변환 덕분에 `true + true`와 같은 표현식은 사용할 수 있습니다:

```sql
mysql> select true + true;
+-------------+
| true + true |
+-------------+
|           2 |
+-------------+
```

이는 불리언 값이 SMALLINT로 암시적으로 변환되기 때문입니다: `CAST(TRUE AS smallint) + CAST(TRUE AS smallint)`.

## 타입 변환 {#type-conversion}

MySQL의 관례 때문에 비슷해 보일 수 있지만, Doris에서 BOOLEAN은 TINYINT와 동일한 타입이 아니라는 점에 유의해야 합니다.

TINYINT 컬럼에 불리언 리터럴을 삽입하면 암시적 타입 변환이 발생합니다:

```sql
CREATE TABLE test_boolean(
    u8 TINYINT
)
properties("replication_num" = "1");

mysql> insert into test_boolean values(true);
```

이 예제에서는 불리언 리터럴 `true`가 TINYINT 값으로 변환됩니다.

## 키워드 {#keywords}

BOOL, BOOLEAN
