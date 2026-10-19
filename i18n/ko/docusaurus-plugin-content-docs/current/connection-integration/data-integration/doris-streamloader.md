---
{
    "title": "Doris Streamloader",
    "language": "ko",
    "description": "Doris Streamloader는 Apache Doris의 공식 데이터 수집 클라이언트 도구입니다. 동시 데이터 적재, 여러 파일 적재, 전송 재개, 자동 재시도를 지원하며 대용량 데이터의 배치 적재에 적합합니다."
}
---

[Doris Streamloader](https://github.com/apache/doris-streamloader)는 Apache Doris 데이터베이스에 데이터를 수집하기 위한 전용 클라이언트 도구입니다. `curl`을 직접 사용해 한 번에 하나씩 데이터를 적재하는 방식과 비교하면, 이 도구는 여러 작업을 동시에 수행할 수 있어 대용량 데이터 적재에 필요한 시간을 크게 줄여 줍니다.

## 주요 기능 {#core-features}

| 기능 | 설명 |
|---|---|
| 동시 데이터 적재 | 여러 작업자가 동시에 Stream Load를 수행합니다. 동시성 수준은 `workers` 매개변수로 설정합니다 |
| 여러 파일 적재 | 하나의 작업에서 여러 파일과 디렉터리를 적재합니다. 와일드카드 매칭을 지원하며 디렉터리 아래의 모든 파일을 자동으로 재귀 탐색합니다 |
| 전송 재개 | 데이터 적재 중 일부가 실패하면 실패한 지점부터 재개할 수 있습니다 |
| 자동 재시도 | 데이터 적재에 실패해도 수동으로 재시도할 필요가 없습니다. 도구가 기본 재시도 횟수만큼 자동으로 재시도하며, 계속 실패하면 수동 재시도 명령을 출력합니다 |

## 사용 사례 {#use-cases}

- 대용량 데이터(GB~TB 규모)를 Doris에 배치 적재
- 여러 파일과 디렉터리를 한꺼번에 적재
- 데이터 적재 지연 시간에 민감하여 동시성으로 처리량을 높여야 하는 경우
- 전송 재개와 자동 장애 복구가 필요한 안정적인 데이터 적재 워크플로

---

## 다운로드 및 설치 {#download-and-installation}

| 리소스 | 주소 |
|---|---|
| 소스 코드 | [https://github.com/apache/doris-streamloader](https://github.com/apache/doris-streamloader) |
| 바이너리 다운로드 | [https://doris.apache.org/download](https://doris.apache.org/download) |

:::note
다운로드한 파일은 실행 가능한 바이너리이므로 별도의 컴파일이나 설치가 필요하지 않습니다.
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
| `--source_file` | 적재할 데이터 파일 목록입니다. 단일 파일, 디렉터리, 와일드카드, 쉼표로 구분된 목록을 지원합니다 |
| `--url` | Doris FE 또는 BE의 서비스 주소이며, 형식은 `http://host:port`입니다 |
| `--header` | Stream Load의 헤더 매개변수입니다. 여러 매개변수는 `?`로 구분합니다 |
| `--db` | 대상 데이터베이스 이름입니다 |
| `--table` | 대상 테이블 이름입니다 |

### `source_file`에서 지원하는 형식 {#formats-supported-by-source_file}

`--source_file` 매개변수는 다음 다섯 가지 형식을 지원합니다. 사용 상황에 맞게 선택할 수 있습니다.

#### 1. 단일 파일 {#1-a-single-file}

예를 들어 단일 파일 `file.csv`를 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="file.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 2. 단일 디렉터리 {#2-a-single-directory}

예를 들어 디렉터리 `dir`을 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 3. 와일드카드가 포함된 파일 이름(따옴표 필수) {#3-a-file-name-with-wildcards-must-be-quoted}

예를 들어 `file0.csv`, `file1.csv`, `file2.csv`를 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 4. 쉼표로 구분된 파일 이름 목록 {#4-a-comma-separated-list-of-file-names}

예를 들어 `file0.csv`, `file1.csv`, `file2.csv`를 적재하려면 다음과 같이 실행합니다.

```shell
doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 5. 쉼표로 구분된 디렉터리 목록 {#5-a-comma-separated-list-of-directories}

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

## 선택 매개변수 {#optional-parameters}

위의 필수 매개변수 외에도 데이터 적재 동작을 세밀하게 제어할 수 있는 여러 선택 매개변수를 제공합니다. 아래 표는 이를 기능별로 정리한 것입니다.

### 인증 및 전송 {#authentication-and-transport}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--u` | 데이터베이스 사용자 이름 | `root` | —— |
| `--p` | 데이터베이스 사용자 비밀번호 | 빈 문자열 | —— |
| `--compress` | HTTP 전송 중 데이터 압축 여부 | `false` | 기본값을 유지하세요. 압축을 활성화하면 도구와 Doris BE 모두에서 압축 및 압축 해제를 위한 CPU 부하가 증가합니다. 데이터 소스 머신의 네트워크 대역폭이 병목인 경우에만 활성화하세요 |
| `--timeout` | Doris로 보내는 HTTP 요청의 시간 제한(초) | `60*60*10` | 기본값을 유지하세요 |

### 배치 처리 및 동시성 {#batch-and-concurrency}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--batch` | 파일을 배치로 읽고 전송하는 단위(행) | `4096` | 기본값을 유지하세요 |
| `--batch_byte` | 파일을 배치로 읽고 전송하는 단위(바이트) | `943718400` (900 MB) | 기본값을 유지하세요 |
| `--workers` | 데이터 적재의 동시성 수준 | `0` | `0`으로 설정하면 도구가 자동 모드로 실행되며, 적재할 데이터 크기, 디스크 처리량, Stream Load 데이터 적재 속도를 기준으로 값을 계산합니다. 수동으로 설정할 수도 있습니다. 고성능 클러스터에서는 적절히 높일 수 있지만, **가급적 10 이하로 설정하세요**. 데이터 적재 시 메모리 사용량이 너무 높으면(Memtracker 또는 Exceed 로그로 확인) 적절히 낮출 수 있습니다 |
| `--disk_throughput` | 디스크 처리량(MB/s) | `800` | 일반적으로 기본값을 유지하세요. 이 값은 `--workers`의 자동 계산에 사용됩니다. 도구가 적절한 `workers` 수를 계산하도록 하려면 실제 디스크 처리량을 기준으로 설정할 수 있습니다 |
| `--streamload_throughput` | 실제 Stream Load 데이터 적재 처리량(MB/s) | `100` | 일반적으로 기본값을 유지하세요. 이 값은 `--workers`의 자동 계산에 사용됩니다. 기본값은 정기 성능 테스트 환경에서 도출한 값입니다. 도구가 적절한 `workers` 수를 계산하도록 하려면 측정한 처리량을 기준으로 설정할 수 있습니다. 계산식은 `(LoadBytes*1000) / (LoadTimeMs*1024*1024)`입니다 |
| `--max_byte_per_task` | 데이터 적재 작업당 데이터 크기 상한입니다. 이 값을 초과하면 데이터를 새 작업으로 분할합니다 | `107374182400` (100 GB) | 데이터 적재 버전 수를 줄이려면 큰 값을 권장합니다. 다만 `body exceed max size` 오류가 발생했을 때 `streaming_load_max_mb`를 조정하고 싶지 않거나(BE 재시작 필요), `-238 TOO MANY SEGMENT` 오류가 발생하면 일시적으로 값을 낮출 수 있습니다 |

### 데이터 검증 및 로그 {#data-validation-and-logs}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--check_utf8` | 적재할 데이터의 인코딩 검사 여부입니다. `false`는 검사를 건너뛰고 원시 데이터를 적재하며, `true`는 UTF-8이 아닌 문자를 `�`로 바꿉니다 | `true` | 기본값을 유지하세요 |
| `--debug` | 디버그 로그 출력 여부 | `false` | 기본값을 유지하세요 |
| `--log_filename` | 로그 저장 위치 | `""` | 기본적으로 로그는 콘솔에 출력됩니다. 로그를 파일에 기록하려면 경로를 지정하세요. 예: `--log_filename="/var/log"` |

### 실패 시 재시도 {#failure-retry}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--auto_retry` | 자동으로 재시도할 작업자 번호와 작업 번호 목록 | 빈 문자열 | 데이터 적재가 실패한 경우에만 사용하세요. 정상적인 데이터 적재 중에는 설정할 필요가 없습니다. 실패하면 구체적인 매개변수 값이 출력되므로 그대로 복사하여 실행하면 됩니다. 예를 들어 `--auto_retry="1,1,2,1"`은 첫 번째 작업자의 첫 번째 작업과 두 번째 작업자의 첫 번째 작업을 재시도해야 한다는 의미입니다 |
| `--auto_retry_times` | 자동 재시도 횟수 | `3` | 기본값을 유지하세요. 재시도를 비활성화하려면 `0`으로 설정하세요 |
| `--auto_retry_interval` | 자동 재시도 간격(초) | `60` | 기본값을 유지하세요. Doris가 중지되어 실패한 경우에는 실제 재시작 시간을 기준으로 설정하세요 |

---

## 결과 {#result}

데이터 적재의 성공 여부와 관계없이 도구가 종료되면 최종 결과를 출력합니다.

### 결과 필드 {#result-fields}

| 필드 | 설명 |
|---|---|
| `Status` | 데이터 적재 상태입니다. `Success`는 성공, `Failed`는 실패를 의미합니다 |
| `TotalRows` | 적재할 파일에 있는 전체 행 수 |
| `FailLoadRows` | 적재하려고 했지만 적재되지 않은 행 수 |
| `LoadedRows` | Doris에 실제로 적재된 행 수 |
| `FilteredRows` | 데이터 적재 중 Doris가 필터링한 행 수 |
| `UnselectedRows` | 데이터 적재 중 Doris가 무시한 행 수 |
| `LoadBytes` | 실제로 적재된 바이트 수 |
| `LoadTimeMs` | 실제 데이터 적재 소요 시간(밀리초) |
| `LoadFiles` | 실제로 적재된 파일 목록 |

### 성공 예시 {#success-example}

데이터 적재에 성공하면 다음과 같이 출력됩니다.

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

일부 데이터가 적재되지 않으면 먼저 재시도 명령을 출력합니다.

```Go
load has some error, and auto retry failed, you can retry by :
./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
```

이 명령을 복사하여 실행하면 수동으로 재시도할 수 있습니다. `auto_retry`의 의미는 위의 매개변수 절에 설명되어 있습니다. 이어서 실패 결과가 출력됩니다.

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

## 권장 사용 방법 {#best-practices}

### 권장 매개변수 {#recommended-parameters}

1. **필수 매개변수**: 다음 매개변수는 반드시 설정해야 합니다.

    ```text
    --source_file=FILE_LIST
    --url=FE_OR_BE_SERVER_URL_WITH_PORT
    --header=STREAMLOAD_HEADER
    --db=TARGET_DATABASE
    --table=TARGET_TABLE
    ```

    **여러 파일을 적재하려면 `source_file` 방식을 사용하세요.**

2. **`workers`**: 기본값은 `0`이며, 자동 모드를 활성화합니다(도구가 적재할 데이터 크기, `disk_throughput`, `streamload_throughput`을 기준으로 값을 계산하며, 일반적으로 1, 2, 4 또는 8이 됩니다). 수동으로 설정할 수도 있습니다. 고성능 클러스터에서는 값을 높일 수 있지만, **10 이하를 권장합니다**. **수동 설정 시 일반적으로 `8`을 사용합니다**.

3. **`max_byte_per_task`**: 값이 클수록 데이터 적재 버전 수가 줄어듭니다. 다만 `body exceed max size` 오류가 발생했을 때 `streaming_load_max_mb`를 조정하고 싶지 않거나(BE 재시작 필요), `-238 TOO MANY SEGMENT` 오류가 발생하면 일시적으로 이 값을 낮출 수 있습니다. **일반적으로 기본값이면 충분합니다.**

4. **버전 수에 영향을 주는 두 가지 주요 매개변수**:

    | 매개변수 | 영향 | 권장 사항 |
    |---|---|---|
    | `workers` | 작업자가 많을수록 버전 수와 동시성이 높아집니다 | 일반적으로 `8`을 사용하세요 |
    | `max_byte_per_task` | 값이 클수록 버전당 데이터가 많아지고 버전 수가 줄어들지만, 너무 크면 `-238 TOO MANY SEGMENT` 오류가 발생할 수 있습니다 | 일반적으로 기본값을 사용하세요 |

### 권장 명령 {#recommended-command}

필수 매개변수를 설정하고 `workers`를 `8`로 지정하면 대부분의 상황에 충분합니다.

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

### 1. 데이터 적재 중 일부 하위 작업이 실패하면 어떻게 해야 하나요? {#1-what-should-i-do-if-some-subtasks-fail-during-import}

도구가 자동으로 재시도합니다. 재시도 후에도 실패하면 수동 재시도 명령을 출력하므로 그대로 복사하여 실행하면 됩니다. 테이블을 삭제하고 다시 적재할 필요는 없습니다.

### 2. 단일 데이터 적재가 BE의 기본 `streaming_load_max_mb` 임계값을 초과하면 어떻게 해야 하나요? {#2-what-if-a-single-import-exceeds-the-be-default-streaming_load_max_mb-threshold}

도구의 데이터 적재당 기본 상한은 100 GB로, BE의 `streaming_load_max_mb` 임계값을 초과할 수 있습니다. BE를 재시작하지 않으려면 `--max_byte_per_task` 매개변수 값을 낮추세요.

`streaming_load_max_mb` 값을 확인하려면 다음 명령을 실행하세요.

```shell
curl "http://127.0.0.1:8040/api/show_config"
```

### 3. `-238 TOO MANY SEGMENT` 오류가 발생하면 어떻게 해야 하나요? {#3-what-should-i-do-when-the--238-too-many-segment-error-occurs}

`--max_byte_per_task` 매개변수 값을 낮추면 이 문제를 완화할 수 있습니다.
