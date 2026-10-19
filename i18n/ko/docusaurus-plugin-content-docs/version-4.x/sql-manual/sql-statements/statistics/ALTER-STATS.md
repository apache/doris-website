---
{
    "title": "ALTER STATS",
    "language": "ko",
    "description": "지정된 테이블에서 지정된 컬럼의 통계를 수동으로 수정합니다. 자세한 내용은 \"통계\" 장을 참조하세요."
}
---

## 설명 {#description}

지정된 테이블에서 지정된 컬럼의 통계를 수동으로 수정합니다. 자세한 내용은 "통계" 장을 참조하세요.

## 구문 {#syntax}

```sql
ALTER TABLE <table_name>
  [ INDEX <index_name> ]
  MODIFY COLUMN <column_name>
  SET STATS (<column_stats>)
```

여기서 column_stats는 다음과 같습니다.

```sql
column_stats
  : -- column stats value
  ("key1" = "value1", "key2" = "value2" [...])
```
# 필수 매개변수 {#required-parameters}

**<table_name>**

> 테이블의 식별자(즉, 이름)를 지정합니다.

**<column_name>**

> 컬럼의 식별자(즉, 이름)를 지정합니다. <index_name>을 지정하지 않으면 기본 테이블의 컬럼 이름을 나타냅니다.

**<column_stats>**

> 설정할 통계 값으로, key = value 형식으로 지정합니다. key와 value는 모두 따옴표로 묶어야 하며, 키-값 쌍은 쉼표로 구분합니다. 설정할 수 있는 통계는 다음과 같습니다.

> row_count, 전체 행 수

> ndv, 컬럼의 카디널리티

> num_nulls, 컬럼의 NULL 값 수

> data_size, 컬럼의 전체 크기

> min_value, 컬럼의 최솟값

> max_value, 컬럼의 최댓값

> 이 중 row_count는 반드시 지정해야 하며, 나머지 속성은 선택 사항입니다. 설정하지 않은 통계 속성은 해당 컬럼에서 빈 값으로 남습니다.

# 선택적 매개변수 {#optional-parameters}

**<index_name>**

> 동기식 구체화된 뷰의 식별자(즉, 이름)입니다. 자세한 내용은 "동기식 구체화된 뷰" 장을 참조하세요. 테이블에 속한 구체화된 뷰의 수는 0개 이상일 수 있습니다. 구체화된 뷰에 있는 컬럼의 통계를 설정하려면 <index_name>으로 구체화된 뷰의 이름을 지정해야 합니다. 지정하지 않으면 기본 테이블에 있는 컬럼의 속성을 설정합니다.

# 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한       | 객체   | 비고  |
| :--------- | :----- | :---- |
| ALTER_PRIV | 테이블 |       |

# 사용 시 참고 사항 {#usage-notes}

사용자가 테이블에 통계를 수동으로 입력하면, 수동으로 입력한 통계를 덮어쓰지 않도록 해당 테이블은 더 이상 통계 자동 수집 대상에 포함되지 않습니다. 자세한 내용은 "통계 자동 수집" 장을 참조하세요. 입력한 통계를 더 이상 사용하지 않는 경우 drop stats 문으로 이미 입력된 정보를 삭제하면 테이블의 자동 수집을 다시 활성화할 수 있습니다.

# 예제 {#examples}

- part 테이블의 p_partkey 컬럼에 통계를 입력합니다(index_name을 지정하지 않았으므로 기본 테이블의 컬럼입니다).

  ```sql
  alter 
      table part
      modify column p_partkey 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```

- part 테이블의 index1 구체화된 뷰에 있는 col1 컬럼에 통계를 입력합니다(index_name을 지정했으므로 구체화된 뷰의 컬럼입니다).

  ```sql
  alter 
      table part index index1
      modify column col1 
      set stats ('row_count'='2.0E7', 'ndv'='2.0252576E7', 'num_nulls'='0.0', 'data_size'='8.0E7', 'min_value'='1', 'max_value'='20000000');
  ```
