---
{
    "title": "Kyuubi",
    "language": "ko",
    "description": "Apache Doris와 Apache Kyuubi를 연동하기 위한 종합 구성 가이드로, JDBC Engine 설정, MySQL 드라이버 설치, Thrift 프로토콜을 통한 쿼리 사용 방법을 다룹니다."
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Integrating Apache Kyuubi with Apache Doris as a JDBC data source -->

[Apache Kyuubi](https://kyuubi.apache.org/)는 Lakehouse에서 Serverless SQL을 제공하는 분산형 멀티 테넌트 게이트웨이입니다. Spark, Flink, Hive, JDBC 등의 엔진에 연결할 수 있으며, Thrift와 Trino 등의 인터페이스 프로토콜을 제공하여 다운스트림 애플리케이션이 유연하게 연동할 수 있도록 합니다. Apache Kyuubi는 JDBC Engine을 구현하고 Doris dialect를 지원하므로, Doris의 통합 액세스 게이트웨이로 사용하면서 고가용성, 서비스 검색, 테넌트 격리, 통합 인증, 수명 주기 관리 등의 기능을 제공할 수 있습니다.

## 사용 사례 {#use-cases}

- 서비스 검색과 고가용성을 제공하는 Doris 통합 액세스 게이트웨이가 필요한 경우.
- 멀티 테넌트 환경에서 테넌트 격리와 통합 인증이 필요한 경우.
- Thrift 프로토콜(HiveServer2 호환)을 통해 Doris에 액세스해야 하는 경우.
- Doris와 Spark, Flink, Hive 등의 엔진을 단일 Lakehouse 게이트웨이로 통합해야 하는 경우.

## 환경 요구 사항 {#environment-requirements}

| 항목                   | 요구 사항                                       |
| ---------------------- | ------------------------------------------------- |
| Apache Kyuubi 버전     | 1.6.0 이상                                       |
| Doris 액세스 포트      | FE MySQL 프로토콜 포트(기본값 `9030`)             |
| Kyuubi 수신 포트       | Thrift 프로토콜 포트(기본값 `10009`)              |
| 필수 드라이버          | MySQL JDBC 드라이버 `mysql-connector-j-8.x.x.jar` |

## 배포 단계 {#deployment-steps}

전체 절차는 다음과 같습니다.

1. Apache Kyuubi를 다운로드하고 압축을 풉니다.
2. Doris를 Kyuubi의 JDBC 데이터 소스로 구성합니다.
3. MySQL JDBC 드라이버를 추가합니다.
4. Kyuubi 서비스를 시작합니다.

### 1. Apache Kyuubi 다운로드 {#1-download-apache-kyuubi}

공식 웹사이트에서 Apache Kyuubi 1.6.0 이상의 설치 패키지를 다운로드하고 배포 디렉터리에 압축을 풉니다.

다운로드 URL: <https://kyuubi.apache.org/releases.html>

### 2. Doris를 Kyuubi 데이터 소스로 구성 {#2-configure-doris-as-a-kyuubi-data-source}

구성 파일 `$KYUUBI_HOME/conf/kyuubi-defaults.conf`를 수정하고 다음 내용을 추가합니다.

```properties
kyuubi.engine.type=jdbc
kyuubi.engine.jdbc.type=doris
kyuubi.engine.jdbc.driver.class=com.mysql.cj.jdbc.Driver
kyuubi.engine.jdbc.connection.url=jdbc:mysql://xxx:xxx
kyuubi.engine.jdbc.connection.user=***
kyuubi.engine.jdbc.connection.password=***
```

구성 항목 설명:

| 구성 항목                                | 설명                                                                                         |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| `kyuubi.engine.type`                     | 엔진 유형입니다. `jdbc`를 사용합니다.                                                         |
| `kyuubi.engine.jdbc.type`                | JDBC 서비스 유형입니다. 여기서는 `doris`를 지정합니다.                                       |
| `kyuubi.engine.jdbc.driver.class`        | JDBC 서비스에 연결하는 데 사용하는 드라이버 클래스 이름입니다. `com.mysql.cj.jdbc.Driver`를 사용합니다. |
| `kyuubi.engine.jdbc.connection.url`      | JDBC 서비스 연결 URL입니다. 여기에 Doris FE의 MySQL Server 주소를 지정합니다.                 |
| `kyuubi.engine.jdbc.connection.user`     | JDBC 서비스 사용자 이름입니다.                                                               |
| `kyuubi.engine.jdbc.connection.password` | JDBC 서비스 비밀번호입니다.                                                                  |

추가 관련 구성은 [Apache Kyuubi 구성 참조](https://kyuubi.readthedocs.io/en/master/configuration/settings.html)를 확인하세요.

### 3. MySQL 드라이버 추가 {#3-add-the-mysql-driver}

MySQL JDBC 드라이버 `mysql-connector-j-8.x.x.jar`를 `$KYUUBI_HOME/externals/engines/jdbc` 디렉터리에 복사합니다.

### 4. Kyuubi 서비스 시작 {#4-start-the-kyuubi-service}

다음 명령을 실행하여 Kyuubi를 시작합니다.

```shell
$KYUUBI_HOME/bin/kyuubi start
```

시작이 완료되면 Kyuubi는 기본적으로 포트 `10009`에서 수신 대기하며 Thrift 프로토콜을 통한 액세스를 제공합니다.

## 사용 예제 {#usage-example}

다음 예제에서는 Apache Kyuubi에 포함된 beeline 도구를 사용하여 Thrift 프로토콜을 통해 Doris 데이터를 쿼리하는 방법을 보여 줍니다.

### 1. 연결 설정 {#1-establish-a-connection}

beeline을 사용하여 Kyuubi 서비스에 연결합니다.

```shell
$KYUUBI_HOME/bin/beeline -u "jdbc:hive2://xxxx:10009/"
```

### 2. 쿼리 실행 {#2-execute-a-query}

쿼리 `select * from demo.example_tbl;`를 실행합니다. 예상 출력은 다음과 같습니다.

```shell
0: jdbc:hive2://xxxx:10009/> select * from demo.example_tbl;

2023-03-07 09:29:14.771 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: PENDING_STATE -> RUNNING_STATE, statement:
select * from demo.example_tbl
2023-03-07 09:29:14.786 INFO org.apache.kyuubi.operation.ExecuteStatement: Query[bdc59dd0-ceea-4c02-8c3a-23424323f5db] in FINISHED_STATE
2023-03-07 09:29:14.787 INFO org.apache.kyuubi.operation.ExecuteStatement: Processing anonymous's query[bdc59dd0-ceea-4c02-8c3a-23424323f5db]: RUNNING_STATE -> FINISHED_STATE, time taken: 0.015 seconds
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
| user_id  |    date     |   city    | age  | sex  |    last_visit_date     | cost  | max_dwell_time  | min_dwell_time  |
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
| 10000    | 2017-10-01  | Beijing   | 20   | 0    | 2017-10-01 07:00:00.0  | 70    | 10              | 2               |
| 10001    | 2017-10-01  | Beijing   | 30   | 1    | 2017-10-01 17:05:45.0  | 4     | 22              | 22              |
| 10002    | 2017-10-02  | Shanghai  | 20   | 1    | 2017-10-02 12:59:12.0  | 400   | 5               | 5               |
| 10003    | 2017-10-02  | Guangzhou | 32   | 0    | 2017-10-02 11:20:00.0  | 60    | 11              | 11              |
| 10004    | 2017-10-01  | Shenzhen  | 35   | 0    | 2017-10-01 10:00:15.0  | 200   | 3               | 3               |
| 10004    | 2017-10-03  | Shenzhen  | 35   | 0    | 2017-10-03 10:20:22.0  | 22    | 6               | 6               |
+----------+-------------+-----------+------+------+------------------------+-------+-----------------+-----------------+
6 rows selected (0.068 seconds)
```
