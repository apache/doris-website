---
{
    "title": "SHOW EXPORT",
    "language": "ko",
    "description": "이 문은 지정된 내보내기 작업의 실행 상태를 표시하는 데 사용됩니다."
}
---

## 설명 {#description}

이 문은 지정된 내보내기 작업의 실행 상태를 표시하는 데 사용됩니다.

## 구문 {#syntax}

```sql
SHOW EXPORT
[ FROM <db_name> ]
  [
    WHERE
      [ ID = <job_id> ]
      [ STATE = { "PENDING" | "EXPORTING" | "FINISHED" | "CANCELLED" } ]
      [ LABEL = <label> ]
   ]
[ ORDER BY <column_name> [ ASC | DESC ] [, column_name [ ASC | DESC ] ... ] ]
[ LIMIT <limit> ];
```

## 선택적 매개변수 {#optional-parameters}

**1. `<db_name>`**: 선택적 매개변수입니다. 지정하지 않으면 현재 기본 데이터베이스를 사용합니다.

**2. `<job_id>`**: 선택적 매개변수입니다. 표시할 내보내기 작업의 ID를 지정합니다.

**3. `<label>`**: 선택적 매개변수입니다. 표시할 내보내기 작업의 레이블을 지정합니다.

**4. `<column_name>`**: 선택적 매개변수입니다. 정렬 기준이 되는 열 이름을 지정합니다.

**5. `<limit>`**: 선택적 매개변수입니다. 지정하면 조건에 일치하는 레코드를 지정한 개수만큼만 표시하고, 지정하지 않으면 모든 레코드를 표시합니다.


## 반환 값 {#return-value}

| 열          | 데이터 유형 | 설명 |
|-------------|-------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| JobId       | string      | 작업의 고유 ID |
| Label       | string      | 내보내기 작업의 레이블입니다. 지정하지 않으면 시스템이 기본적으로 생성합니다. |
| State       | string      | 작업 상태: <br> - `PENDING`: 작업이 스케줄링을 기다리는 중 <br> - `EXPORTING`: 데이터를 내보내는 중 <br> - `FINISHED`: 작업 성공 <br> - `CANCELLED`: 작업 실패 |
| Progress    | string      | 작업 진행률입니다. 진행률은 쿼리 계획 단위로 측정됩니다. 예를 들어 스레드가 10개이고 그중 3개가 완료되었다면 진행률은 30%입니다. |
| TaskInfo    | json        | JSON 형식으로 표시되는 작업 정보: <br> - db: 데이터베이스 이름 <br> - tbl: 테이블 이름 <br> - partitions: 내보낼 파티션을 지정하며, `empty` 목록은 모든 파티션을 의미함 <br> - column_separator: 내보내는 파일의 열 구분자 <br> - line_delimiter: 내보내는 파일의 줄 구분자 <br> - tablet num: 관련 tablet의 총 개수 <br> - broker: 사용하는 broker의 이름 <br> - coord num: 쿼리 계획 수 <br> - max_file_size: 내보내는 파일의 최대 크기 <br> - delete_existing_files: 내보내기 디렉터리에 있는 기존 파일과 디렉터리를 삭제할지 여부 <br> - columns: 내보낼 열을 지정하며, 빈 값은 모든 열을 내보냄을 의미함 <br> - format: 내보내는 파일의 형식 |
| Path        | string      | 원격 스토리지의 내보내기 경로 |
| CreateTime  | string      | 작업 생성 시간 |
| StartTime   | string      | 작업 시작 시간 |
| FinishTime  | string      | 작업 종료 시간 |
| Timeout     | int         | 작업 제한 시간(초 단위)입니다. 시간은 CreateTime부터 계산됩니다. |
| ErrorMsg    | string      | 작업 중 오류가 발생하면 여기에 오류 원인이 표시됩니다. |
| OutfileInfo | string      | 내보내기 작업이 성공하면 여기에 `SELECT INTO OUTFILE`의 구체적인 결과 정보가 표시됩니다. |

## 접근 제어 요구 사항 {#access-control-requirements}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한을 보유해야 합니다.

| 권한         | 객체                      | 설명                                           |
|:-------------|:--------------------------|:-----------------------------------------------|
| SELECT_PRIV  | 데이터베이스 (데이터베이스) | 데이터베이스와 테이블에 대한 읽기 권한이 필요합니다. |


## 예제 {#examples}

- 기본 데이터베이스의 모든 내보내기 작업 표시

    ```sql
    SHOW EXPORT;
    ```

- 지정된 데이터베이스의 내보내기 작업을 StartTime 기준 내림차순으로 표시

    ```sql
     SHOW EXPORT FROM example_db ORDER BY StartTime DESC;
    ```

- 지정된 데이터베이스에서 상태가 "exporting"인 내보내기 작업을 StartTime 기준 내림차순으로 표시

    ```sql
    SHOW EXPORT FROM example_db WHERE STATE = "exporting" ORDER BY StartTime DESC;
    ```

- 지정된 데이터베이스와 job_id에 해당하는 내보내기 작업 표시

    ```sql
      SHOW EXPORT FROM example_db WHERE ID = job_id;
    ```

- 지정된 데이터베이스와 레이블에 해당하는 내보내기 작업 표시

    ```sql
     SHOW EXPORT FROM example_db WHERE LABEL = "mylabel";
    ```
