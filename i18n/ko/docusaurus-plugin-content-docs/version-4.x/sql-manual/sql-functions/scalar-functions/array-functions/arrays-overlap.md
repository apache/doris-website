---
{
    "title": "ARRAYS_OVERLAP",
    "language": "ko",
    "description": "ARRAYSOVERLAP은 두 배열에 공통 원소가 하나 이상 있는지 확인하는 데 사용됩니다. 공통 원소가 있으면 true를 반환하고, 그렇지 않으면 false를 반환합니다."
}
---

## 함수 {#function}

`ARRAYS_OVERLAP`은 두 배열에 공통 원소가 하나 이상 있는지 확인하는 데 사용됩니다. 공통 원소가 있으면 `true`를 반환하고, 그렇지 않으면 `false`를 반환합니다.

## 구문 {#syntax}

```SQL
ARRAYS_OVERLAP(arr1, arr2)
```

## 매개변수 {#parameters}

- `arr1`: 첫 번째 배열이며, 타입은 `ARRAY<T>`입니다.

- `arr2`: 두 번째 배열이며, 타입은 `ARRAY<T>`입니다.

    - 두 배열의 원소 타입 `T`는 같거나 서로 암시적으로 변환할 수 있어야 합니다.
    - 원소 타입 `T`는 숫자, 문자열, 날짜/시간 또는 IP 타입일 수 있습니다.

## 반환 값 {#return-value}

- `BOOLEAN` 타입을 반환합니다:

    - 두 배열에 교집합이 있으면 `true`를 반환합니다.
    - 교집합이 없으면 `false`를 반환합니다.

## 사용 시 참고 사항 {#usage-notes}

1. **원소의 동등성(`=` 연산자)을 기준으로 비교합니다**.
2. **이 함수에서는 `NULL`과 `NULL`을 같은 것으로 간주합니다**(예제 참조).
3. **테이블 생성문에 역색인을 지정하여 실행 속도를 높일 수 있습니다**(예제 참조).
   - 함수를 술어 조건으로 사용하면 역색인이 실행 속도를 높입니다.
   - 함수를 쿼리 결과에 사용하면 역색인이 실행 속도를 높이지 않습니다.
4. 데이터 정제, 태그 매칭, 사용자 행동의 교집합을 구하는 시나리오에서 주로 사용합니다.

## 예제 {#examples}

1. 간단한 예제

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('hello', 'aloha'), ARRAY('hello', 'hi', 'hey'));
    +----------------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('hello', 'aloha'), ARRAY('hello', 'hi', 'hey')) |
    +----------------------------------------------------------------------+
    |                                                                    1 |
    +----------------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY('Pinnacle', 'aloha'), ARRAY('hi', 'hey'));
    +----------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('Pinnacle', 'aloha'), ARRAY('hi', 'hey')) |
    +----------------------------------------------------------------+
    |                                                              0 |
    +----------------------------------------------------------------+
    ```

2. 잘못된 매개변수 타입: 지원하지 않는 타입을 전달하면 `INVALID_ARGUMENT`를 반환합니다

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY(ARRAY('hello', 'aloha'), ARRAY('hi', 'hey')), ARRAY(ARRAY('hello', 'hi', 'hey'), ARRAY('aloha', 'hi')));
    ERROR 1105 (HY000): errCode = 2, detailMessage = arrays_overlap does not support types: ARRAY<ARRAY<TEXT>>
    ```

3. 입력 `ARRAY`가 `NULL`이면 반환 값은 `NULL`입니다

    ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), NULL);
    +-----------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), NULL) |
    +-----------------------------------------------+
    |                                          NULL |
    +-----------------------------------------------+

    SELECT ARRAYS_OVERLAP(NULL, NULL);
    +----------------------------+
    | ARRAYS_OVERLAP(NULL, NULL) |
    +----------------------------+
    |                        NULL |
    +----------------------------+
    ```

4. 입력 `ARRAY`에 `NULL`이 포함되어 있으면 `NULL`과 `NULL`을 같은 것으로 간주합니다
   
   ```SQL
    SELECT ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), ARRAY('HELLO', NULL));
    +---------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('HELLO', 'ALOHA'), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------------------+
    |                                                             1 |
    +---------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY('PICKLE', 'ALOHA'), ARRAY('HELLO', NULL));
    +----------------------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY('PICKLE', 'ALOHA'), ARRAY('HELLO', NULL)) |
    +----------------------------------------------------------------+
    |                                                             0  |
    +----------------------------------------------------------------+

    SELECT ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL));
    +---------------------------------------------------+
    | ARRAYS_OVERLAP(ARRAY(NULL), ARRAY('HELLO', NULL)) |
    +---------------------------------------------------+
    |                                                 1 |
    +---------------------------------------------------+
    ```

5. 역색인을 사용하여 쿼리 속도 높이기
   
    ```SQL
    -- Create table with inverted index
    CREATE TABLE IF NOT EXISTS arrays_overlap_table (
        id INT,
        array_column ARRAY<STRING>,
        INDEX idx_array_column (array_column) USING INVERTED -- only non-tokenized inverted indexes are allowed
    ) ENGINE=OLAP
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    );

    -- Insert two rows
    INSERT INTO arrays_overlap_table (id, array_column) VALUES (1, ARRAY('HELLO', 'ALOHA')), (2, ARRAY('NO', 'WORLD'));
    ```

 - 함수를 술어 조건으로 사용하면 역색인이 실행 속도를 높입니다
  
    ```SQL
    SELECT * from arrays_overlap_table WHERE ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')); 
    +------+--------------------+
    | id   | array_column       |
    +------+--------------------+
    |    1 | ["HELLO", "ALOHA"] |
    +------+--------------------+

- 함수를 쿼리 결과에 사용하면 역색인이 실행 속도를 높이지 않습니다
  
    ```SQL
    SELECT ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) FROM arrays_overlap_table;
    +--------------------------------------------------------+
    | ARRAYS_OVERLAP(array_column, ARRAY('HELLO', 'PICKLE')) |
    +--------------------------------------------------------+
    |                                                      1 |
    |                                                      0 |
    +--------------------------------------------------------+
    ```
