---
{
    "title": "SeaTunnel",
    "language": "ko",
    "toc_min_heading_level": 2,
    "toc_max_heading_level": 4,
    "description": "SeaTunnel Doris Sink를 사용하여 데이터를 Apache Doris로 동기화하고 Connector-V2, Flink, Spark 및 Stream Load 매개변수를 설정하는 방법을 알아봅니다.",
    "keywords": [
        "SeaTunnel Doris Sink",
        "SeaTunnel에서 Doris로 쓰기",
        "Doris Stream Load",
        "Doris 데이터 동기화",
        "Connector-V2"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data integration / SeaTunnel writes to Doris -->

SeaTunnel은 사용하기 쉬운 초고성능 분산 데이터 통합 플랫폼으로, 대규모 데이터의 실시간 동기화를 지원하며 매일 수백억 건의 레코드를 안정적이고 효율적으로 동기화할 수 있습니다.

이 문서는 SeaTunnel의 데이터를 Doris로 동기화해야 하는 사용자를 대상으로 합니다. 사용 사례별로 Doris Sink를 선택하고 매개변수를 설정하는 방법과 사용 방법을 설명합니다.

## 커넥터 선택 방법 {#how-to-choose-a-connector}

| 사용 사례 | 권장 방식 | 적용 버전 또는 엔진 | 설명 |
| --- | --- | --- | --- |
| exactly-once 쓰기 또는 CDC 데이터 동기화가 필요한 경우 | Connector-V2 Doris Sink | SeaTunnel 2.3.1 이상 | Doris Sink, exactly-once 쓰기 및 CDC 데이터 동기화를 지원합니다. |
| Flink 엔진을 통해 데이터를 Doris로 동기화하는 경우 | Connector-V1 Flink Doris Sink | SeaTunnel 2.1.0, Flink 엔진 | 이미 Flink 엔진에서 실행 중인 SeaTunnel 작업에 적합합니다. |
| Spark 엔진을 통해 데이터를 Doris로 동기화하는 경우 | Connector-V1 Spark Sink Doris | SeaTunnel 2.1.0, Spark 엔진 | Hive의 데이터를 Doris로 마이그레이션하는 작업처럼 이미 Spark 엔진에서 실행 중인 작업에 적합합니다. |

## 시나리오 1: Connector-V2를 사용하여 Doris에 쓰기 {#scenario-1-use-connector-v2-to-write-to-doris}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Real-time synchronization / exactly-once writes / CDC data synchronization -->

SeaTunnel 2.3.1의 [Apache SeaTunnel Connector-V2](https://seatunnel.apache.org/docs/2.3.1/category/sink-v2)는 Doris Sink, exactly-once 쓰기 및 CDC 데이터 동기화를 지원합니다.

플러그인 소스 코드는 [SeaTunnel Doris Sink 플러그인 코드](https://github.com/apache/seatunnel/tree/dev/seatunnel-connectors-v2/connector-doris)를 참조하세요.

### 매개변수 설정 {#parameter-configuration}

| 매개변수 | 유형 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `fenodes` | string | 예 | - | Doris 클러스터의 FE 노드 주소입니다. 형식은 `fe_ip:fe_http_port,...`입니다. |
| `username` | string | 예 | - | Doris 사용자 이름입니다. |
| `password` | string | 예 | - | Doris 사용자의 비밀번호입니다. |
| `table.identifier` | string | 예 | - | Doris 테이블 이름입니다. 형식은 `DBName.TableName`입니다. |
| `sink.label-prefix` | string | 예 | - | Stream Load에서 사용하는 레이블 접두사입니다. 2PC 시나리오에서는 SeaTunnel의 EOS 의미 체계를 보장하기 위해 이 접두사가 전역적으로 고유해야 합니다. |
| `sink.enable-2pc` | bool | 아니요 | `true` | 두 단계 커밋(2PC)을 활성화할지 여부입니다. 기본값은 `true`이며, exactly-once 의미 체계를 보장합니다. 두 단계 커밋에 대한 자세한 내용은 [Stream Load 매뉴얼](../../data-operate/import/import-way/stream-load-manual.md)을 참조하세요. |
| `sink.enable-delete` | bool | 아니요 | `false` | 삭제를 활성화할지 여부입니다. 이 옵션을 사용하려면 Doris 테이블에 일괄 삭제가 활성화되어 있어야 합니다. Doris 0.15+에서는 이 기능이 기본적으로 활성화되며, Unique 테이블 모델만 지원됩니다. 자세한 내용은 [일괄 삭제](../../data-operate/delete/batch-delete-manual.md)를 참조하세요. |
| `doris.config` | map | 예 | - | Stream Load의 `data_desc` 매개변수입니다. 더 많은 매개변수는 [Stream Load 매뉴얼](../../data-operate/import/import-way/stream-load-manual.md)을 참조하세요. |

### JSON 형식 데이터 적재 {#import-data-in-json-format}

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_json"
        doris.config = {
            format = "json"
            read_json_by_line = "true"
        }
    }
}
```

### CSV 형식 데이터 적재 {#import-data-in-csv-format}

```text
sink {
    Doris {
        fenodes = "doris_fe:8030"
        username = root
        password = ""
        table.identifier = "test.table_sink"
        sink.enable-2pc = "true"
        sink.label-prefix = "test_csv"
        doris.config = {
            format = "csv"
            column_separator = ","
            line_delimiter = "\n"
        }
    }
}
```

## 시나리오 2: Connector-V1을 사용하여 Doris에 쓰기 {#scenario-2-use-connector-v1-to-write-to-doris}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: SeaTunnel 2.1.0 / Flink engine / Spark engine -->

Apache SeaTunnel 2.1.0은 Doris 커넥터를 지원하며, Flink 엔진 또는 Spark 엔진을 통해 데이터를 Doris로 동기화할 수 있습니다.

### Flink 엔진을 사용하여 Doris에 쓰기 {#use-the-flink-engine-to-write-to-doris}

플러그인 소스 코드는 [SeaTunnel Flink Sink Doris 플러그인 코드](https://github.com/apache/seatunnel)를 참조하세요.

#### 매개변수 설정 {#parameter-configuration-1}

| 매개변수 | 유형 | 필수 여부 | 기본값 | 지원 엔진 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | 예 | - | Flink | Doris FE HTTP 주소입니다. 예: `127.0.0.1:8030`. |
| `database` | string | 예 | - | Flink | 데이터를 쓸 Doris 데이터베이스 이름입니다. |
| `table` | string | 예 | - | Flink | 데이터를 쓸 Doris 테이블 이름입니다. |
| `user` | string | 예 | - | Flink | Doris에 접근하는 사용자입니다. |
| `password` | string | 예 | - | Flink | Doris에 접근하는 사용자의 비밀번호입니다. |
| `batch_size` | int | 아니요 | `100` | Flink | 단일 배치에서 Doris에 쓰는 최대 행 수입니다. |
| `interval` | int | 아니요 | `1000` | Flink | 플러시 간격이며, 단위는 밀리초입니다. 이 간격이 지나면 비동기 스레드가 버퍼에 저장된 데이터를 Doris에 씁니다. 주기적인 쓰기를 비활성화하려면 `0`으로 설정하세요. |
| `max_retries` | int | 아니요 | `1` | Flink | Doris에 쓰기가 실패한 후 재시도하는 횟수입니다. |
| `doris.*` | string | 아니요 | - | Flink | Stream Load 데이터 적재 매개변수입니다. 예: `doris.column_separator = ','`. 더 많은 매개변수는 [Stream Load 매뉴얼](../../data-operate/import/import-way/stream-load-manual.md)을 참조하세요. |

#### 예제: 소켓 데이터를 Doris에 쓰기 {#example-write-socket-data-to-doris}

```text
env {
    execution.parallelism = 1
}

source {
    SocketStream {
        host = 127.0.0.1
        port = 9999
        result_table_name = "socket"
        field_name = "info"
    }
}

transform {
}

sink {
    DorisSink {
        fenodes = "127.0.0.1:8030"
        user = root
        password = 123456
        database = test
        table = test_tbl
        batch_size = 5
        max_retries = 1
        interval = 5000
    }
}
```

작업을 시작합니다.

```shell
sh bin/start-seatunnel-flink.sh --config config/flink.streaming.conf
```

### Spark 엔진을 사용하여 Doris에 쓰기 {#use-the-spark-engine-to-write-to-doris}

플러그인 소스 코드는 [SeaTunnel Spark Sink Doris 플러그인 코드](https://github.com/apache/seatunnel)를 참조하세요.

#### 매개변수 설정 {#parameter-configuration-2}

| 매개변수 | 유형 | 필수 여부 | 기본값 | 지원 엔진 | 설명 |
| --- | --- | --- | --- | --- | --- |
| `fenodes` | string | 예 | - | Spark | Doris FE 노드 주소입니다. 예: `127.0.0.1:8030`. |
| `database` | string | 예 | - | Spark | 데이터를 쓸 Doris 데이터베이스 이름입니다. |
| `table` | string | 예 | - | Spark | 데이터를 쓸 Doris 테이블 이름입니다. |
| `user` | string | 예 | - | Spark | Doris에 접근하는 사용자입니다. |
| `password` | string | 예 | - | Spark | Doris에 접근하는 사용자의 비밀번호입니다. |
| `batch_size` | int | 예 | `100` | Spark | Spark가 Stream Load를 통해 Doris에 데이터를 쓸 때 배치당 제출하는 행 수입니다. |
| `doris.*` | string | 아니요 | - | Spark | Stream Load HTTP 매개변수입니다. Stream Load 매개변수에 `doris.` 접두사를 붙여 사용할 수 있습니다. 예: `doris.column_separator`. 더 많은 매개변수는 [Stream Load 매뉴얼](../../data-operate/import/import-way/stream-load-manual.md)을 참조하세요. |

#### 예제: Hive의 데이터를 Doris로 마이그레이션하기 {#example-migrate-data-from-hive-to-doris}

```text
env {
    spark.app.name = "hive2doris-template"
}

spark {
    spark.sql.catalogImplementation = "hive"
}

source {
    hive {
        preSql = "select * from tmp.test"
        result_table_name = "test"
    }
}

transform {
}

sink {
    Console {
    }

    Doris {
        fenodes = "xxxx:8030"
        database = "tmp"
        table = "test"
        user = "root"
        password = "root"
        batch_size = 1000
        doris.column_separator = "\t"
        doris.columns = "date_key,date_value,day_in_year,day_in_month"
    }
}
```

작업을 시작합니다.

```shell
sh bin/start-waterdrop-spark.sh --master local[4] --deploy-mode client --config ./config/spark.conf
```
