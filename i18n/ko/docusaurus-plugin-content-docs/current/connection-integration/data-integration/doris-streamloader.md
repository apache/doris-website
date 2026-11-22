---
{
    "title": "Doris Streamloader",
    "language": "ko",
    "description": "Doris Streamloader는 Apache Doris에서 공식 제공하는 데이터 적재 클라이언트 도구입니다. 여러 작업의 동시 처리, 여러 파일 적재, 중단된 전송의 재개, 자동 재시도를 지원하며 대용량 데이터의 일괄 적재에 적합합니다."
}
---

[Doris Streamloader](https://github.com/apache/doris-streamloader)는 Apache Doris 데이터베이스에 데이터를 적재하는 전용 클라이언트 도구입니다. `curl`을 직접 사용해 한 번에 하나의 작업으로 데이터를 적재하는 방식과 비교하면, 여러 작업을 동시에 처리할 수 있어 대용량 데이터 적재에 걸리는 시간을 크게 줄여 줍니다.

## 주요 기능 {#core-features}

| 기능 | 설명 |
|---|---|
| 동시 적재 | 여러 작업자가 동시에 Stream Load를 수행합니다. 동시 작업 수는 `workers` 매개변수로 설정합니다 |
| 여러 파일 적재 | 하나의 작업에서 여러 파일과 디렉터리를 적재합니다. 와일드카드 일치를 지원하며 디렉터리 아래의 모든 파일을 재귀적으로 탐색합니다 |
| 중단된 전송 재개 | 적재 중 일부 작업이 실패하면 실패 지점부터 다시 시작할 수 있습니다 |
| 자동 재시도 | 적재가 실패해도 수동으로 재시도할 필요가 없습니다. 도구가 기본 재시도 횟수까지 자동으로 재시도하며, 계속 실패하면 수동 재시도 명령을 출력합니다 |

## 사용 사례 {#use-cases}

- 대용량 데이터(GB~TB 규모)를 Doris에 일괄 적재
- 여러 파일과 여러 디렉터리를 일괄 적재
- 적재 지연 시간에 민감하여 동시 작업으로 처리량을 높여야 하는 경우
- 중단된 전송의 재개와 실패 시 자동 복구가 필요한 안정적인 적재 워크플로

---

## 다운로드 및 설치 {#download-and-installation}

| 리소스 | 주소 |
|---|---|
| 소스 코드 | [https://github.com/apache/doris-streamloader](https://github.com/apache/doris-streamloader) |
| 바이너리 다운로드 | [https://doris.apache.org/download](https://doris.apache.org/download) |

:::note
다운로드한 파일은 실행 가능한 바이너리입니다. 별도의 컴파일이나 설치가 필요하지 않습니다.
:::

---

## 사용법 {#usage}

### 기본 명령 형식 {#basic-command-format}

```shell
doris-streamloader \
    --source_file={FILE_LIST} \
    --url={FE_OR_BE_SERVER_URL}:{PORT} \
    --header={STREAMLOAD_HEADER} \
    --db={TARGET_DATABASE} \
    --table={TARGET_TABLE}
```

### 필수 매개변수 {#required-parameters}

| 매개변수 | 의미 |
|---|---|
| `--source_file` | 적재할 데이터 파일 목록입니다. 단일 파일, 디렉터리, 와일드카드, 쉼표로 구분한 목록을 지원합니다 |
| `--url` | `http://host:port` 형식의 Doris FE 또는 BE 서비스 주소입니다 |
| `--header` | Stream Load의 헤더 매개변수입니다. 여러 매개변수는 `?`로 구분합니다 |
| `--db` | 대상 데이터베이스 이름입니다 |
| `--table` | 대상 테이블 이름입니다 |

### `source_file`에서 지원하는 형식 {#formats-supported-by-source_file}

`--source_file` 매개변수는 다음 다섯 가지 형식을 지원합니다. 상황에 맞게 선택할 수 있습니다.

#### 1. 단일 파일 {#1-a-single-file}

예를 들어 `file.csv` 파일 하나를 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="file.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 2. 단일 디렉터리 {#2-a-single-directory}

예를 들어 `dir` 디렉터리를 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 3. 와일드카드가 포함된 파일 이름(따옴표 필수) {#3-a-file-name-with-wildcards-must-be-quoted}

예를 들어 `file0.csv`, `file1.csv`, `file2.csv`를 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 4. 쉼표로 구분한 파일 이름 목록 {#4-a-comma-separated-list-of-file-names}

예를 들어 `file0.csv`, `file1.csv`, `file2.csv`를 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 5. 쉼표로 구분한 디렉터리 목록 {#5-a-comma-separated-list-of-directories}

예를 들어 `dir1`, `dir2`, `dir3`을 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="dir1,dir2,dir3" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

### 헤더 매개변수 {#header-parameter}

`--header`는 Stream Load의 모든 매개변수를 지원합니다. 여러 매개변수는 `?`로 구분합니다.

예시:

```shell
doris-streamloader --source_file="data.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

---

## 선택적 매개변수 {#optional-parameters}

위의 필수 매개변수 외에도 적재 동작을 세밀하게 제어할 수 있는 선택적 매개변수가 있습니다. 아래 표는 기능별로 정리한 것입니다.

### 인증 및 전송 {#authentication-and-transport}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--u` | 데이터베이스 사용자 이름 | `root` | —— |
| `--p` | 데이터베이스 사용자의 비밀번호 | 빈 문자열 | —— |
| `--compress` | HTTP 전송 중 데이터를 압축할지 여부 | `false` | 기본값을 유지하세요. 압축을 활성화하면 압축과 압축 해제 과정에서 도구와 Doris BE 양쪽의 CPU 부하가 증가합니다. 데이터 소스가 있는 머신의 네트워크 대역폭이 병목일 때만 활성화하세요 |
| `--timeout` | Doris로 보내는 HTTP 요청의 시간 제한(초) | `60*60*10` | 기본값을 유지하세요 |

### 배치 및 동시 작업 {#batch-and-concurrency}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--batch` | 파일을 배치 단위로 읽고 전송할 때의 크기(행 수) | `4096` | 기본값을 유지하세요 |
| `--batch_byte` | 파일을 배치 단위로 읽고 전송할 때의 크기(바이트) | `943718400` (900 MB) | 기본값을 유지하세요 |
| `--workers` | 적재 작업의 동시 실행 수 | `0` | `0`으로 설정하면 자동 모드로 실행되며, 적재할 데이터 크기, 디스크 처리량, Stream Load 적재 속도를 바탕으로 값을 계산합니다. 수동으로 설정할 수도 있습니다. 성능이 높은 클러스터에서는 적절히 늘릴 수 있지만 **가급적 10을 넘기지 마세요**. Memtracker 또는 Exceed 로그에서 적재 중 메모리 사용량이 너무 높은 것으로 확인되면 적절히 낮출 수 있습니다 |
| `--disk_throughput` | 디스크 처리량(MB/s) | `800` | 보통 기본값을 유지하세요. 이 값은 `--workers` 자동 계산에 사용됩니다. 도구가 적절한 `workers` 수를 계산하도록 하려면 실제 디스크 처리량에 맞춰 설정할 수 있습니다 |
| `--streamload_throughput` | 실제 Stream Load 적재 처리량(MB/s) | `100` | 보통 기본값을 유지하세요. 이 값은 `--workers` 자동 계산에 사용됩니다. 기본값은 일일 성능 테스트 환경을 바탕으로 정해졌습니다. 도구가 적절한 `workers` 수를 계산하도록 하려면 실측 처리량에 맞춰 설정할 수 있습니다. 계산식은 `(LoadBytes*1000) / (LoadTimeMs*1024*1024)`입니다 |
| `--max_byte_per_task` | 적재 작업 하나의 데이터 크기 상한입니다. 이 값을 초과하면 데이터를 새 작업으로 분할합니다 | `107374182400` (100 GB) | 적재 버전 수를 줄이려면 큰 값을 권장합니다. 다만 `body exceed max size` 오류가 발생했지만 `streaming_load_max_mb`를 조정하고 싶지 않거나 `-238 TOO MANY SEGMENT` 오류가 발생했다면 일시적으로 낮출 수 있습니다 |

### 데이터 검증 및 로그 {#data-validation-and-logs}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--check_utf8` | 적재할 데이터의 인코딩을 검사할지 여부입니다. `false`이면 검사를 건너뛰고 원본 데이터를 적재하며, `true`이면 UTF-8이 아닌 문자를 `�`로 바꿉니다 | `true` | 기본값을 유지하세요 |
| `--debug` | 디버그 로그를 출력할지 여부 | `false` | 기본값을 유지하세요 |
| `--log_filename` | 로그 저장 위치 | `""` | 기본적으로 로그는 콘솔에 출력됩니다. 파일에 기록하려면 `--log_filename="/var/log"`처럼 경로를 지정하세요 |

### 실패 시 재시도 {#failure-retry}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--auto_retry` | 자동 재시도할 작업자 및 작업 번호의 목록 | 빈 문자열 | 적재가 실패했을 때만 사용하세요. 정상적인 적재 중에는 설정할 필요가 없습니다. 실패하면 구체적인 매개변수 값이 출력되므로 복사해 실행하면 됩니다. 예를 들어 `--auto_retry="1,1,2,1"`은 첫 번째 작업자의 첫 번째 작업과 두 번째 작업자의 첫 번째 작업을 재시도해야 한다는 뜻입니다 |
| `--auto_retry_times` | 자동 재시도 횟수 | `3` | 기본값을 유지하세요. 재시도를 비활성화하려면 `0`으로 설정하세요 |
| `--auto_retry_interval` | 자동 재시도 사이의 간격(초) | `60` | 기본값을 유지하세요. Doris가 중단되어 실패한 경우에는 실제 재시작 소요 시간에 맞춰 설정하세요 |

---

## 결과 {#result}

적재 성공 여부와 관계없이 도구는 작업이 끝나면 최종 결과를 출력합니다.

### 결과 필드 {#result-fields}

| 필드 | 설명 |
|---|---|
| `Status` | 적재 상태입니다. `Success`는 성공, `Failed`는 실패를 뜻합니다 |
| `TotalRows` | 적재할 파일의 전체 행 수 |
| `FailLoadRows` | 적재하려 했으나 적재되지 않은 행 수 |
| `LoadedRows` | Doris에 실제로 적재된 행 수 |
| `FilteredRows` | 적재 중 Doris가 필터링한 행 수 |
| `UnselectedRows` | 적재 중 Doris가 무시한 행 수 |
| `LoadBytes` | 실제로 적재된 바이트 수 |
| `LoadTimeMs` | 실제 적재 소요 시간(밀리초) |
| `LoadFiles` | 실제로 적재된 파일 목록 |

### 성공 예시 {#success-example}

적재에 성공하면 다음과 같이 출력됩니다.

```Go
Load Result: {
        "Status": "Success",
        "TotalRows": 120,
        "FailLoadRows": 0,
        "LoadedRows": 120,
        "FilteredRows": 0,
        "UnselectedRows": 0,
        "LoadBytes": 40632,
        "LoadTimeMs": 971,
        "LoadFiles": [
                "basic.csv",
                "basic_data1.csv",
                "basic_data2.csv",
                "dir1/basic_data.csv",
                "dir1/basic_data.csv.1",
                "dir1/basic_data1.csv"
        ]
}
```

### 실패 예시 {#failure-example}

데이터 일부를 적재하지 못하면 도구가 먼저 재시도 명령을 출력합니다.

```Go
load has some error, and auto retry failed, you can retry by :
./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
```

이 명령을 복사해 실행하면 수동으로 재시도할 수 있습니다. `auto_retry`의 의미는 위의 매개변수 절에 설명되어 있습니다. 이어서 실패 결과가 출력됩니다.

```Go
Load Result: {
      "Status": "Failed",
      "TotalRows": 1,
      "FailLoadRows": 1,
      "LoadedRows": 0,
      "FilteredRows": 0,
      "UnselectedRows": 0,
      "LoadBytes": 0,
      "LoadTimeMs": 104,
      "LoadFiles": [
              "/mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1"
      ]
}
```

---

## 모범 사례 {#best-practices}

### 권장 매개변수 {#recommended-parameters}

1. **필수 매개변수**: 다음 매개변수를 반드시 설정해야 합니다.

    ```text
    --source_file=FILE_LIST
    --url=FE_OR_BE_SERVER_URL_WITH_PORT
    --header=STREAMLOAD_HEADER
    --db=TARGET_DATABASE
    --table=TARGET_TABLE
    ```

    **여러 파일을 적재하려면 `source_file` 방식을 사용하세요.**

2. **`workers`**: 기본값은 `0`이며 자동 모드를 활성화합니다. 이 모드에서 도구는 적재할 데이터 크기, `disk_throughput`, `streamload_throughput`을 바탕으로 값을 계산하며, 일반적으로 1, 2, 4 또는 8이 나옵니다. 수동으로 설정할 수도 있습니다. 성능이 높은 클러스터에서는 늘릴 수 있지만 **10을 넘기지 않는 것이 좋습니다**. **흔히 사용하는 수동 설정값은 `8`입니다**.

3. **`max_byte_per_task`**: 값을 높이면 적재 버전 수를 줄일 수 있습니다. 다만 `body exceed max size` 오류가 발생했지만 `streaming_load_max_mb`를 조정하고 싶지 않거나 `-238 TOO MANY SEGMENT` 오류가 발생했다면 이 값을 일시적으로 낮출 수 있습니다. **대개 기본값으로 충분합니다.**

4. **버전 수에 영향을 주는 두 가지 주요 매개변수**:

    | 매개변수 | 영향 | 권장 사항 |
    |---|---|---|
    | `workers` | 작업자 수가 많을수록 버전 수와 동시 실행 수가 늘어납니다 | 보통 `8`을 사용합니다 |
    | `max_byte_per_task` | 값이 클수록 버전당 데이터 양이 늘고 버전 수는 줄지만, 너무 크면 `-238 TOO MANY SEGMENT` 오류가 발생할 수 있습니다 | 보통 기본값을 사용합니다 |

### 권장 명령 {#recommended-command}

대부분의 경우 필수 매개변수를 설정하고 `workers`를 `8`로 지정하면 충분합니다.

```shell
./doris-streamloader \
    --source_file="demo.csv,demoFile*.csv,demoDir" \
    --url="http://127.0.0.1:8030" \
    --header="column_separator:," \
    --db="demo" \
    --table="test_load" \
    --u="root" \
    --workers=8
```

---

## 자주 묻는 질문 {#faq}

### 1. 적재 중 일부 하위 작업이 실패하면 어떻게 해야 하나요? {#1-what-should-i-do-if-some-subtasks-fail-during-import}

도구가 자동으로 재시도합니다. 재시도 후에도 실패하면 수동 재시도 명령을 출력합니다. 이 명령을 복사해 실행하면 됩니다. 테이블을 삭제하고 다시 적재할 필요는 없습니다.

### 2. 한 번의 적재가 BE의 기본 `streaming_load_max_mb` 임계값을 초과하면 어떻게 하나요? {#2-what-if-a-single-import-exceeds-the-be-default-streaming_load_max_mb-threshold}

도구에서 작업 하나에 적용하는 기본 상한은 100 GB입니다. 이는 Doris 3.0.2 이상 버전과 2.1 계열의 2.1.7 이상 버전에서 `streaming_load_max_mb`의 소스 코드 기본값인 102400 MB와 일치합니다. Doris 3.0.0과 3.0.1의 BE 기본값은 10 GB이며, 4.x와 dev의 BE 기본값은 100 GB입니다. 실제 적용되는 BE 설정은 다를 수 있습니다. 작업이 실제 제한을 초과하면 `--max_byte_per_task`를 낮춰 더 작은 배치로 분할하거나, 관리자에게 동적으로 변경할 수 있는 `streaming_load_max_mb` 매개변수의 조정을 요청하세요. BE를 재시작할 필요는 없습니다.

ADMIN_PRIV 권한이 있는 사용자는 SQL을 통해 각 BE에 실제로 적용되는 설정을 확인할 수 있습니다. 관리형 클라우드 서비스에서는 서비스에서 제공하는 설정 관리 방법을 사용하거나 관리자에게 문의하세요. BE 호스트에 직접 접근할 필요는 없습니다.

```sql
SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';
```

### 3. `-238 TOO MANY SEGMENT` 오류가 발생하면 어떻게 해야 하나요? {#3-what-should-i-do-when-the--238-too-many-segment-error-occurs}

`--max_byte_per_task` 매개변수를 낮추면 이 문제를 완화할 수 있습니다.
