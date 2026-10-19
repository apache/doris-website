---
{
    "title": "LOCAL | 테이블 반환 함수",
    "language": "ko",
    "description": "로컬 테이블 반환 함수(tvf)를 사용하면 관계형 테이블에 접근하듯 BE 노드에 있는 로컬 파일의 내용을 읽고 접근할 수 있습니다.",
    "sidebar_label": "LOCAL"
}
---

# LOCAL {#local}

## 설명 {#description}

로컬 테이블 반환 함수(tvf)를 사용하면 관계형 테이블에 접근하듯 BE 노드에 있는 로컬 파일의 내용을 읽고 접근할 수 있습니다. 현재 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc` 파일 형식을 지원합니다.

## 구문 {#syntax}

```sql
LOCAL(
  "file_path" = "<file_path>", 
  "backend_id" = "<backend_id>",
  "format" = "<format>"
  [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
  );
```

## 필수 매개변수 {#required-parameters}
| 매개변수         | 설명                                                                                                                                                                                          | 비고                                           |
|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------|
| `file_path`       | 읽을 파일의 경로로, `user_files_secure_path` 디렉터리를 기준으로 한 상대 경로입니다. `user_files_secure_path` 매개변수는 [BE 구성 항목](../../../admin-manual/config/be-config.md)입니다. <br /> 경로에는 `..`를 포함할 수 없으며, glob 구문을 사용하여 `logs/*.log`와 같은 패턴으로 파일을 찾을 수 있습니다. |                                                   |
| `backend_id`      | 파일이 있는 BE 노드의 ID입니다. `show backends` 명령으로 확인할 수 있습니다.                                                                                                  | 2.1.1 이전 버전에서 Doris는 BE 노드를 지정하여 해당 노드의 로컬 데이터 파일을 읽는 방식만 지원합니다. |
| `format`          | 파일 형식으로, 필수 항목입니다. 지원하는 형식은 `csv/csv_with_names/csv_with_names_and_types/json/parquet/orc`입니다.                                                                             |                                                   |

## 선택적 매개변수 {#optional-parameters}
| 매개변수              | 설명                                                                                                                                                                       | 비고                                                                |
|------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------------------------------------------------------------------|
| `shared_storage`        | 기본값은 false입니다. true이면 지정된 파일이 공유 스토리지(예: NAS)에 있습니다. 공유 스토리지는 POSIX 파일 인터페이스를 지원해야 하며 모든 BE 노드에 마운트되어 있어야 합니다. <br /> `shared_storage`가 true이면 `backend_id`를 생략할 수 있습니다. Doris는 모든 BE 노드를 사용하여 데이터에 접근할 수 있습니다. `backend_id`를 설정하면 지정된 BE 노드에서만 데이터에 접근합니다. | 2.1.2 버전부터 지원                                      |
| `column_separator`      | 열 구분자로, 선택 사항이며 기본값은 `\t`입니다.                                                                                                                                 |                                                                       |
| `line_delimiter`        | 줄 구분자로, 선택 사항이며 기본값은 `\n`입니다.                                                                                                                                   |                                                                       |
| `compress_type`         | 압축 유형으로, 선택 사항입니다. 지원하는 유형은 `UNKNOWN/PLAIN/GZ/LZO/BZ2/LZ4FRAME/DEFLATE/SNAPPYBLOCK`입니다. 기본값은 `UNKNOWN`이며, `uri` 접미사에서 유형을 자동으로 추론합니다. |                                                                       |
| `read_json_by_line`     | JSON 형식 데이터를 적재할 때 사용하는 선택적 매개변수로, 기본값은 `true`입니다.                                                                                                                            | 참조: [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `strip_outer_array`     | JSON 형식 데이터를 적재할 때 사용하는 선택적 매개변수로, 기본값은 `false`입니다.                                                                                                                           | 참조: [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `json_root`             | JSON 형식 데이터를 적재할 때 사용하는 선택적 매개변수로, 기본값은 비어 있습니다.                                                                                                                               | 참조: [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `json_paths`            | JSON 형식 데이터를 적재할 때 사용하는 선택적 매개변수로, 기본값은 비어 있습니다.                                                                                                                               | 참조: [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `num_as_string`         | JSON 형식 데이터를 적재할 때 사용하는 선택적 매개변수로, 기본값은 `false`입니다.                                                                                                                            | 참조: [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `fuzzy_parse`           | JSON 형식 데이터를 적재할 때 사용하는 선택적 매개변수로, 기본값은 `false`입니다.                                                                                                                            | 참조: [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `trim_double_quotes`    | CSV 형식 데이터를 적재할 때 사용하는 선택적 매개변수로, 기본값은 `false`입니다. true이면 CSV 파일의 각 필드를 감싸는 가장 바깥쪽 큰따옴표를 제거합니다.                                          | CSV 형식용                                                           |
| `skip_lines`            | CSV 형식 데이터를 적재할 때 사용하는 선택적 매개변수로, 기본값은 `0`이며 CSV 파일의 처음 몇 줄을 건너뛸지 지정합니다. 형식이 `csv_with_names` 또는 `csv_with_names_and_types`이면 이 매개변수는 무시됩니다. | CSV 형식용                                                           |
| `path_partition_keys`   | 선택 사항으로, 파일 경로에 포함된 파티션 열 이름을 지정합니다. 예를 들어 경로가 `/path/to/city=beijing/date="2023-07-09"`이면 `path_partition_keys="city,date"`로 설정합니다. 데이터 적재 시 경로에서 해당 열 이름과 값을 자동으로 읽습니다. |                                                                       |
| `enable_mapping_varbinary` | dev 버전에서는 호환성을 위해서만 허용되며 무시됩니다. 외부 바이너리 데이터는 항상 `VARBINARY`에 매핑됩니다. Doris 4.1.5에서는 이 TVF 옵션을 설정할 수 있으며 기본값은 `false`입니다. | 4.0.3부터 지원 |
| `enable_mapping_timestamp_tz` | 4.1.5부터는 호환성을 위해서만 허용되며, 값은 무시됩니다. `isAdjustedToUTC=true`인 Parquet Timestamp와 ORC `TIMESTAMP_INSTANT`는 항상 `TIMESTAMPTZ`에 매핑되며, 이 옵션이 `false`여도 동일합니다. | 4.0.3부터 지원 |
| `hive.parquet.time-zone` | 선택적 문자열로, 기본값은 빈 문자열입니다. 4.1.5부터 지원합니다. Parquet INT96 기록에 사용된 시간대를 지정합니다. IANA 시간대 또는 -12:00부터 +14:00까지의 오프셋을 사용할 수 있으며, CST 및 PRC와 같은 짧은 별칭은 허용되지 않습니다. [Parquet](../../../lakehouse/file-formats/parquet.md#timestamp-and-date-compatibility)을 참조하세요. | 4.1.5부터 지원 |

## 접근 제어 요구 사항 {#access-control-requirements}
| 권한  | 객체 | 비고 |
| :--------- |:-------|:------|
| ADMIN_PRIV | global |       |


## 사용 시 참고 사항 {#usage-notes}

- 로컬 tvf의 자세한 사용법은 [S3](./s3.md) tvf를 참조하세요. 두 함수는 스토리지 시스템에 접근하는 방식만 다릅니다.

- 로컬 tvf를 통해 NAS 데이터에 접근하기

  NAS 공유 스토리지는 여러 노드에 동시에 마운트할 수 있습니다. 각 노드는 공유 스토리지의 파일에 로컬 파일처럼 접근할 수 있습니다. 따라서 NAS를 로컬 파일 시스템으로 간주하고 로컬 tvf를 통해 접근할 수 있습니다.

  `"shared_storage" = "true"`로 설정하면 Doris는 지정된 파일에 모든 BE 노드에서 접근할 수 있다고 간주합니다. 와일드카드로 파일 집합을 지정하면 Doris는 파일 접근 요청을 여러 BE 노드에 분산합니다. 이를 통해 여러 노드에서 분산 파일 스캔을 수행하여 쿼리 성능을 높일 수 있습니다.


## 예제 {#examples}

지정된 BE의 로그 파일 분석:
```sql
select * from local(
        "file_path" = "log/be.out",
        "backend_id" = "10006",
        "format" = "csv")
       where c1 like "%start_time%" limit 10;
```
```text
+--------------------------------------------------------+
| c1                                                     |
+--------------------------------------------------------+
| start time: 2023 年 08 月 07 日 星期一 23:20:32 CST       |
| start time: 2023 年 08 月 07 日 星期一 23:32:10 CST       |
| start time: 2023 年 08 月 08 日 星期二 00:20:50 CST       |
| start time: 2023 年 08 月 08 日 星期二 00:29:15 CST       |
+--------------------------------------------------------+
```

`${DORIS_HOME}/student.csv` 경로에 있는 csv 형식 파일을 읽고 접근합니다:
```sql
select * from local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
```
```text
+------+---------+--------+
| c1   | c2      | c3     |
+------+---------+--------+
| 1    | alice   | 18     |
| 2    | bob     | 20     |
| 3    | jack    | 24     |
| 4    | jackson | 19     |
| 5    | liming  | d18    |
+------+---------+--------+
```--+---------+--------+
```

NAS에 있는 파일 쿼리:
```sql
select * from local(
        "file_path" = "/mnt/doris/prefix_*.txt",
        "format" = "csv",
        "column_separator" =",",
        "shared_storage" = "true");
```
```text
+------+------+------+
| c1   | c2   | c3   |
+------+------+------+
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
| 1    | 2    | 3    |
+------+------+------+
```

`desc function`과 함께 사용할 수 있습니다:
```sql
desc function local(
      "file_path" = "student.csv", 
      "backend_id" = "10003", 
      "format" = "csv");
```
```text
+-------+------+------+-------+---------+-------+
| Field | Type | Null | Key   | Default | Extra |
+-------+------+------+-------+---------+-------+
| c1    | TEXT | Yes  | false | NULL    | NONE  |
| c2    | TEXT | Yes  | false | NULL    | NONE  |
| c3    | TEXT | Yes  | false | NULL    | NONE  |
+-------+------+------+-------+---------+-------+
```
