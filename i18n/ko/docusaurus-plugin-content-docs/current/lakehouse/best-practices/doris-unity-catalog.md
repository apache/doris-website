---
{
    "title": "Databricks Unity Catalog와의 통합",
    "language": "ko",
    "description": "기업이 Lakehouse 아키텍처에서 점점 늘어나는 데이터 자산을 관리함에 따라 커지는 크로스 플랫폼, 고성능에 대한 수요,"
}
---

기업이 Lakehouse 아키텍처에서 점점 늘어나는 데이터 자산을 관리하면서, 플랫폼 간 접근과 고성능, 거버넌스를 갖춘 데이터 접근 기능에 대한 요구가 더욱 시급해지고 있습니다. 차세대 실시간 분석 데이터베이스인 Apache Doris는 이제 [Databricks Unity Catalog](https://www.databricks.com/product/unity-catalog)와 긴밀하게 통합되어, 기업이 통합 거버넌스 프레임워크 아래에서 Databricks가 관리하는 데이터 레이크에 직접 접근하고 효율적으로 쿼리하여 원활한 데이터 연결을 구현할 수 있도록 지원합니다.

**이 문서에서는 다음 내용을 자세히 설명합니다:**

- Databricks 환경 설정: Databricks에서 External Location, Catalog, Iceberg 테이블을 생성하는 방법과 관련 권한 설정

- Doris와 Unity Catalog 연결: Doris를 Databricks Unity Catalog에 연결하고 Iceberg 테이블에 접근하는 방법

> 참고: 이 기능을 사용하려면 Doris 버전 3.1.3 이상이 필요합니다.

## Databricks 환경 설정 {#databricks-environment-setup}

### External Location 생성 {#creating-an-external-location}

Unity Catalog에서 [External Location](https://docs.databricks.com/aws/en/sql/language-manual/sql-ref-external-locations)은 클라우드 오브젝트 스토리지의 경로와 Storage Credentials를 연결하는 보안 객체입니다. External Location은 외부 접근을 지원하며, Unity Catalog는 Credential Vending 기능을 통해 외부 시스템에 단기 자격 증명을 발급하여 해당 경로에 접근할 수 있도록 합니다.

![unity1](/images/integrations/lakehouse/unity/unity-1.png)

이 문서에서는 AWS Quickstart를 사용하여 AWS S3에 External Location을 생성합니다.

![unity2](/images/integrations/lakehouse/unity/unity-2.png)

생성이 완료되면 External Catalog와 해당 Credential을 확인할 수 있습니다:

![unity3](/images/integrations/lakehouse/unity/unity-3.png)

### Catalog 생성 {#creating-a-catalog}

화면에서 Catalog 생성 옵션을 클릭합니다.

![unity4](/images/integrations/lakehouse/unity/unity-4.png)

Catalog 이름을 입력합니다. `Use default storage`의 선택을 해제하고 앞에서 생성한 External Location을 선택합니다.

![unity5](/images/integrations/lakehouse/unity/unity-5.png)

### External Use Schema 권한 활성화 {#enabling-external-use-schema-permissions}

새로 생성한 `Catalog` → `Permissions` → `Grant`를 차례로 클릭합니다:

![unity6](/images/integrations/lakehouse/unity/unity-6.png)

`All account users`를 선택하고 `EXTERNAL USE SCHEMA` 옵션을 체크합니다.

![unity7](/images/integrations/lakehouse/unity/unity-7.png)

### Iceberg 테이블 생성 및 데이터 삽입 {#creating-iceberg-tables-and-inserting-data}

Databricks SQL Editor에서 다음 SQL을 실행하여 Iceberg 테이블을 생성하고 데이터를 삽입합니다:

```sql
CREATE TABLE `my-unity-catalog`.default.iceberg_table (
  id int,
  name string
) USING iceberg;

INSERT INTO `my-unity-catalog`.default.iceberg_table VALUES(1, "jack");
```

### Access Token 발급 {#obtaining-access-token}

오른쪽 위의 사용자 아바타를 클릭하여 `Settings` 페이지로 이동한 다음, `Access tokens`를 선택합니다. 이 항목은 `User` → `Developer`에 있습니다. 이후 Doris를 Unity Catalog에 연결할 때 사용할 새 Token을 생성합니다. Token은 다음 형식의 문자열입니다: `dapi4f...`

## Doris와 Unity Catalog 연결 {#doris-connection-to-unity-catalog}

### Catalog 생성 {#creating-a-catalog-1}

```sql
-- Use oauth2 credential and vended credentials
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://dbc-xx.cloud.databricks.com:443/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.credential" = "clientid:clientsecret",
  "iceberg.rest.oauth2.server-uri" = "https://dbc-xx.cloud.databricks.com:443/oidc/v1/token",
  "iceberg.rest.oauth2.scope" = "all-apis",
  "iceberg.rest.vended-credentials-enabled" = "true"
);

-- Use PAT and vended credentials
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://<dbc-account>.cloud.databricks.com/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.token" = "<token>",
  "iceberg.rest.vended-credentials-enabled" = "true"
);

-- Use oauth2 credential and static ak/sk for accessing aws s3
CREATE CATALOG dbx_unity_catalog PROPERTIES (
  "uri" = "https://dbc-xx.cloud.databricks.com:443/api/2.1/unity-catalog/iceberg-rest/",
  "type" = "iceberg",
  "warehouse" = "my-unity-catalog",
  "iceberg.catalog.type" = "rest",
  "iceberg.rest.security.type" = "oauth2",
  "iceberg.rest.oauth2.credential" = "clientid:clientsecret",
  "iceberg.rest.oauth2.server-uri" = "https://dbc-xx.cloud.databricks.com:443/oidc/v1/token",
  "iceberg.rest.oauth2.scope" = "all-apis",
  "s3.endpoint" = "https://s3.<region>.amazonaws.com",
  "s3.access_key" = "<ak>",
  "s3.secret_key" = "<sk>",
  "s3.region" = "<region>"
);
```

### Catalog 접근 {#accessing-the-catalog}

Catalog를 생성하면 Unity Catalog에 저장된 Iceberg 테이블에 접근할 수 있습니다:

```sql
mysql> USE dbx_unity_catalog.`default`;
Database changed

mysql> SELECT * FROM iceberg_table;
+------+------+
| id   | name |
+------+------+
|    1 | jack |
+------+------+
1 row in set (3.32 sec)
```

### Iceberg 테이블 관리 {#managing-iceberg-tables}

Doris를 통해 Unity Catalog의 Iceberg 테이블을 직접 생성하고 관리하며 데이터를 쓸 수도 있습니다:

```sql
-- Write to existing table in Unity Catalog
INSERT INTO iceberg_table VALUES(2, "mary");

-- Create a partitioned table
CREATE TABLE partition_table (
  `ts` DATETIME COMMENT 'ts',
  `col1` BOOLEAN COMMENT 'col1',
  `pt1` STRING COMMENT 'pt1',
  `pt2` STRING COMMENT 'pt2'
)
PARTITION BY LIST (day(ts), pt1, pt2) ();

-- Insert data
INSERT INTO partition_table VALUES("2025-11-12", true, "foo", "bar");

-- View table partition information
SELECT * FROM partition_table$partitions\G
*************************** 1. row ***************************
                    partition: {"ts_day":"2025-11-12", "pt1":"foo", "pt2":"bar"}
                      spec_id: 0
                 record_count: 1
                   file_count: 1
total_data_file_size_in_bytes: 2552
 position_delete_record_count: 0
   position_delete_file_count: 0
 equality_delete_record_count: 0
   equality_delete_file_count: 0
              last_updated_at: 2025-11-18 15:20:45.964000
     last_updated_snapshot_id: 9024874735105617773
```

## 요약 {#summary}

Apache Doris는 Databricks Unity Catalog와의 긴밀한 통합을 통해 기업이 통합 거버넌스 프레임워크 아래에서 더 높은 성능과 더 낮은 비용으로 데이터 레이크의 핵심 자산에 접근하고 분석할 수 있도록 합니다. 이 기능은 Lakehouse 아키텍처의 전반적인 일관성을 높이는 동시에 실시간 분석, 대화형 쿼리, AI 활용에도 새로운 가능성을 열어줍니다. 데이터 팀, 분석 엔지니어, 플랫폼 아키텍트 모두 Doris를 활용하여 기존 데이터 레이크 기반 위에 더욱 민첩하고 지능적인 데이터 애플리케이션을 구축할 수 있습니다.
