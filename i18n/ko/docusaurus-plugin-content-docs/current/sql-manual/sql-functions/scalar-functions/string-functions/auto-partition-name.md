---
{
    "title": "AUTO_PARTITION_NAME",
    "language": "ko",
    "description": "AUTO_PARTITION_NAME 함수는 자동 파티션의 이름을 생성하는 데 사용됩니다. 두 가지 모드를 지원합니다. RANGE 모드는 시간 단위를 기준으로 파티션 이름을 생성하고, LIST 모드는 문자열 값을 기준으로 파티션 이름을 생성합니다."
}
---

## 설명 {#description}

AUTO_PARTITION_NAME 함수는 자동 파티션의 이름을 생성하는 데 사용됩니다. 두 가지 모드를 지원합니다. RANGE 모드는 시간 단위를 기준으로 파티션 이름을 생성하고, LIST 모드는 문자열 값을 기준으로 파티션 이름을 생성합니다.

Apache Doris 2.1.6부터 지원됩니다.

## 구문 {#syntax}

```sql
AUTO_PARTITION_NAME('RANGE', <unit>, <datetime>)
AUTO_PARTITION_NAME('LIST', <value>[, <value> ...])
```

## 매개변수 {#parameters}

| 매개변수 | 설명 |
| ----------- | ----------------------------------------- |
| `'RANGE'` | RANGE 파티션 모드로, 시간을 기준으로 파티션 이름을 생성합니다 |
| `'LIST'` | LIST 파티션 모드로, 문자열 값을 기준으로 파티션 이름을 생성합니다 |
| `<unit>` | RANGE 모드의 시간 단위: `year`, `month`, `day`, `hour`, `minute`, `second`. 타입: VARCHAR |
| `<datetime>` | RANGE 모드의 날짜 및 시간 값. 타입: DATETIME |
| `<value>` | LIST 모드의 파티션 값(여러 개 지정 가능). 타입: VARCHAR |

## 반환 값 {#return-value}

생성된 파티션 이름을 나타내는 VARCHAR 타입을 반환합니다.

특수한 경우:
- RANGE 모드: 파티션 이름 형식은 `pYYYYMMDDHHMMSS`이며, 단위에 따라 해당 정밀도로 잘립니다
- LIST 모드: 파티션 이름 형식은 `p<value><length>`이며, 여러 값은 길이로 구분됩니다
- 매개변수가 유효하지 않으면 오류를 반환합니다

## 예제 {#examples}

1. 기본 사용법: 일 단위 RANGE
```sql
SELECT auto_partition_name('range', 'day', '2022-12-12 19:20:30');
```
```text
+------------------------------------------------------------+
| auto_partition_name('range', 'day', '2022-12-12 19:20:30') |
+------------------------------------------------------------+
| p20221212000000                                            |
+------------------------------------------------------------+
```

2. 월 단위 RANGE
```sql
SELECT auto_partition_name('range', 'month', '2022-12-12 19:20:30');
```
```text
+--------------------------------------------------------------+
| auto_partition_name('range', 'month', '2022-12-12 19:20:30') |
+--------------------------------------------------------------+
| p20221201000000                                              |
+--------------------------------------------------------------+
```

3. LIST 단일 값
```sql
SELECT auto_partition_name('list', 'helloworld');
```
```text
+-------------------------------------------+
| auto_partition_name('list', 'helloworld') |
+-------------------------------------------+
| phelloworld10                             |
+-------------------------------------------+
```

4. LIST 여러 값
```sql
SELECT auto_partition_name('list', 'hello', 'world');
```
```text
+-----------------------------------------------+
| auto_partition_name('list', 'hello', 'world') |
+-----------------------------------------------+
| phello5world5                                 |
+-----------------------------------------------+
```

5. UTF-8 특수 문자 지원: LIST 모드
```sql
SELECT auto_partition_name('list', 'ṭṛì', 'ḍḍumai');
```
```text
+-------------------------------------------------------+
| auto_partition_name('list', 'ṭṛì', 'ḍḍumai')          |
+-------------------------------------------------------+
| p1e6d1e5bec31e0d1e0dumai6                             |
+-------------------------------------------------------+
```

6. 유효하지 않은 단위 매개변수
```sql
SELECT auto_partition_name('range', 'years', '2022-12-12');
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = range auto_partition_name must accept year|month|day|hour|minute|second for 2nd argument
```

### 키워드 {#keywords}

    AUTO_PARTITION_NAME,AUTO,PARTITION,NAME
