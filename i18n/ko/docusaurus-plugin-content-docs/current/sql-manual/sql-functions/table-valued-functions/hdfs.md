---
{
    "title": "HDFS | 테이블 반환 함수",
    "language": "ko",
    "description": "HDFS 테이블 반환 함수를 사용하여 HDFS의 파일을 관계형 테이블로 읽습니다.",
    "sidebar_label": "HDFS"
}
---

<a id="local"></a>

# HDFS {#hdfs}

## 설명 {#description}

HDFS 테이블 반환 함수(TVF)는 HDFS의 파일을 관계형 테이블로 읽습니다. `csv`, `csv_with_names`, `csv_with_names_and_types`, `json`, `parquet`, `orc`, `avro` 형식을 지원합니다.

## 구문 {#syntax}

```sql
HDFS(
    "uri" = "<uri>",
    "fs.defaultFS" = "<fs_defaultFS>",
    "hadoop.username" = "<hadoop_username>",
    "format" = "<format>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## 매개변수 {#parameters}

### 필수 매개변수 {#required-parameters}

| 매개변수 | 설명 |
| --- | --- |
| `uri` | 읽을 파일의 HDFS URI입니다. 경로가 존재하지 않거나 파일이 비어 있으면 TVF는 빈 결과를 반환합니다. |
| `fs.defaultFS` | 기본 HDFS 파일 시스템 URI입니다. |
| `hadoop.username` | HDFS 사용자 이름입니다. 비어 있지 않은 문자열을 지정하세요. |
| `format` | 파일 형식: `csv`, `csv_with_names`, `csv_with_names_and_types`, `json`, `parquet`, `orc`, `avro`. |

### 선택 매개변수 {#optional-parameters}

다음 키를 `<optional_property_key>`에 사용하고 각 키에 해당하는 값을 `<optional_property_value>`에 사용합니다.

| 매개변수 | 설명 | 참고 |
| --- | --- | --- |
| `hadoop.security.authentication` | HDFS 인증 유형입니다. | |
| `hadoop.kerberos.principal` | Kerberos principal입니다. | |
| `hadoop.kerberos.keytab` | Kerberos keytab 파일입니다. | |
| `dfs.client.read.shortcircuit` | HDFS short-circuit 읽기를 활성화합니다. | |
| `dfs.domain.socket.path` | 도메인 소켓 경로입니다. | |
| `dfs.nameservices` | HA 모드에서 사용하는 nameservice입니다. | |
| `dfs.ha.namenodes.<nameservice>` | HA 모드에서 지정한 nameservice의 NameNode ID입니다. | |
| `dfs.namenode.rpc-address.<nameservice>.<namenode>` | 지정한 NameNode의 RPC 주소입니다. | |
| `dfs.client.failover.proxy.provider.<nameservice>` | nameservice의 장애 조치 프록시 제공자 클래스입니다. | |
| `column_separator` | 열 구분자이며 기본값은 `\t`입니다. | |
| `line_delimiter` | 줄 구분자이며 기본값은 `\n`입니다. | |
| `compress_type` | 압축 형식: `UNKNOWN`, `PLAIN`, `GZ`, `LZO`, `BZ2`, `LZ4FRAME`, `DEFLATE`, `SNAPPYBLOCK`. 기본값은 `UNKNOWN`이며, URI 접미사에서 압축 형식을 추론합니다. | |
| `read_json_by_line` | JSON을 줄 단위로 읽으며 기본값은 `true`입니다. | [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `strip_outer_array` | JSON의 바깥쪽 배열을 제거하며 기본값은 `false`입니다. | [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `json_root` | JSON 루트 경로이며 기본값은 비어 있습니다. | [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `json_paths` | JSON 필드 경로이며 기본값은 비어 있습니다. | [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `num_as_string` | JSON 숫자를 문자열로 읽으며 기본값은 `false`입니다. | [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `fuzzy_parse` | 퍼지 JSON 파싱을 활성화하며 기본값은 `false`입니다. | [JSON 데이터 적재](../../../data-operate/import/file-format/json) |
| `trim_double_quotes` | CSV에 사용하는 불리언 값이며 기본값은 `false`입니다. 활성화하면 각 필드를 감싸는 큰따옴표를 제거합니다. | |
| `skip_lines` | CSV에 사용하는 정수 값이며 기본값은 `0`입니다. 파일 시작 부분의 줄을 건너뜁니다. `csv_with_names`와 `csv_with_names_and_types`에서는 무시됩니다. | |
| `path_partition_keys` | 경로에 인코딩된 파티션 열 이름으로, 쉼표로 구분합니다. `/path/to/city=beijing/date=2023-07-09`의 경우 `city,date`를 사용하여 해당 값을 추출합니다. | |
| `resource` | HDFS에 액세스하는 데 사용하는 기존 HDFS Resource입니다. [CREATE RESOURCE](../../sql-statements/cluster-management/compute-management/CREATE-RESOURCE)를 참조하세요. | 2.1.4부터 |
| `enable_mapping_varbinary` | dev 버전에서는 호환성을 위해서만 허용되며 무시됩니다. 외부 바이너리 데이터는 항상 `VARBINARY`에 매핑됩니다. Doris 4.1.5에서는 이 TVF 옵션을 계속 설정할 수 있으며 기본값은 `false`입니다. | 4.0.3부터 |
| `enable_mapping_timestamp_tz` | 4.1.5부터는 호환성을 위해서만 허용되며 값은 무시됩니다. Parquet Timestamp 중 `isAdjustedToUTC=true`인 경우와 ORC `TIMESTAMP_INSTANT`는 항상 `TIMESTAMPTZ`에 매핑되며, 이 옵션이 `false`인 경우에도 마찬가지입니다. | 4.0.3부터 |
| `hive.parquet.time-zone` | 선택적 문자열이며 기본값은 빈 문자열입니다. Parquet INT96을 기록할 때 사용한 시간대를 지정합니다. IANA 시간대 또는 `-12:00`부터 `+14:00`까지의 UTC 오프셋을 사용하며, `CST`와 `PRC` 같은 짧은 별칭은 허용되지 않습니다. [Parquet](../../../lakehouse/file-formats/parquet.md#timestamp-and-date-compatibility)를 참조하세요. | 4.1.5부터 |

### 액세스 제어 요구 사항 {#access-control-requirements}

`resource` 매개변수를 사용할 때 쿼리를 실행하는 사용자에게는 해당 Resource에 대한 `USAGE` 권한이 필요합니다. Doris에는 HDFS에 대한 네트워크 액세스와 해당 파일에 대한 유효한 HDFS 또는 Kerberos 인증 정보도 필요합니다.

## 반환 값 {#return-value}

파일에서 열 이름과 유형을 추론한 테이블을 반환합니다. NULL 필드는 SQL NULL로 반환됩니다. 존재하지 않는 경로나 빈 파일은 빈 결과를 반환합니다. 잘못된 매개변수, 액세스할 수 없는 스토리지 또는 형식이 잘못된 파일로 인해 분석이나 실행이 실패할 수 있습니다.

## 예제 {#examples}

다음 예제에서는 HDFS 파일 `student.csv`에 아래 내용이 들어 있다고 가정합니다.

```text
1,alice,18
2,bob,20
3,jack,24
4,jackson,19
5,liming,18
```

### CSV 파일 읽기 {#read-a-csv-file}

```sql
SELECT * FROM HDFS(
    "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8424",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ","
);
```

```text
+------+---------+------+
| c1   | c2      | c3   |
+------+---------+------+
| 1    | alice   | 18   |
| 2    | bob     | 20   |
| 3    | jack    | 24   |
| 4    | jackson | 19   |
| 5    | liming  | 18   |
+------+---------+------+
```

### HA HDFS에서 CSV 파일 읽기 {#read-a-csv-file-from-ha-hdfs}

HA 클러스터의 nameservice와 두 NameNode 주소를 설정합니다. URI와 `fs.defaultFS`에는 논리 nameservice를 사용합니다.

```sql
SELECT * FROM HDFS(
    "uri" = "hdfs://my_hdfs/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://my_hdfs",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ",",
    "dfs.nameservices" = "my_hdfs",
    "dfs.ha.namenodes.my_hdfs" = "nn1,nn2",
    "dfs.namenode.rpc-address.my_hdfs.nn1" = "namenode01:8020",
    "dfs.namenode.rpc-address.my_hdfs.nn2" = "namenode02:8020",
    "dfs.client.failover.proxy.provider.my_hdfs" = "org.apache.hadoop.hdfs.server.namenode.ha.ConfiguredFailoverProxyProvider"
);
```

```text
+------+---------+------+
| c1   | c2      | c3   |
+------+---------+------+
| 1    | alice   | 18   |
| 2    | bob     | 20   |
| 3    | jack    | 24   |
| 4    | jackson | 19   |
| 5    | liming  | 18   |
+------+---------+------+
```

### 추론된 스키마 확인 {#inspect-the-inferred-schema}

```sql
DESC FUNCTION HDFS(
    "uri" = "hdfs://127.0.0.1:8424/user/doris/csv_format_test/student.csv",
    "fs.defaultFS" = "hdfs://127.0.0.1:8424",
    "hadoop.username" = "doris",
    "format" = "csv",
    "column_separator" = ","
);
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

## 사용 시 참고 사항 {#usage-notes}

그 밖의 일반적인 파일 옵션은 [S3 TVF](./s3.md)를 참조하세요. HDFS 전용 인증 및 HA 설정은 [HDFS 스토리지](../../../lakehouse/storages/hdfs.md)에 설명되어 있습니다.
