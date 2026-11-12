---
{
    "title": "릴리스 1.2.0",
    "language": "ko",
    "description": "표준 ssb-100-flat 벤치마크에서 1.2의 성능은 1.1보다 2배 빠르며, 복잡한 TPCH 100 벤치마크에서는,"
}
---

# 기능 {#feature}
## 주요 기능 {#highlight}

1. 벡터화 엔진 전면 지원으로 성능 대폭 향상

	표준 ssb-100-flat 벤치마크에서 1.2의 성능은 1.1보다 2배 빠르며, 복잡한 TPCH 100 벤치마크에서는 1.2가 1.1보다 3배 빠릅니다.

2. Merge-on-Write Unique Key

	Unique Key 모델에서 Merge-on-Write를 지원합니다. 데이터를 쓸 때 삭제하거나 업데이트해야 하는 데이터를 표시하므로, 쿼리 시 Merge-on-Read에 따른 오버헤드를 피하고 업데이트 가능한 데이터 모델의 읽기 효율을 크게 높입니다.

3. Multi Catalog

	Multi Catalog 기능을 사용하면 Doris에서 외부 데이터 소스에 빠르게 접근할 수 있습니다. 사용자는 `CREATE CATALOG` 명령으로 외부 데이터 소스에 연결할 수 있습니다. Doris는 외부 데이터 소스의 데이터베이스와 테이블 정보를 자동으로 매핑합니다. 이후에는 일반 테이블에 접근하듯 외부 데이터 소스의 데이터에 접근할 수 있습니다. 따라서 테이블마다 외부 매핑을 수동으로 설정하는 번거로움이 없습니다.

    현재 지원하는 데이터 소스는 다음과 같습니다.

    1. Hive Metastore: Hive, Iceberg, Hudi 테이블에 접근할 수 있습니다. Alibaba Cloud의 DataLake Formation처럼 Hive Metastore와 호환되는 데이터 소스에도 연결할 수 있습니다. HDFS와 객체 스토리지의 데이터 접근을 모두 지원합니다.
    2. Elasticsearch: ES 데이터 소스에 접근합니다.
    3. JDBC: JDBC 프로토콜을 통해 MySQL에 접근합니다.

    문서: https://doris.apache.org//docs/dev/lakehouse/multi-catalog)

    > 참고: 해당 권한 수준도 자동으로 변경됩니다. 자세한 내용은 "업그레이드 참고 사항" 절을 참조하세요.

4. 간편한 테이블 구조 변경

새 버전에서는 데이터 테이블에 열을 추가하거나 삭제할 때 데이터 파일을 동기적으로 변경할 필요가 없습니다. FE의 메타데이터만 업데이트하면 되므로 밀리초 단위의 Schema Change 작업이 가능합니다. 이 기능을 통해 업스트림 CDC 데이터의 DDL을 동기화할 수 있습니다. 예를 들어 Flink CDC를 사용해 업스트림 데이터베이스의 DML과 DDL을 Doris로 동기화할 수 있습니다.

문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE

테이블을 생성할 때 속성에 `"light_schema_change"="true"`를 설정하세요.

5. JDBC 인터페이스

	사용자는 JDBC를 통해 외부 데이터 소스에 연결할 수 있습니다. 현재 지원하는 데이터 소스는 다음과 같습니다.

	  - MySQL
	  - PostgreSQL
	  - Oracle
	  - SQL Server
	  - Clickhouse

	문서: [https://doris.apache.org/en/docs/dev/lakehouse/multi-catalog/jdbc](https://doris.apache.org/docs/dev/lakehouse/multi-catalog/jdbc/)

	> 참고: ODBC 기능은 이후 버전에서 제거될 예정이므로 JDBC로 전환하세요.

6. JAVA UDF

	Java로 UDF/UDAF를 작성할 수 있어 Java 생태계의 사용자 정의 함수를 편리하게 활용할 수 있습니다. 또한 off-heap 메모리와 Zero Copy 등의 기술을 통해 언어 간 데이터 접근 효율을 크게 높였습니다.

	문서: https://doris.apache.org//docs/dev/ecosystem/udf/java-user-defined-function

	예제: https://github.com/apache/doris/tree/master/samples/doris-demo

7. Remote UDF

	RPC를 통해 원격 사용자 정의 함수 서비스에 접근할 수 있으므로 UDF 작성에 사용할 수 있는 언어의 제약이 사라집니다. 사용자는 어떤 프로그래밍 언어로든 사용자 정의 함수를 구현해 복잡한 데이터 분석 작업을 수행할 수 있습니다.

	문서: https://doris.apache.org//docs/ecosystem/udf/remote-user-defined-function

	예제: https://github.com/apache/doris/tree/master/samples/doris-demo

8. 더 많은 데이터 타입 지원

	- Array 타입

		Array 타입과 중첩 Array 타입을 지원합니다. 사용자 프로필이나 태그와 같은 시나리오에서 Array 타입을 사용하면 비즈니스 요구에 더 잘 대응할 수 있습니다. 새 버전에서는 실제 사용 사례에서 데이터 타입을 더 잘 활용할 수 있도록 데이터 관련 함수도 다수 구현했습니다.

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Types/ARRAY

	관련 함수: https://doris.apache.org//docs/dev/sql-manual/sql-functions/array-functions/array_max

	- Jsonb 타입

		바이너리 JSON 데이터 타입인 Jsonb를 지원합니다. 이 타입은 더 압축된 JSON 인코딩 형식을 제공하며, 인코딩된 상태에서 데이터에 접근할 수도 있습니다. 문자열로 저장한 JSON 데이터와 비교해 효율을 몇 배 높일 수 있습니다.

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Types/JSONB

	관련 함수: https://doris.apache.org//docs/dev/sql-manual/sql-functions/json-functions/jsonb_parse

	- Date V2

		영향 범위:

		1. 테이블을 생성할 때 사용자가 datev2와 datetimev2를 지정해야 합니다. 기존 테이블의 date와 datetime은 영향을 받지 않습니다.
		2. datev2 및 datetimev2를 기존 date 및 datetime과 함께 연산할 때(예: 동등 조인) 기존 타입이 새 타입으로 변환된 후 연산됩니다.
		3. 예제는 문서를 참조하세요.

		문서: https://doris.apache.org/docs/1.2/sql-manual/sql-reference/Data-Types/DATEV2


## 기타 기능 {#more}

1. 새로운 메모리 관리 프레임워크

	문서: https://doris.apache.org//docs/dev/admin-manual/maint-monitor/memory-management/memory-tracker

2. 테이블 반환 함수

	Doris는 테이블 반환 함수(Table Valued Function, TVF)를 제공합니다. TVF는 일반 테이블처럼 취급할 수 있으며, SQL에서 테이블을 사용할 수 있는 모든 위치에 사용할 수 있습니다.

	예를 들어 S3 TVF를 사용하면 객체 스토리지의 데이터를 가져올 수 있습니다.

	```
	insert into tbl select * from s3("s3://bucket/file.*", "ak" = "xx", "sk" = "xxx") where c1 > 2;
	```

	또는 HDFS의 데이터 파일을 직접 쿼리할 수 있습니다.

	```
	insert into tbl select * from hdfs("hdfs://bucket/file.*") where c1 > 2;
	```

	TVF를 사용하면 SQL의 풍부한 표현력을 충분히 활용하여 다양한 데이터를 유연하게 처리할 수 있습니다.

    문서:

    https://doris.apache.org//docs/dev/sql-manual/sql-functions/table-functions/s3

    https://doris.apache.org//docs/dev/sql-manual/sql-functions/table-functions/hdfs

3. 더 편리한 파티션 생성

	`FROM TO` 명령으로 지정한 시간 범위에 여러 파티션을 생성할 수 있습니다.

4. 열 이름 변경

	Light Schema Change가 활성화된 테이블에서 열 이름을 변경할 수 있습니다.

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Alter/ALTER-TABLE-RENAME

5. 확장된 권한 관리

	- 행 수준 권한 지원

		`CREATE ROW POLICY` 명령으로 행 수준 권한을 생성할 수 있습니다.

		문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-POLICY

	- 비밀번호 강도와 만료 시간 등을 지정할 수 있습니다.

	- 로그인에 여러 번 실패하면 계정을 잠글 수 있습니다.

		문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Account-Management-Statements/ALTER-USER

6. 데이터 가져오기

	- CSV 데이터 가져오기에서 헤더가 있는 csv 파일을 지원합니다.

		문서에서 `csv_with_names` 검색: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD/

	- Stream Load에 `hidden_columns`가 추가되어 삭제 플래그 열과 시퀀스 열을 명시적으로 지정할 수 있습니다.

		문서에서 `hidden_columns` 검색: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/STREAM-LOAD

	- Spark Load에서 Parquet 및 ORC 파일 가져오기를 지원합니다.

	- 완료된 데이터 가져오기 작업의 Label을 정리할 수 있습니다.

	  문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/CLEAN-LABEL

	- 상태에 따라 데이터 가져오기 작업을 일괄 취소할 수 있습니다.

		문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Load/CANCEL-LOAD

	- Broker Load에 Alibaba Cloud oss, Tencent Cloud cos/chdfs, Huawei Cloud obs 지원이 추가되었습니다.

		문서: https://doris.apache.org//docs/dev/advanced/broker

	- hive-site.xml 파일 설정을 통해 HDFS에 접근할 수 있습니다.

		문서: https://doris.apache.org//docs/dev/admin-manual/config/config-dir

7. `SHOW CATALOG RECYCLE BIN` 기능으로 Catalog 휴지통의 내용을 확인할 수 있습니다.

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Show-Statements/SHOW-CATALOG-RECYCLE-BIN

8. `SELECT * EXCEPT` 구문을 지원합니다.

	문서: https://doris.apache.org//docs/dev/data-table/basic-usage

9. OUTFILE에서 ORC 형식 내보내기와 멀티바이트 구분자를 지원합니다.

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/OUTFILE

10. 설정을 통해 저장할 수 있는 Query Profile의 수를 변경할 수 있습니다.

	문서에서 FE 설정 항목 검색: max_query_profile_num

11. DELETE 문에서 IN 조건자와 파티션 프루닝을 지원합니다.

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Manipulation-Statements/Manipulation/DELETE

12. 시간 열의 기본값으로 `CURRENT_TIMESTAMP`를 사용할 수 있습니다.

	문서에서 "CURRENT_TIMESTAMP" 검색: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE

13. 시스템 테이블 backends와 rowsets 추가

	문서:

	https://doris.apache.org//docs/dev/admin-manual/system-table/backends

	https://doris.apache.org//docs/dev/admin-manual/system-table/rowsets

14. 백업 및 복원

	- Restore 작업에서 `reserve_replica` 매개변수를 지원하므로 복원된 테이블의 복제본 수를 백업과 동일하게 유지할 수 있습니다.

	- Restore 작업에서 `reserve_dynamic_partition_enable` 매개변수를 지원하므로 복원된 테이블의 동적 파티션 활성화 상태를 유지할 수 있습니다.

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Backup-and-Restore/RESTORE

	- 내장 libhdfs를 통한 백업 및 복원을 지원하므로 broker에 의존할 필요가 없습니다.

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Backup-and-Restore/CREATE-REPOSITORY

15. 동일한 머신의 여러 디스크 간 데이터 균형 조정 지원

	문서:

	https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-REBALANCE-DISK

	https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-CANCEL-REBALANCE-DISK

16. Routine Load에서 Kerberos 인증을 사용하는 Kafka 서비스를 구독할 수 있습니다.

	문서에서 kerberos 검색: https://doris.apache.org//docs/dev/data-operate/import/import-way/routine-load-manual

17. 새로운 내장 함수

	다음 내장 함수가 추가되었습니다.

	- `cbrt`
	- `sequence_match/sequence_count`
	- `mask/mask_first_n/mask_last_n`
	- `elt`
	- `any/any_value`
	- `group_bitmap_xor`
	- `ntile`
	- `nvl`
	- `uuid`
	- `initcap`
	- `regexp_replace_one/regexp_extract_all`
	- `multi_search_all_positions/multi_match_any`
	- `domain/domain_without_www/protocol`
	- `running_difference`
	- `bitmap_hash64`
	- `murmur_hash3_64`
	- `to_monday`
	- `not_null_or_empty`
	- `window_funnel`
	- `group_bit_and/group_bit_or/group_bit_xor`
	- `outer combine`
	- 모든 array 함수

# 업그레이드 참고 사항 {#upgrade-notice}

## 알려진 문제 {#known-issues}

- JDK11을 사용하면 BE가 충돌하므로 JDK8을 사용하세요.

## 동작 변경 사항 {#behavior-changed}

- 권한 수준 변경

	Catalog 수준이 도입됨에 따라 사용자 권한 수준도 자동으로 변경됩니다. 규칙은 다음과 같습니다.

	- GlobalPrivs와 ResourcePrivs는 변경되지 않습니다.
	- CatalogPrivs 수준이 추가됩니다.
	- 기존 DatabasePrivs 수준에 internal 접두사가 추가됩니다(internal Catalog의 db를 나타냄).
	- 기존 TablePrivs 수준에 internal 접두사가 추가됩니다(internal Catalog의 tbl을 나타냄).

- GroupBy 및 Having 절에서는 별칭보다 열 이름을 우선하여 일치시킵니다. (#14408)

- `mv_`로 시작하는 열은 더 이상 생성할 수 없습니다. `mv_`는 구체화된 뷰에서 예약어입니다. (#14361)

- order by 문에 적용되던 기본 65535행 제한이 제거되었습니다. 이 제한을 설정할 수 있도록 세션 변수 `default_order_by_limit`가 추가되었습니다. (#12478)

- "Create Table As Select"로 생성한 테이블에서는 모든 문자열 열에 string 타입을 일관되게 사용하며, varchar/char/string을 더 이상 구분하지 않습니다. (#14382)

- 감사 로그의 db 이름과 사용자 이름 앞에서 `default_cluster`를 제거합니다. (#13499) (#11408)

- 감사 로그에 SQL digest 필드를 추가합니다. (#8919)

- union 절의 order by 처리 방식이 변경됩니다. 새 버전에서는 괄호로 명시적으로 연결하지 않는 한 union이 실행된 후 order by 절이 실행됩니다. (#9745)

- 사용 중단 처리 작업에서는 휴지통에 있는 tablet을 무시하여 작업을 완료할 수 있도록 합니다. (#14028)

- Decimal 반환 결과는 원래 열에 선언된 정밀도 또는 cast 함수에 지정된 정밀도에 따라 표시됩니다. (#13437)

- 열 이름 길이 제한이 64에서 256으로 변경되었습니다. (#14671)

- FE 설정 항목 변경

  - `enable_vectorized_load` 매개변수가 기본적으로 활성화됩니다. (#11833)

  - `create_table_timeout` 값이 증가했습니다. 테이블 생성 작업의 기본 제한 시간이 늘어납니다. (#13520)

  - `stream_load_default_timeout_second`의 기본값이 3일로 변경되었습니다.

  - `alter_table_timeout_second`의 기본값이 한 달로 변경되었습니다.

  - alter 작업에 참여하는 복제본 수를 제한하는 `max_replica_count_when_schema_change` 매개변수가 추가되었으며, 기본값은 100000입니다. (#12850)

  - `disable_iceberg_hudi_table`이 추가되었습니다. Iceberg 및 Hudi 외부 테이블은 기본적으로 비활성화되며 Multi Catalog 기능 사용을 권장합니다. (#13932)

- BE 설정 항목 변경

  - `disable_stream_load_2pc` 매개변수가 제거되었습니다. 2PC Stream Load를 직접 사용할 수 있습니다. (#13520)

  - `tablet_rowset_stale_sweep_time_sec`가 1800초에서 300초로 변경되었습니다.

  - compaction 관련 설정 항목의 이름이 다시 설계되었습니다. (#13495)

  - 메모리 최적화 관련 매개변수를 재검토했습니다. (#13781)

- 세션 변수 변경

   - `enable_insert_strict` 변수의 기본값이 true로 변경되었습니다. 이에 따라 이전에는 실행할 수 있었지만 잘못된 값을 삽입하던 일부 insert 작업이 더 이상 실행되지 않습니다. (11866)

   - `enable_local_exchange` 변수의 기본값이 true로 변경되었습니다. (#13292)

   - 데이터 전송 시 기본적으로 lz4 압축을 사용하며, `fragment_transmission_compression_codec` 변수로 제어할 수 있습니다. (#11955)

   - unique 또는 agg 모델의 데이터 디버깅을 위해 `skip_storage_engine_merge` 변수가 추가되었습니다. (#11952)

     문서: https://doris.apache.org//docs/dev/advanced/variables

- BE 시작 스크립트는 `/proc/sys/vm/max_map_count`의 값이 200W보다 큰지 확인합니다. 그렇지 않으면 시작에 실패합니다. (#11052)

- mini load 인터페이스가 제거되었습니다. (#10520)

- FE 메타데이터 버전

	FE Meta Version이 107에서 114로 변경되었으며, 업그레이드 후에는 롤백할 수 없습니다.

## 업그레이드 중 {#during-upgrade}

1. 업그레이드 준비

   - lib 및 bin 디렉터리를 교체해야 합니다(시작/중지 스크립트가 변경됨).

   - BE에도 JAVA_HOME을 설정해야 하며, BE는 이미 JDBC Table과 Java UDF를 지원합니다.

   - fe.conf의 기본 JVM Xmx 매개변수가 8GB로 변경되었습니다.

2. 업그레이드 중 발생할 수 있는 오류

   - repeat 함수를 사용할 수 없고 `vectorized repeat function cannot be executed` 오류가 보고될 수 있습니다. 업그레이드 전에 벡터화 실행 엔진을 끌 수 있습니다. (#13868)

   - schema change가 `desc_tbl is not set. Maybe the FE version is not equal to the BE` 오류와 함께 실패할 수 있습니다. (#13822)

   - 벡터화 hash join을 사용할 수 없고 `vectorized hash join cannot be executed` 오류가 보고될 수 있습니다. 업그레이드 전에 벡터화 실행 엔진을 끌 수 있습니다. (#13753)

	전체 업그레이드를 마치면 위 오류는 해결됩니다.

## 성능 영향 {#performance-impact}

- 새 버전에서는 BE의 메모리 할당자로 기본적으로 JeMalloc을 사용하며 TcMalloc을 대체합니다. (#13367)

- tablet sink의 배치 크기가 최소 8K로 변경되었습니다. (#13912)

- chunk allocator가 기본적으로 비활성화됩니다. (#13285)

## API 변경 {#api-change}

- BE의 http api 오류 반환 정보가 `{"status": "Fail", "msg": "xxx"}`에서 더 구체적인 ``{"status": "Not found", "msg": "Tablet not found. tablet_id=1202"}``로 변경되었습니다. (#9771)

- `SHOW CREATE TABLE`에서 comment 내용의 따옴표가 큰따옴표에서 작은따옴표로 변경되었습니다. (#10327)

- 일반 사용자도 http 명령으로 Query Profile을 가져올 수 있습니다. (#14016)
문서: https://doris.apache.org//docs/dev/admin-manual/http-actions/fe/manager/query-profile-action

- 시퀀스 열을 지정하는 방식이 개선되어 열 이름을 직접 지정할 수 있습니다. (#13872)
문서: https://doris.apache.org//docs/dev/data-operate/update-delete/sequence-column-manual

- `show backends` 및 `show tablets`의 반환 결과에 원격 스토리지 공간 사용량이 추가되었습니다. (#11450)

- Num-Based Compaction 관련 코드가 제거되었습니다. (#13409)

- BE의 오류 코드 메커니즘이 재구성되어 일부 반환 오류 메시지가 변경됩니다. (#8855)
기타

- 공식 Docker 이미지를 지원합니다.

- MacOS(x86/M1) 및 ubuntu-22.04에서 Doris 컴파일을 지원합니다.
  문서: https://doris.apache.org//docs/dev/install/source-install/compilation-mac/

- 이미지 파일 검증을 지원합니다.

  문서: https://doris.apache.org//docs/dev/admin-manual/maint-monitor/metadata-operation/

- 스크립트 관련 변경 사항

  - FE와 BE의 중지 스크립트에서 `--grace` 매개변수를 사용해 FE와 BE를 종료할 수 있습니다(kill -9 대신 kill -15 신호 사용).

  - FE 시작 스크립트에서 --version을 사용해 현재 FE 버전을 확인할 수 있습니다. (#11563)

 - 로컬에서 문제를 디버깅할 수 있도록 `ADMIN COPY TABLET` 명령으로 tablet의 데이터와 관련 테이블 생성문을 가져올 수 있습니다. (#12176)

	문서: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Database-Administration-Statements/ADMIN-COPY-TABLET

- 로컬에서 문제를 재현할 수 있도록 http api를 통해 SQL 문과 관련된 테이블 생성문을 가져올 수 있습니다. (#11979)

	문서: https://doris.apache.org//docs/dev/admin-manual/http-actions/fe/query-schema-action

- 테스트 목적으로 테이블을 생성할 때 해당 테이블의 compaction 기능을 끌 수 있습니다. (#11743)

	문서에서 "disble_auto_compaction" 검색: https://doris.apache.org//docs/dev/sql-manual/sql-reference/Data-Definition-Statements/Create/CREATE-TABLE

# 감사의 말씀 {#big-thanks}

이번 릴리스에 기여해 주신 모든 분께 감사드립니다! (알파벳순)
```
@924060929
@a19920714liou
@adonis0147
@Aiden-Dong
@aiwenmo
@AshinGau
@b19mud
@BePPPower
@BiteTheDDDDt
@bridgeDream
@ByteYue
@caiconghui
@CalvinKirs
@cambyzju
@caoliang-web
@carlvinhust2012
@catpineapple
@ccoffline
@chenlinzhong
@chovy-3012
@coderjiang
@cxzl25
@dataalive
@dataroaring
@dependabot[bot]
@dinggege1024
@DongLiang-0
@Doris-Extras
@eldenmoon
@EmmyMiao87
@englefly
@FreeOnePlus
@Gabriel39
@gaodayue
@geniusjoe
@gj-zhang
@gnehil
@GoGoWen
@HappenLee
@hello-stephen
@Henry2SS
@hf200012
@huyuanfeng2018
@jacktengg
@jackwener
@jeffreys-cat
@Jibing-Li
@JNSimba
@Kikyou1997
@Lchangliang
@LemonLiTree
@lexoning
@liaoxin01
@lide-reed
@link3280
@liutang123
@liuyaolin
@LOVEGISER
@lsy3993
@luozenglin
@luzhijing
@madongz
@morningman
@morningman-cmy
@morrySnow
@mrhhsg
@Myasuka
@myfjdthink
@nextdreamblue
@pan3793
@pangzhili
@pengxiangyu
@platoneko
@qidaye
@qzsee
@SaintBacchus
@SeekingYang
@smallhibiscus
@sohardforaname
@song7788q
@spaces-X
@ssusieee
@stalary
@starocean999
@SWJTU-ZhangLei
@TaoZex
@timelxy
@Wahno
@wangbo
@wangshuo128
@wangyf0555
@weizhengte
@weizuo93
@wsjz
@wunan1210
@xhmz
@xiaokang
@xiaokangguo
@xinyiZzz
@xy720
@yangzhg
@Yankee24
@yeyudefeng
@yiguolei
@yinzhijian
@yixiutt
@yuanyuan8983
@zbtzbtzbt
@zenoyang
@zhangboya1
@zhangstar333
@zhannngchen
@ZHbamboo
@zhengshiJ
@zhenhb
@zhqu1148980644
@zuochunwei
@zy-kkk
```
