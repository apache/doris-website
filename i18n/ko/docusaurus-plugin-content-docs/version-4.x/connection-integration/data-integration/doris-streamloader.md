---
{
    "title": "Doris Streamloader",
    "language": "ko",
    "description": "Doris Streamloader는 Apache Doris에서 공식 제공하는 데이터 수집 클라이언트 도구입니다. 다중 동시성, 다중 파일 가져오기, 재개 가능한 전송 및 자동 재시도를 지원하며, 대용량 데이터를 일괄 적재하는 데 적합합니다."
}
---

[Doris Streamloader](https://github.com/apache/doris-streamloader)는 Apache Doris 데이터베이스로 데이터를 수집하기 위한 전용 클라이언트 도구입니다. `curl`을 직접 사용하는 단일 동시성 가져오기 방식과 비교하면, 이 도구는 다중 동시성 가져오기 기능을 제공하여 대용량 데이터를 적재하는 데 필요한 시간을 크게 줄여 줍니다.

## 핵심 기능 {#core-features}

| 기능 | 설명 |
|---|---|
| 동시 가져오기 | 여러 동시 작업자를 사용하여 Stream Load를 수행합니다. 동시성 수준은 `workers` 매개변수로 설정합니다. |
| 다중 파일 가져오기 | 하나의 작업에서 여러 파일과 디렉터리를 가져옵니다. 와일드카드 일치를 지원하며 디렉터리 아래의 모든 파일을 자동으로 재귀 탐색합니다. |
| 재개 가능한 전송 | 가져오기 중 일부 실패가 발생하면 실패 지점부터 전송을 재개할 수 있습니다. |
| 자동 재시도 | 가져오기가 실패해도 수동으로 재시도할 필요가 없습니다. 도구가 기본 횟수만큼 자동으로 재시도합니다. 그래도 실패하면 수동 재시도 명령을 출력합니다. |

## 사용 사례 {#use-cases}

- Doris에 대용량 데이터(GB~TB 규모)를 일괄 적재
- 여러 파일과 여러 디렉터리의 일괄 가져오기
- 처리량을 높이기 위해 다중 동시성이 필요한 가져오기 지연 시간 민감 시나리오
- 재개 가능한 전송과 실패 시 자동 복구가 필요한 안정적인 가져오기 워크플로

---

## 다운로드 및 설치 {#download-and-installation}

| 리소스 | 주소 |
|---|---|
| 소스 코드 | [https://github.com/apache/doris-streamloader](https://github.com/apache/doris-streamloader) |
| 바이너리 다운로드 | [https://doris.apache.org/download](https://doris.apache.org/download) |

:::note
다운로드 파일은 실행 가능한 바이너리이므로 추가 컴파일이나 설치가 필요하지 않습니다.
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
| `--source_file` | 가져올 데이터 파일 목록입니다. 단일 파일, 디렉터리, 와일드카드 및 쉼표로 구분된 목록을 지원합니다. |
| `--url` | Doris FE 또는 BE의 서비스 주소이며 형식은 `http://host:port`입니다. |
| `--header` | Stream Load의 Header 매개변수입니다. 여러 매개변수는 `?`로 구분합니다. |
| `--db` | 대상 데이터베이스 이름입니다. |
| `--table` | 대상 테이블 이름입니다. |

### `source_file`에서 지원하는 형식 {#formats-supported-by-source_file}

`--source_file` 매개변수는 다음 다섯 가지 형식을 지원합니다. 시나리오에 따라 유연하게 선택할 수 있습니다.

#### 1. 단일 파일 {#1-a-single-file}

예를 들어 단일 파일 `file.csv`를 가져옵니다.

```shell
doris-streamloader --source_file="file.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 2. 단일 디렉터리 {#2-a-single-directory}

예를 들어 디렉터리 `dir`을 가져옵니다.

```shell
doris-streamloader --source_file="dir" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 3. 와일드카드가 포함된 파일 이름(따옴표로 묶어야 함) {#3-a-file-name-with-wildcards-must-be-quoted}

예를 들어 `file0.csv`, `file1.csv`, `file2.csv`를 가져옵니다.

```shell
doris-streamloader --source_file="file*" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 4. 쉼표로 구분된 파일 이름 목록 {#4-a-comma-separated-list-of-file-names}

예를 들어 `file0.csv`, `file1.csv`, `file2.csv`를 가져옵니다.

```shell
doris-streamloader --source_file="file0.csv,file1.csv,file2.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

#### 5. 쉼표로 구분된 디렉터리 목록 {#5-a-comma-separated-list-of-directories}

예를 들어 `dir1`, `dir2`, `dir3`을 가져옵니다.

```shell
doris-streamloader --source_file="dir1,dir2,dir3" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

### Header 매개변수 {#header-parameter}

`--header`는 Stream Load의 모든 매개변수를 지원합니다. 여러 매개변수는 `?`로 구분합니다.

예시:

```shell
doris-streamloader --source_file="data.csv" --url="http://localhost:8330" --header="column_separator:|?columns:col1,col2" --db="testdb" --table="testtbl"
```

---

## 선택적 매개변수 {#optional-parameters}

위의 필수 매개변수 외에도 가져오기 동작을 세밀하게 제어할 수 있는 다양한 선택적 매개변수를 제공합니다. 아래 표에는 기능별로 매개변수가 정리되어 있습니다.

### 인증 및 전송 {#authentication-and-transport}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--u` | 데이터베이스 사용자 이름 | `root` | —— |
| `--p` | 데이터베이스 사용자 비밀번호 | 빈 문자열 | —— |
| `--compress` | HTTP 전송 중 데이터를 압축할지 여부 | `false` | 기본값을 유지합니다. 압축을 활성화하면 도구와 Doris BE에서 압축 및 압축 해제에 필요한 CPU 부하가 증가합니다. 데이터 소스 머신의 네트워크 대역폭이 병목인 경우에만 활성화합니다. |
| `--timeout` | Doris로 전송하는 HTTP 요청의 제한 시간(초) | `60*60*10` | 기본값을 유지합니다. |

### 배치 및 동시성 {#batch-and-concurrency}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--batch` | 파일을 일괄 읽고 전송하는 단위(행) | `4096` | 기본값을 유지합니다. |
| `--batch_byte` | 파일을 일괄 읽고 전송하는 단위(바이트) | `943718400` (900 MB) | 기본값을 유지합니다. |
| `--workers` | 가져오기의 동시성 수준 | `0` | `0`으로 설정하면 자동 모드로 실행되며, 가져오는 데이터 크기, 디스크 처리량 및 Stream Load 가져오기 속도를 기반으로 값을 계산합니다. 수동으로 설정할 수도 있습니다. 고성능 클러스터에서는 적절히 늘릴 수 있지만 **10 이하를 권장합니다**. 가져오기 메모리가 너무 높으면(Memtracker 또는 Exceed 로그로 확인) 적절히 줄일 수 있습니다. |
| `--disk_throughput` | 디스크 처리량(MB/s) | `800` | 일반적으로 기본값을 유지합니다. 이 값은 `--workers` 자동 계산에 사용됩니다. 도구가 적절한 `workers` 수를 계산하도록 하려면 실제 디스크 처리량에 맞춰 설정할 수 있습니다. |
| `--streamload_throughput` | 실제 Stream Load 가져오기 처리량(MB/s) | `100` | 일반적으로 기본값을 유지합니다. 이 값은 `--workers` 자동 계산에 사용됩니다. 기본값은 일일 성능 테스트 환경에서 얻은 값입니다. 적절한 `workers` 수를 계산하도록 하려면 측정된 처리량에 따라 다음 공식으로 설정할 수 있습니다. `(LoadBytes*1000) / (LoadTimeMs*1024*1024)` |
| `--max_byte_per_task` | 가져오기 작업 하나의 데이터 양 상한입니다. 초과하면 데이터를 새 작업으로 분할합니다. | `107374182400` (100 GB) | 가져오기 버전 수를 줄이려면 큰 값을 권장합니다. 그러나 `body exceed max size` 오류가 발생했는데 `streaming_load_max_mb`를 조정하고 싶지 않거나 `-238 TOO MANY SEGMENT` 오류가 발생하면 일시적으로 값을 줄일 수 있습니다. |

### 데이터 검증 및 로그 {#data-validation-and-logs}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--check_utf8` | 가져온 데이터의 인코딩을 검사할지 여부입니다. `false`는 검사를 건너뛰고 원시 데이터를 가져오며, `true`는 UTF-8이 아닌 문자를 `�`로 바꿉니다. | `true` | 기본값을 유지합니다. |
| `--debug` | 디버그 로그를 출력할지 여부 | `false` | 기본값을 유지합니다. |
| `--log_filename` | 로그 저장 위치 | `""` | 기본적으로 로그는 콘솔에 출력됩니다. 파일에 기록하려면 경로를 지정합니다(예: `--log_filename="/var/log"`). |

### 실패 재시도 {#failure-retry}

| 매개변수 | 의미 | 기본값 | 권장 사항 |
|---|---|---|---|
| `--auto_retry` | 자동으로 재시도할 worker 및 task 번호 목록 | 빈 문자열 | 가져오기가 실패한 경우에만 사용합니다. 정상적인 가져오기 중에는 설정할 필요가 없습니다. 실패하면 구체적인 매개변수 값이 출력되므로 그대로 복사하여 실행하면 됩니다. 예를 들어 `--auto_retry="1,1,2,1"`은 첫 번째 worker의 첫 번째 task와 두 번째 worker의 첫 번째 task를 재시도해야 한다는 의미입니다. |
| `--auto_retry_times` | 자동 재시도 횟수 | `3` | 기본값을 유지합니다. 재시도를 비활성화하려면 `0`으로 설정합니다. |
| `--auto_retry_interval` | 자동 재시도 간격(초) | `60` | 기본값을 유지합니다. Doris가 중단되어 실패한 경우 실제 재시작 시간에 맞춰 설정합니다. |

---

## 결과 {#result}

가져오기가 성공하든 실패하든 도구는 작업을 완료할 때 최종 결과를 출력합니다.

### 결과 필드 {#result-fields}

| 필드 | 설명 |
|---|---|
| `Status` | 가져오기 상태입니다. `Success`는 성공, `Failed`는 실패를 의미합니다. |
| `TotalRows` | 가져올 파일에 있는 전체 행 수입니다. |
| `FailLoadRows` | 가져오도록 지정했지만 가져오지 못한 행 수입니다. |
| `LoadedRows` | Doris로 실제 가져온 행 수입니다. |
| `FilteredRows` | 가져오는 동안 Doris가 필터링한 행 수입니다. |
| `UnselectedRows` | 가져오는 동안 Doris가 무시한 행 수입니다. |
| `LoadBytes` | 실제로 가져온 바이트 수입니다. |
| `LoadTimeMs` | 실제 가져오기 소요 시간(밀리초)입니다. |
| `LoadFiles` | 실제로 가져온 파일 목록입니다. |

### 성공 예시 {#success-example}

가져오기에 성공하면 다음과 같이 출력됩니다.

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

데이터 일부를 가져오는 데 실패하면 도구는 먼저 재시도 명령을 출력합니다.

```Go
load has some error, and auto retry failed, you can retry by :
./doris-streamloader --source_file /mnt/disk1/laihui/doris/tools/tpch-tools/bin/tpch-data/lineitem.tbl.1  --url="http://127.0.0.1:8239" --header="column_separator:|?columns: l_orderkey, l_partkey, l_suppkey, l_linenumber, l_quantity, l_extendedprice, l_discount, l_tax, l_returnflag,l_linestatus, l_shipdate,l_commitdate,l_receiptdate,l_shipinstruct,l_shipmode,l_comment,temp" --db="db" --table="lineitem1" -u root -p "" --compress=false --timeout=36000 --workers=3 --batch=4096 --batch_byte=943718400 --max_byte_per_task=1073741824 --check_utf8=true --report_duration=1 --auto_retry="2,1;1,1;0,1" --auto_retry_times=0 --auto_retry_interval=60
```

이 명령을 복사하여 실행하면 수동 재시도가 수행됩니다. `auto_retry`의 의미는 위의 매개변수 섹션에 설명되어 있습니다. 그런 다음 실패 결과가 출력됩니다.

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

1. **필수 매개변수**: 다음 매개변수를 구성해야 합니다.

    ```text
    --source_file=FILE_LIST
    --url=FE_OR_BE_SERVER_URL_WITH_PORT
    --header=STREAMLOAD_HEADER
    --db=TARGET_DATABASE
    --table=TARGET_TABLE
    ```

    **여러 파일을 가져오려면 `source_file` 방식을 사용합니다.**

2. **`workers`**: 기본값은 `0`이며 자동 모드가 활성화됩니다(도구가 가져오기 크기, `disk_throughput` 및 `streamload_throughput`을 바탕으로 값을 계산하며 일반적으로 1, 2, 4 또는 8이 됩니다). 수동으로 설정할 수도 있습니다. 고성능 클러스터에서는 늘릴 수 있지만 **10 이하를 권장합니다**. **일반적으로 수동 값은 `8`로 설정합니다**.

3. **`max_byte_per_task`**: 큰 값을 사용하면 가져오기 버전 수가 줄어듭니다. 그러나 `body exceed max size` 오류가 발생했는데 `streaming_load_max_mb`를 조정하고 싶지 않거나 `-238 TOO MANY SEGMENT` 오류가 발생하면 이 값을 일시적으로 줄일 수 있습니다. **일반적으로 기본값이면 충분합니다.**

4. **버전 수에 영향을 주는 두 가지 핵심 매개변수**:

    | 매개변수 | 영향 | 권장 사항 |
    |---|---|---|
    | `workers` | worker가 많을수록 버전 수가 늘고 동시성이 높아집니다. | 일반적으로 `8`을 사용합니다. |
    | `max_byte_per_task` | 값이 클수록 버전 하나에 포함되는 데이터가 많아져 버전 수가 줄어들지만, 너무 크면 `-238 TOO MANY SEGMENT`가 발생할 수 있습니다. | 일반적으로 기본값을 사용합니다. |

### 권장 명령 {#recommended-command}

필수 매개변수를 설정하고 `workers`를 `8`로 설정하면 대부분의 시나리오에 충분합니다.

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

## FAQ {#faq}

### 1. 가져오기 중 일부 하위 작업이 실패하면 어떻게 해야 하나요? {#1-what-should-i-do-if-some-subtasks-fail-during-import}

도구가 자동으로 재시도합니다. 재시도도 실패하면 수동 재시도 명령을 출력하므로 복사하여 실행하면 됩니다. 테이블을 삭제하고 다시 가져올 필요는 없습니다.

### 2. 단일 가져오기가 BE 기본 `streaming_load_max_mb` 임계값을 초과하면 어떻게 해야 하나요? {#2-what-if-a-single-import-exceeds-the-be-default-streaming_load_max_mb-threshold}

도구의 작업별 기본 상한은 100 GB이며, 이는 Doris 3.0.2 이상(2.1 계열은 2.1.7 이상)의 `streaming_load_max_mb` 소스 코드 기본값인 102400 MB와 일치합니다. Doris 3.0.0 및 3.0.1에서 BE 기본값은 10 GB이고, 4.x 및 dev에서는 100 GB입니다. 실제 BE 구성은 다를 수 있습니다. 작업이 실제 한도를 초과하면 `--max_byte_per_task`를 줄여 더 작은 배치로 분할하거나 관리자에게 동적으로 수정 가능한 `streaming_load_max_mb` 매개변수의 조정을 요청합니다. BE를 재시작할 필요는 없습니다.

ADMIN_PRIV 권한이 있는 사용자는 SQL을 통해 각 BE의 실제 구성을 확인할 수 있습니다. 관리형 클라우드 서비스를 사용하는 경우 서비스에서 제공하는 구성 관리 방법을 사용하거나 관리자에게 문의하면 됩니다. BE 호스트에 직접 액세스할 필요는 없습니다.

```sql
SHOW BACKEND CONFIG LIKE 'streaming_load_max_mb';
```

### 3. `-238 TOO MANY SEGMENT` 오류가 발생하면 어떻게 해야 하나요? {#3-what-should-i-do-when-the--238-too-many-segment-error-occurs}

`--max_byte_per_task` 매개변수 값을 줄이면 이 문제를 완화할 수 있습니다.
