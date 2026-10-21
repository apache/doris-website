---
{
    "title": "Spark Load",
    "language": "ko",
    "description": "Spark Load는 외부 Spark 리소스를 사용해 적재할 데이터를 사전 처리하여 Doris의 대용량 데이터 적재 성능을 높이고 Doris 클러스터의 컴퓨팅 리소스를 절약합니다. 주로 Doris로 데이터를 처음 마이그레이션하거나 대규모 데이터를 적재할 때 사용합니다."
}
---

# Spark Load {#spark-load}

Spark Load는 외부 Spark 리소스를 사용해 적재할 데이터를 사전 처리하여 Doris의 대용량 데이터 적재 성능을 높이고 Doris 클러스터의 컴퓨팅 리소스를 절약합니다. 주로 Doris로 데이터를 처음 마이그레이션하거나 대규모 데이터를 적재할 때 사용합니다.

Spark Load는 Spark 클러스터의 리소스를 활용하여 적재할 데이터를 정렬하고, Doris BE가 파일을 직접 기록합니다. 이를 통해 Doris 클러스터의 리소스 사용량을 크게 줄일 수 있어, 방대한 과거 데이터를 마이그레이션할 때 Doris 클러스터의 리소스 사용량과 부하를 낮추는 데 매우 효과적입니다.

Spark Load 클라이언트를 통해 적재 작업을 생성하고 실행해야 합니다. 작업 실행 상태는 콘솔에 출력되며, SHOW LOAD를 통해 적재 결과를 확인할 수도 있습니다.

:::caution 참고

이 기능은 실험적 기능이며, 현재 master 브랜치에서만 사용할 수 있습니다.
현재 버전은 스토리지와 컴퓨팅이 통합된 클러스터만 지원합니다.
사용 중 문제가 발생하면 메일링 리스트, [GitHub Issue](https://github.com/apache/doris/issues) 또는 기타 채널을 통해 의견을 보내 주세요.

:::

## 사용 사례 {#use-cases}

- 원본 데이터가 HDFS처럼 Spark에서 접근할 수 있는 스토리지 시스템에 있습니다.
- 데이터 용량이 수십 GB에서 TB에 이릅니다.

:::caution 참고
기본 키 모델에서는 현재 merge-on-read 모드의 테이블만 지원합니다.
:::

## 기본 원리 {#basic-principles}

### 기본 절차 {#basic-process}

Spark Load 작업의 실행은 크게 다음 7단계로 나뉩니다.

1. 읽을 원본 파일/테이블과 대상 테이블 정보를 설정하는 설정 파일을 작성합니다.
2. Spark Load 클라이언트가 FE에 적재 작업을 생성하고 트랜잭션을 시작합니다. FE는 대상 테이블의 메타데이터를 클라이언트에 반환합니다.
3. Spark Load 클라이언트가 Spark 클러스터에 ETL 작업을 제출하여 실행합니다.
4. Spark 클러스터가 ETL을 실행하여 적재할 데이터의 사전 처리를 완료합니다. 여기에는 전역 딕셔너리 구축(Bitmap 타입), 파티셔닝, 정렬, 집계 등이 포함됩니다.
5. ETL 작업이 완료되면 Spark Load 클라이언트가 사전 처리된 각 샤드의 데이터 경로를 FE에 동기화하고, 관련 BE가 Push 작업을 실행하도록 스케줄링합니다.
6. BE가 데이터를 읽고 Doris의 내부 스토리지 형식으로 변환합니다.
7. FE가 버전이 적용되도록 스케줄링하여 적재 작업을 완료합니다.

### 전역 딕셔너리 {#global-dictionary}

#### 적용 시나리오 {#applicable-scenarios}

현재 Doris의 Bitmap 컬럼은 Roaringbitmap 라이브러리를 사용하여 구현됩니다. Roaringbitmap의 입력 데이터 타입은 정수만 가능하므로, 적재 과정에서 Bitmap 컬럼을 사전 계산하려면 입력 데이터 타입을 정수로 변환해야 합니다.

Doris의 기존 적재 과정에서는 전역 딕셔너리의 데이터 구조를 Hive 테이블 기반으로 구현하며, 원본 값과 인코딩된 값 간의 매핑을 저장합니다.

#### 구축 절차 {#construction-process}

1. 업스트림 데이터 소스에서 데이터를 읽어 임시 Hive 테이블을 생성하고, 이를 hive_table이라고 합니다.
2. hive_table에서 중복 제거 대상 컬럼의 고유 값을 추출하여 새 Hive 테이블을 생성하고, 이를 distinct_value_table이라고 합니다.
3. 원본 값을 저장하는 컬럼과 인코딩된 값을 저장하는 컬럼으로 구성된 새 전역 딕셔너리 테이블을 생성하고, 이를 dict_table이라고 합니다.
4. distinct_value_table과 dict_table 간에 Left Join을 수행하여 새로 추가된 고유 값 집합을 구한 다음, 윈도 함수를 사용해 이 집합을 인코딩합니다. 이 시점에는 중복 제거 대상 컬럼의 원본 값에 인코딩된 값 컬럼이 추가됩니다. 마지막으로 이 두 컬럼의 데이터를 dict_table에 다시 기록합니다.
5. dict_table과 hive_table을 조인하여 hive_table의 원본 값을 정수로 인코딩된 값으로 바꿉니다.
6. hive_table은 다음 데이터 사전 처리 과정에서 읽히며, 계산을 거친 후 Doris에 적재됩니다.
   데이터 사전 처리(DPP)
   기본 절차
7. 데이터 소스에서 데이터를 읽습니다. 업스트림 데이터 소스는 HDFS 파일이나 Hive 테이블일 수 있습니다.
8. 읽은 데이터에 대해 필드 매핑과 표현식 계산을 수행하고, 파티션 정보를 기반으로 버킷 필드 bucket_id를 생성합니다.
9. Doris 테이블의 Rollup 메타데이터를 기반으로 RollupTree를 생성합니다.
10. RollupTree를 순회하며 계층별 집계 연산을 수행합니다. 다음 계층의 Rollup은 이전 계층의 Rollup에서 계산할 수 있습니다.
11. 각 집계 계산이 완료되면 bucket_id에 따라 데이터를 버킷으로 나누어 HDFS에 기록합니다.
12. 이후 Broker가 HDFS에서 파일을 가져와 Doris BE에 적재합니다.

#### Hive Bitmap UDF {#hive-bitmap-udf}

Spark는 Hive에서 생성한 Bitmap 데이터를 Doris에 직접 적재하는 기능을 지원합니다. 자세한 내용은 hive-bitmap-udf 문서를 참조하세요.

## 빠른 시작 {#quick-start}

- 파일에서 데이터 읽기

  - 대상 테이블 스키마

    ```sql
    CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
      c_int int(11) NULL,
      c_char char(15) NULL,
      c_varchar varchar(100) NULL,
      c_bool boolean NULL,
      c_tinyint tinyint(4) NULL,
      c_smallint smallint(6) NULL,
      c_bigint bigint(20) NULL,
      c_largeint largeint(40) NULL,
      c_float float NULL,
      c_double double NULL,
      c_decimal decimal(6, 3) NULL,
      c_decimalv3 decimal(6, 3) NULL,
      c_date date NULL,
      c_datev2 date NULL,
      c_datetime datetime NULL,
      c_datetimev2 datetime NULL
    )
    DISTRIBUTED BY HASH(c_int) BUCKETS 1
    PROPERTIES (
    "replication_num" = "1"
    )
    ```

  - 설정 파일 작성

    ```json
    {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-file",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "tbl_test_spark_load": {
          "type": "file",
          "paths": ["hdfs://hadoop:8020/data/data.txt"],
          "format": "csv",
          "fieldSep": ",", "columns":"c_int,c_char,c_varchar,c_bool,c_tinyint,c_smallint,c_bigint,c_largeint,c_float,c_double,c_decimal,c_decimalv3,c_date,c_datev2,c_datetime,c_datetimev2"
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.memory": "2G",
            "spark.executor.cores": 1,
            "spark.num.executor": 4
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
    }
    ```

  - Spark Load 작업 시작

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

  - 작업 실행 결과 확인

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-file | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

- Hive 테이블에서 데이터 읽기

    - Hive 테이블 스키마

      ```hive
      CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
        c_int int,
        c_char char,
        c_varchar varchar,
        c_bool boolean,
        c_tinyint tinyint,
        c_smallint smallint,
        c_bigint bigint,
        c_largeint largeint,
        c_float float,
        c_double double,
        c_decimal decimal(6, 3),
        c_decimalv3 decimal(6, 3),
        c_date date,
        c_datev2 date,
        c_datetime datetime,
        c_datetimev2 datetime
      )
      STORED AS TEXTFILE
      ```

    - 대상 테이블 스키마

      ```sql
      CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
        c_int int(11) NULL,
        c_char char(15) NULL,
        c_varchar varchar(100) NULL,
        c_bool boolean NULL,
        c_tinyint tinyint(4) NULL,
        c_smallint smallint(6) NULL,
        c_bigint bigint(20) NULL,
        c_largeint largeint(40) NULL,
        c_float float NULL,
        c_double double NULL,
        c_decimal decimal(6, 3) NULL,
        c_decimalv3 decimal(6, 3) NULL,
        c_date date NULL,
        c_datev2 date NULL,
        c_datetime datetime NULL,
        c_datetimev2 datetime NULL
      )
      DISTRIBUTED BY HASH(c_int) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```

    - 설정 파일 작성

      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-hive",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "tbl_test_spark_load": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "tbl_test_spark_load"
            }
          },
          "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```

    - Spark Load 작업 시작

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

    - 작업 실행 결과 확인

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-hive | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

## 참조 매뉴얼 {#reference-manual}

### Spark Load 클라이언트 {#spark-load-client}

#### 디렉터리 구조 {#directory-structure}

```text
├── app
│   └── spark-load-dpp-1.0-SNAPSHOT.jar
├── bin
│   └── spark-load.sh
└── lib
```

- **app**: spark dpp의 애플리케이션 패키지
- **bin**: spark load의 시작 스크립트
- **lib**: 기타 의존성 패키지

#### 시작 스크립트 매개변수 {#startup-script-parameters}

- `--config`|`-c`: 설정 파일 경로 지정
- `--recovery`|`-r`: 복구 모드로 시작할지 여부

### 데이터 적재 취소 {#cancel-import}

Spark Load 작업의 상태가 `CANCELLED` 또는 `FINISHED`가 아니면 수동으로 취소할 수 있습니다.

Spark Load 시작 스크립트의 프로세스를 종료하거나 Doris에서 `CANCEL LOAD` 명령을 실행하여 적재 작업을 취소할 수 있습니다.

`CANCEL LOAD`로 취소할 때는 취소할 적재 작업의 `Label`을 지정해야 합니다. `HELP CANCEL LOAD`를 실행하면 적재 취소 명령의 구문을 확인할 수 있습니다.

### 설정 매개변수 {#configuration-parameters}

#### 일반 설정 {#general-configuration}

| 매개변수 이름 | 필수 여부 | 기본값 | 설명                                                |
|-------------|------|-----|--------------------------------------------------------|
| feAddresses | 예  | -   | Doris FE HTTP 주소. 형식: fe_ip:http_port, [fe_ip:http_port] |
| label       | 예  | -   | 적재 작업 레이블                                       |
| user        | 예  | -   | Doris 사용자 이름                                         |
| password    | 예  | -   | Doris 비밀번호                                         |
| database    | 예  | -   | Doris 데이터베이스 이름                                    |
| workingDir  | 예  | -   | Spark Load 작업 경로                                |

#### 작업 설정 {#task-configuration}

| 매개변수 이름 | 하위 매개변수 -1 | 하위 매개변수 -2 | 필수 여부 | 기본값 | 설명                                       |
|-----------|-------|-------------------|------|-------|--------------------------------------------------|
| loadTasks |       |                   | 예  | -     | 적재 작업                                  |
|           | 대상 테이블 이름 |       | 예  | -     | 데이터를 적재할 Doris 테이블 이름           |
|           |       | type              | 예  | -     | 작업 유형: file - 파일 읽기 작업, hive - Hive 테이블 읽기 작업 |
|           |       | paths             | 예  | -     | 파일 경로 배열. 파일 읽기 작업(type=file)에만 유효 |
|           |       | format            | 예  | -     | 파일 유형. 지원 유형: csv, parquet, orc. 파일 읽기 작업(type=file)에만 유효 |
|           |       | fieldSep          | 아니요   | `\t`  | 컬럼 구분자. 파일 읽기 작업(type=file)에서 파일 유형이 csv(format=csv)인 경우에만 유효 |
|           |       | lineDelim         | 아니요   | `\n`  | 줄 구분자. 파일 읽기 작업(type=file)에서 파일 유형이 csv(format=csv)인 경우에만 유효 |
|           |       | hiveMetastoreUris | 예  | -     | Hive metastore 서비스 주소                   |
|           |       | hiveDatabase      | 예  | -     | Hive 데이터베이스 이름                               |
|           |       | hiveTable         | 예  | -     | Hive 테이블 이름                                  |
|           |       | columns           | 아니요   | 대상 테이블 컬럼 | 원본 데이터의 컬럼 이름. 파일 읽기 작업(type=file)에만 유효 |
|           |       | columnMappings    | 아니요   | -     | 컬럼 매핑                                  |
|           |       | where             | 아니요   | -     | 필터 조건                                 |
|           |       | targetPartitions  | 아니요   | -     | 데이터 적재 대상 파티션                         |

#### Spark 매개변수 설정 {#spark-parameter-configuration}

| 매개변수 이름 | 하위 매개변수 -1 | 필수 여부 | 기본값 | 설명                                     |
|--------|------------|------|--------|-------------------------------------------|
| spark  |            | 예  | -      | 적재 작업                           |
|        | sparkHome  | 예  | -      | Spark 배포 경로                     |
|        | master     | 예  | -      | Spark Master. 지원 유형: yarn, standalone, local |
|        | deployMode | 아니요   | client | Spark 배포 모드. 지원 유형: cluster, client |
|        | properties | 예  | -      | Spark 작업 속성                      |

#### Hadoop 매개변수 설정 {#hadoop-parameter-configuration}

| 매개변수 이름 | 필수 여부 | 기본값 | 설명                                 |
|--------- |---------| ------ | ----------------------------------------- |
| hadoop   | 예     | -      | HDFS 관련 설정과 Yarn 설정을 포함한 Hadoop 설정 |

#### 환경 매개변수 설정 {#environment-parameter-configuration}

| 매개변수 이름 | 필수 여부 | 기본값 | 설명 |
| -------- |--------| ------ | -------- |
| env      | 아니요     | -      | 환경 변수 |

## 데이터 적재 예제 {#import-examples}

### Bitmap 타입 데이터 적재 {#import-bitmap-type-data}

- 전역 딕셔너리를 구축하여 데이터 적재

    - Hive 테이블

      ```hive
      CREATE TABLE IF NOT EXISTS hive_t1
      (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid VARCHAR(100)
      )
      STORED AS TEXTFILE
      ```

    - Doris 테이블

      ```sql
      CREATE TABLE IF NOT EXISTS doris_t1 (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
      ) ENGINE=OLAP
      DUPLICATE KEY (k1)
      DISTRIBUTED BY HASH(k1) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```

    - 설정 파일

      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-bitmap-dict",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "doris_t1": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "hive_t1",
            "columnMappings": ["uuid=bitmap_dict(uuid)"]
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
            }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```


- Bitmap UDF로 처리한 Hive Binary 타입 데이터 적재

    - Hive 테이블

      ```hive
      CREATE TABLE IF NOT EXISTS hive_t1
      (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid VARCHAR(100)
      )
      STORED AS TEXTFILE
      ```

    - Doris 테이블
    
      ```sql
      CREATE TABLE IF NOT EXISTS doris_t1 (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
      ) ENGINE=OLAP
      DUPLICATE KEY (k1)
      DISTRIBUTED BY HASH(k1) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
      ```
    
    - 설정 파일
    
      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-bitmap-binary",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "doris_tb1": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "hive_t1",
            "columnMappings": ["uuid=binary_bitmap(uuid)"]
          }
        },
        "spark": {
          "sparkHome": "/opt/spark",
          "master": "yarn",
          "deployMode": "cluster",
          "properties": {
            "spark.executor.cores": "1",
            "spark.executor.memory": "2GB",
            "spark.executor.instances": "1"
          }
        },
        "hadoopProperties": {
          "fs.defaultFS": "hdfs://hadoop:8020",
          "hadoop.username": "hadoop"
        }
      }
      ```
