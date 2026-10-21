---
{
    "title": "SHOW STREAM LOAD",
    "language": "ko",
    "description": "이 문은 지정된 Stream Load 작업의 실행 내역을 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 지정된 Stream Load 작업의 실행 내역을 표시하는 데 사용됩니다.

문법:

```sql
SHOW STREAM LOAD
[FROM db_name]
[
  WHERE
  [LABEL [ = "your_label" | LIKE "label_matcher"]]
  [STATUS = ["SUCCESS"|"FAIL"]]
]
[ORDER BY...]
[LIMIT limit][OFFSET offset];
```

참고 사항:

1. 기본적으로 BE는 Stream Load 기록을 저장하지 않습니다. 기록을 조회하려면 BE에서 기록 기능을 활성화해야 하며, 설정 매개변수는 `enable_stream_load_record=true`입니다. 자세한 내용은 [BE 설정 항목](../../../../admin-manual/config/be-config)을 참조하세요.
2. db_name을 지정하지 않으면 현재 기본 데이터베이스를 사용합니다.
3. LABEL LIKE를 사용하면 Stream Load 작업의 label에 label_matcher가 포함된 작업을 조회합니다.
4. LABEL =를 사용하면 지정된 label과 정확히 일치하는 작업을 조회합니다.
5. STATUS를 지정하면 STREAM LOAD 상태를 기준으로 작업을 조회합니다.
6. ORDER BY를 사용하여 원하는 열 조합을 기준으로 정렬할 수 있습니다.
7. LIMIT를 지정하면 조건에 일치하는 레코드를 limit개까지 표시합니다. 지정하지 않으면 모두 표시합니다.
8. OFFSET을 지정하면 쿼리 결과를 오프셋 offset부터 표시합니다. 기본 오프셋은 0입니다.

## 예제 {#example}

1. 기본 데이터베이스의 모든 Stream Load 작업을 표시합니다.

   ```sql
     SHOW STREAM LOAD;
   ```

2. 지정된 데이터베이스에서 label에 문자열 "2014_01_02"가 포함된 Stream Load 작업 중 가장 오래된 10개를 표시합니다.

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
   ```

3. 지정된 데이터베이스에서 label이 "load_example_db_20140102"인 Stream Load 작업을 표시합니다.

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE LABEL = "load_example_db_20140102";
   ```

4. 지정된 데이터베이스에서 상태가 "success"인 Stream Load 작업을 표시하고 StartTime을 기준으로 내림차순으로 정렬합니다.

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE STATUS = "success" ORDER BY StartTime DESC;
   ```

5. 지정된 데이터베이스의 데이터 적재 작업을 StartTime 기준 내림차순으로 정렬하고, 오프셋 5부터 쿼리 결과 10개를 표시합니다.

   ```sql
   SHOW STREAM LOAD FROM example_db ORDER BY StartTime DESC limit 5,10;
   SHOW STREAM LOAD FROM example_db ORDER BY StartTime DESC limit 10 offset 5;
   ```

## 키워드 {#keywords}

SHOW, STREAM, LOAD
