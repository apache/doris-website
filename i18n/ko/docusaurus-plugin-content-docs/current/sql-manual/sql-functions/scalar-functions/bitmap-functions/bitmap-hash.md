---
{
    "title": "BITMAP_HASH",
    "language": "ko",
    "description": "모든 입력 타입의 32비트 해시 값을 계산하고 해당 해시 값을 포함하는 Bitmap을 반환합니다."
}
---

## 설명 {#description}

모든 입력 타입의 32비트 해시 값을 계산하고 해당 해시 값을 포함하는 Bitmap을 반환합니다.

## 구문 {#syntax}

```sql
BITMAP_HASH(<expr>)
```

## 매개변수 {#parameters}

| 매개변수 | 설명           |
|-----------|-----------------------|
| `<expr>`  | 임의의 값 또는 필드 표현식 |

## 반환 값 {#return-value}

매개변수 `<expr>`의 32비트 해시 값을 포함하는 Bitmap을 반환합니다.
- 매개변수 값이 NULL이면 빈 Bitmap을 반환합니다.

::: note

사용하는 해시 알고리즘은 MurMur3입니다.
MurMur3는 성능이 높고 충돌이 적은 해시 알고리즘으로, 무작위 분포에 가까운 값을 생성하며 카이제곱 분포 검정을 통과할 수 있습니다. 하드웨어 플랫폼과 시드 값에 따라 계산된 해시 값이 달라질 수 있습니다.
이 알고리즘의 성능에 관한 자세한 내용은 [Smhasher](http://rurban.github.io/smhasher/) 벤치마크를 참조하세요.

:::

## 예제 {#examples}

값의 MurMur3 해시는 다음과 같이 계산할 수 있습니다:

```sql
select bitmap_to_array(bitmap_hash('hello'))[1];
```

결과는 다음과 같습니다:

```text
+-------------------------------------------------------------+
| %element_extract%(bitmap_to_array(bitmap_hash('hello')), 1) |
+-------------------------------------------------------------+
|                                                  1321743225 |
+-------------------------------------------------------------+
```

Bitmap을 사용하여 컬럼의 고유한 값 개수를 계산할 수 있으며, 일부 상황에서는 `count distinct`보다 효율적일 수 있습니다. 아래 예제에서는 `words` 테이블에 6개의 행을 삽입하며, 고유한 값은 4개입니다. 문서 코퍼스 규모에서는 이와 같은 형태의 실제 쿼리가 수백만 단위의 수치를 반환할 수 있습니다:

```sql
CREATE TABLE `words` (`word` VARCHAR(64))
DISTRIBUTED BY HASH(`word`) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO `words` VALUES ('apple'), ('banana'), ('cherry'), ('apple'), ('date'), ('banana');

select bitmap_count(bitmap_union(bitmap_hash(`word`))) from `words`;
```

```text
+-------------------------------------------------+
| bitmap_count(bitmap_union(bitmap_hash(`word`))) |
+-------------------------------------------------+
|                                               4 |
+-------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_hash(NULL)) AS res;
```

결과는 다음과 같습니다:

```text
+------+
| res  |
+------+
|      |
+------+
```
