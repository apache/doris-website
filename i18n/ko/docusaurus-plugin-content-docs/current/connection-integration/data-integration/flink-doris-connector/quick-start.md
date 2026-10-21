---
{
    "title": "빠른 시작",
    "language": "ko",
    "description": "Flink 클러스터를 배포하고 Flink Doris Connector를 사용하여 FlinkSQL로 Doris 테이블의 데이터를 읽고 씁니다."
}
---

# 빠른 시작 {#quick-start}

이 페이지에서는 Flink 클러스터 배포부터 FlinkSQL을 사용한 Doris 데이터 읽기와 쓰기까지 전체 과정을 예제로 설명합니다. 시작하기 전에 [버전 정보](./overview.md#version-notes)를 참고하여 Flink 및 Doris 버전과 호환되는 Connector 릴리스를 선택하고, [설치](./overview.md#installation)에 설명된 방법으로 Jar 패키지를 준비합니다.

## 1. Flink 클러스터 배포 {#1-deploy-a-flink-cluster}

Standalone 클러스터를 예로 들어 설명합니다:

1. [Flink 1.18.1](https://archive.apache.org/dist/flink/flink-1.18.1/flink-1.18.1-bin-scala_2.12.tgz) 설치 패키지를 다운로드합니다.
2. 압축을 푼 다음 Flink Doris Connector Jar 패키지를 `<FLINK_HOME>/lib`에 넣습니다.
3. `<FLINK_HOME>` 디렉터리로 이동하여 `bin/start-cluster.sh`를 실행해 Flink 클러스터를 시작합니다.
4. `jps` 명령으로 Flink 클러스터가 정상적으로 시작되었는지 확인합니다.

## 2. Doris 테이블 초기화 {#2-initialize-the-doris-table}

다음 SQL을 실행하여 Doris 테이블을 생성하고 테스트 데이터를 씁니다:

```sql
CREATE DATABASE test;

CREATE TABLE test.student (
    `id` INT,
    `name` VARCHAR(256),
    `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

INSERT INTO test.student values(1, "James", 18);
INSERT INTO test.student values(2, "Emily", 28);

CREATE TABLE test.student_trans (
    `id` INT,
    `name` VARCHAR(256),
    `age` INT
)
UNIQUE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);
```

## 3. FlinkSQL 작업 실행 {#3-run-a-flinksql-job}

FlinkSQL Client를 시작합니다:

```shell
bin/sql-client.sh
```

다음 FlinkSQL을 실행합니다:

```sql
CREATE TABLE Student (
    id STRING,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student',
    'username' = 'root',
    'password' = ''
);

CREATE TABLE StudentTrans (
    id STRING,
    name STRING,
    age INT
)
WITH (
    'connector' = 'doris',
    'fenodes' = '127.0.0.1:8030',
    'table.identifier' = 'test.student_trans',
    'username' = 'root',
    'password' = '',
    'sink.label-prefix' = 'doris_label'
);

INSERT INTO StudentTrans SELECT id, concat('prefix_', name), age + 1 FROM Student;
```

## 4. 결과 쿼리 {#4-query-the-result}

```text
mysql> select * from test.student_trans;
+------+--------------+------+
| id   | name         | age  |
+------+--------------+------+
|    1 | prefix_James |   19 |
|    2 | prefix_Emily |   29 |
+------+--------------+------+
2 rows in set (0.02 sec)
```

## 다음 단계 {#next-steps}

- [Doris에서 데이터 읽기](./read.md) 및 [Doris에 데이터 쓰기](./write.md): 읽기 프로토콜, 쓰기 모드 및 관련 옵션을 알아봅니다.
- [전체 데이터베이스 동기화](./cdc-sync.md): 명령 하나로 MySQL 및 기타 데이터베이스를 Doris에 동기화합니다.
