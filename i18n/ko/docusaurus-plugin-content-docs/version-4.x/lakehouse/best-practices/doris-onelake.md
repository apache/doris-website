---
{
    "title": "Microsoft OneLake 통합",
    "language": "ko",
    "description": "Fabric 에코시스템의 일부인 Microsoft OneLake는 조직에 중앙화된 논리적 데이터를 제공하는 통합형 개방형 SaaS 데이터 레이크입니다. "
}
---

**Microsoft OneLake**는 Fabric 에코시스템에 속한 통합형 개방형 SaaS 데이터 레이크로, 조직에 중앙화된 논리적 데이터 저장 계층을 제공합니다. OneLake의 데이터는 **Parquet** 형식으로 저장되며, **Delta Lake**와 **Apache Iceberg** 메타데이터를 동시에 유지할 수 있습니다. 이러한 설계 덕분에 여러 분석 엔진이 **데이터를 복제하거나 마이그레이션하지 않고도** 공유 데이터 세트에 직접 접근할 수 있어 데이터 관리와 거버넌스가 크게 간소화됩니다.

**Apache Doris의 Iceberg REST Catalog**를 사용하면 OneLake에 저장된 데이터를 복사하거나 이동하지 않고 직접 쿼리하고 분석할 수 있습니다.

이 통합을 통해 OneLake의 통합 스토리지 및 거버넌스 기능과 Doris의 고성능 분석 처리 역량을 결합하여 단일 데이터 레이크에서 **엔드투엔드 분석 파이프라인**을 구축할 수 있습니다.

기술적으로 Doris는 개방형 테이블 형식과 표준화된 인터페이스를 통해 OneLake와 상호 작용하며 메타데이터와 Parquet 파일에 모두 접근합니다. 이 아키텍처는 중앙화된 거버넌스, 액세스 제어, 보안 정책을 유지하여 플랫폼의 안정성, 확장성, 유지보수성을 보장합니다.

이 글에서는 환경 설정, 인증, 쿼리 워크플로 예제를 포함하여 Doris를 OneLake에 연결하는 방법을 단계별로 안내합니다.

> Doris 버전 3.1.4+가 필요합니다.

## OneLake 설정 {#onelake-setup}

먼저 **Fabric (OneLake)** 측에서 데이터와 인증 설정을 준비한 다음, 해당 데이터에 접근할 수 있도록 Doris에서 **Iceberg REST Catalog**를 생성하는 방법을 살펴보겠습니다.

### OneLake에 데이터 적재 {#load-data-into-onelake}

1. **Microsoft Fabric** 콘솔을 열고 **작업 영역**을 새로 만듭니다(일부 설정이 제한될 수 있으므로 기본 작업 영역은 *사용하지 않는* 것이 좋습니다).

   ![onelake1](/images/integrations/lakehouse/onelake/onelake-1.png)

2. 작업 영역에서 **새 항목 → Lakehouse**를 선택하여 Lakehouse 인스턴스를 생성합니다.

   ![onelake2](/images/integrations/lakehouse/onelake/onelake-2.png)

3. **작업 영역 설정**으로 이동하여 Lakehouse 기능을 활성화하는 데 필요한 기능 토글을 켭니다.

   ![onelake3](/images/integrations/lakehouse/onelake/onelake-3.png)

### 로컬 파일 업로드 {#upload-local-files}

예시에서는 로컬 CSV 파일을 OneLake에 직접 업로드합니다. 다음은 예제 파일입니다:

![onelake4](/images/integrations/lakehouse/onelake/onelake-4.png)

1. 작업 영역의 **파일** 섹션으로 이동하여 **업로드 → 파일 업로드**를 클릭하고 CSV 파일을 선택합니다.

   ![onelake5](/images/integrations/lakehouse/onelake/onelake-5.png)

2. 업로드 후 **테이블 데이터 적재 → 새 테이블**을 선택합니다(이미 테이블이 있다면 기존 테이블에 데이터를 적재할 수도 있습니다).

3. 가져오기가 완료되면 **테이블** 뷰로 이동하여 테이블과 데이터를 확인합니다.

   ![onelake6](/images/integrations/lakehouse/onelake/onelake-6.png)

### 인증 설정 {#authentication-setup}

Doris가 Iceberg REST Catalog를 통해 OneLake에 접근할 수 있도록 Azure 포털에서 **애플리케이션 등록 및 권한**을 설정해야 합니다:

1. **Azure Portal → 앱 등록 → 새 등록**을 열고, 나중에 사용할 다음 값을 기록해 둡니다:

   * 애플리케이션(클라이언트) ID

   * 디렉터리(테넌트) ID

   ![onelake7](/images/integrations/lakehouse/onelake/onelake-7.png)

* **API 권한**에서 **Azure Storage**에 필요한 권한을 추가합니다(최소 권한 원칙을 따릅니다).

  ![onelake8](/images/integrations/lakehouse/onelake/onelake-8.png)

* **인증서 및 비밀**에서 **클라이언트 암호**를 생성하고 해당 값을 안전하게 보관합니다. 페이지를 벗어나면 해당 값이 표시되지 않습니다.

  ![onelake9](/images/integrations/lakehouse/onelake/onelake-9.png)

* **Fabric 작업 영역 → 액세스 관리**로 돌아가 등록한 앱을 표시 이름으로 찾아 액세스 주체로 추가합니다.

  ![onelake10](/images/integrations/lakehouse/onelake/onelake-10.png)

이 단계를 모두 완료하면 OneLake 데이터와 인증 설정이 준비됩니다.

## Apache Doris에서 OneLake 연결 {#connecting-onelake-from-apache-doris}

다음으로 Doris에서 **Iceberg REST Catalog**를 생성하고 OneLake 데이터에 연결해 보겠습니다.

### Catalog 생성 {#create-catalog}

```sql
Doris> CREATE CATALOG onelake_doris PROPERTIES (
            'type' = 'iceberg',
            'iceberg.catalog.type' = 'rest',
            'uri'='https://onelake.table.fabric.microsoft.com/iceberg',
            'warehouse'='<workerspace_id>/<data_item_id>',
            'iceberg.rest.security.type'='oauth2',
            'iceberg.rest.oauth2.server-uri'='https://login.microsoftonline.com/<tenant_id>/oauth2/v2.0/token',
            'iceberg.rest.oauth2.credential'='<oauth2.client_id>:<oauth2.client_secret>',
            'iceberg.rest.oauth2.scope'='https://storage.azure.com/.default', 
            'fs.azure.support'='true',
            'azure.endpoint'='https://onelake.dfs.fabric.microsoft.com',
            'azure.auth_type'='OAuth2',
            'azure.oauth2_account_host'='onelake.dfs.fabric.microsoft.com',
            'azure.oauth2_server_uri'='https://login.microsoftonline.com/<tenant_id>/oauth2/v2.0/token',
            'azure.oauth2_client_id'='<oauth2.client_id>',
            'azure.oauth2_client_secret'='<oauth2.client_secret>'
        );
```

Catalog를 생성할 때는 다음 매개변수가 필요합니다:

* `WORKSPACE_ID` 및 `DATA_ITEM_ID`: Lakehouse URL에서 확인할 수 있습니다:

  `https://app.fabric.microsoft.com/groups/<WORKSPACE_ID>/lakehouses/<DATA_ITEM_ID>`

* `client_id`, `client_secret`, `tenant` 등의 나머지 매개변수는 Azure 앱 등록 정보에 해당합니다.

* OneLake에서는 `iceberg.rest.oauth2.scope`, `uri`, `azure.oauth2_account_host`, `azure.endpoint`와 같은 구성 키에 일반적으로 고정된 값을 사용합니다. 구체적인 내용은 공식 문서나 구성 예제를 참고하세요.

설정을 완료하면 표준 SQL을 사용하여 Doris에서 OneLake의 Iceberg 테이블을 직접 쿼리할 수 있습니다.

### 기본 분석 {#basic-analytics}

다음은 Doris와 OneLake를 함께 사용하여 통합 분석을 수행하는 방법을 보여 주는 일반적인 비즈니스 분석 예제입니다:

```sql
Doris> SWITCH onelake_doris;
Query OK, 0 rows affected

Doris> USE dbo;
Database changed

Doris> SHOW TABLES;
+----------------+
| Tables_in_dbo  |
+----------------+
| customer_order |
+----------------+
1 row in set
```

1. 지난 사흘 동안의 신규 주문 추적

   대기 중인 주문, 결제된 주문, 완료된 주문을 비롯한 최근 판매 활동을 실시간으로 파악하여 주문 처리 우선순위를 더 효과적으로 정할 수 있습니다.

   ```sql
   Doris> SELECT order_id, customer_name, product_name, total_price, status
       -> FROM customer_order
       -> WHERE order_date >= DATE_SUB(NOW(), INTERVAL 3 DAY)
       -> ORDER BY order_date DESC;

   +----------------+---------------+---------------------+-------------+-----------+
   | order_id       | customer_name | product_name        | total_price | status    |
   +----------------+---------------+---------------------+-------------+-----------+
   | ORD20251112002 | Bob Li        | Smart Watch         |        1128 | Completed |
   | ORD20251112001 | Alice Zhang   | Wireless Headphones |         499 | Completed |
   | ORD20251112003 | Chen Wei      | Bluetooth Speaker   |         299 | Pending   |
   +----------------+---------------+---------------------+-------------+-----------+
   3 rows in set
   ```

2. 도시별 매출 실적

   도시별 총매출과 주문 건수를 집계하여 지역별 판매 전략과 재고 계획 수립에 활용할 수 있습니다.

   ```sql
   Doris> SELECT city,
       ->        SUM(total_price) AS total_sales,
       ->        COUNT(*) AS order_count
       -> FROM customer_order
       -> WHERE status = 'Completed'
       -> GROUP BY city
       -> ORDER BY total_sales DESC;

   +----------+-------------+-------------+
   | city     | total_sales | order_count |
   +----------+-------------+-------------+
   | Beijing  |        1128 |           1 |
   | Shanghai |         499 |           1 |
   | Shenzhen |         387 |           1 |
   +----------+-------------+-------------+
   3 rows in set
   ```

3. 결제 수단별 환불률

   환불률이 비정상적으로 높은 결제 채널을 파악하여 재무 또는 리스크 관리 팀이 정책을 조정하거나 모니터링을 강화하도록 지원할 수 있습니다.

   ```sql
   Doris> SELECT payment_method,
       -> SUM(CASE WHEN status = 'Refunded' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)
       ->    AS refund_rate_percent
       -> FROM customer_order
       -> GROUP BY payment_method
       -> ORDER BY refund_rate_percent DESC;

   +----------------+---------------------+
   | payment_method | refund_rate_percent |
   +----------------+---------------------+
   | Credit Card    |            50.00000 |
   | WeChat Pay     |             0.00000 |
   | Alipay         |             0.00000 |
   | UnionPay       |             0.00000 |
   +----------------+---------------------+
   4 rows in set
   ```

4. 시스템 간 사용자 행동 비교

   기존 시스템(예: Hive)과 OneLake를 함께 운영하는 경우, 마이그레이션 후의 사용자 중복 현황과 행동 변화를 분석하여 비즈니스 영향을 평가할 수 있습니다.

   ```sql
   -- "hive_catalog" is a Hive Catalog created in Doris 
   Doris> SELECT
       ->     a.customer_id,
       ->     COUNT(DISTINCT b.order_id) AS new_order_count,
       ->     SUM(b.total_price) AS new_total_amount
       -> FROM hive_catalog.order_db.hive_customer_order a
       -> JOIN onelake_doris.dbo.customer_order b
       ->   ON a.customer_id = b.customer_id
       -> GROUP BY a.customer_id
       -> ORDER BY new_total_amount DESC
       -> LIMIT 100;
       
   +-------------+-----------------+------------------+
   | customer_id | new_order_count | new_total_amount |
   +-------------+-----------------+------------------+
   | CUST1002    |               1 |             1128 |
   | CUST1001    |               1 |              499 |
   | CUST1004    |               1 |              387 |
   | CUST1003    |               1 |              299 |
   | CUST1005    |               1 |              189 |
   +-------------+-----------------+------------------+
   5 rows in set
   ```

### 스냅샷 및 Time Travel {#snapshot--time-travel}

```sql
Doris> SELECT * FROM customer_order$snapshots\G
*************************** 1. row ***************************
 committed_at: 2025-11-12 17:21:06.692000
  snapshot_id: 7623467350518045470
    parent_id: NULL
    operation: overwrite
manifest_list: abfss://181a804a-ea52-...
      summary: {"XTABLE_METADATA":"{"lastInstantSynced":"2025-11-12...
1 row in set (1.90 sec)

mysql> SELECT * FROM customer_order FOR VERSION AS OF 7623467350518045470 LIMIT 1\G
*************************** 1. row ***************************
      order_id: ORD20251112001
   customer_id: CUST1001
 customer_name: Alice Zhang
         email: alice.zhang@example.com
         phone: 13812345678
       country: China
          city: Shanghai
    order_date: 2025-11-10 22:23:00.000000
    product_id: PROD-A100
  product_name: Wireless Headphones
      category: Electronics
      quantity: 1
    unit_price: 499
   total_price: 499
payment_method: Credit Card
        status: Completed
1 row in set
```

## 결론 {#conclusion}

이 가이드에서는 **Apache Doris**와 **Microsoft OneLake**를 원활하게 통합하여 통합 데이터 레이크 아키텍처에서 고성능 분석을 수행하는 방법을 살펴보았습니다.
&#x20;이 통합은 다음과 같은 주요 이점을 제공합니다:

* **데이터 이동 없음**: 복사나 마이그레이션 없이 OneLake의 데이터에 직접 접근합니다.

* **통합 거버넌스**: 데이터 레이크 전반에서 중앙화된 관리, 액세스 제어, 보안 정책을 유지합니다.

* **개방형 형식 호환성**: **Iceberg** 개방형 테이블 표준을 기반으로 플랫폼 간 상호 운용성을 보장합니다.

* **유연한 분석**: Doris의 강력한 OLAP 엔진과 OneLake의 확장 가능한 스토리지 계층을 결합합니다.

**실시간 비즈니스 모니터링**, **시스템 간 데이터 비교**, **복잡한 다차원 분석** 등 어떤 용도든 이 아키텍처를 통해 기업은 성능과 유연성을 모두 확보할 수 있습니다. 데이터 레이크 기술이 계속 발전함에 따라 Doris와 OneLake의 통합은 기업의 디지털 전환을 위한 탄탄한 데이터 기반이 될 것입니다.

이제 이 글에 안내된 구성 단계를 따라 자체 분석 환경을 구축하고, 비즈니스 요구에 맞는 더 고도화된 분석 시나리오를 살펴볼 수 있습니다.
