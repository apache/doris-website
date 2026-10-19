---
{
    "title": "데이터 계보 기술 가이드 (4.x)",
    "sidebar_label": "데이터 계보",
    "language": "ko",
    "description": "외부 LineagePlugin을 통해 지원되는 Doris DML 문에서 테이블 수준 및 열 수준 계보를 수집합니다.",
    "keywords": ["Apache Doris", "데이터 계보", "데이터 거버넌스", "LineagePlugin", "열 수준 계보"]
}
---

<!-- Knowledge type: Feature overview + technical design + user guide -->
<!-- Use cases: Data governance integration / impact analysis / compliance traceability -->

데이터 계보는 지원되는 Doris DML 문에서 테이블 수준 및 열 수준 종속성을 추출하여 `LineagePlugin`을 통해 외부 거버넌스 시스템으로 전송합니다. Doris는 계보를 생성하는 역할을 합니다. 이벤트를 보관하거나 계보 쿼리 API를 제공하거나 계보를 시각화하는 기능은 제공하지 않습니다.

> 이 기능은 4.x 릴리스 계열에서 Apache Doris 4.0.6부터 사용할 수 있습니다.

## 기능 및 제한 사항 {#capabilities-and-limitations}

프레임워크는 다음 문 중 하나가 성공한 후에만 이벤트를 생성합니다.

| 지원되는 문 | 이벤트 동작 |
| --- | --- |
| `INSERT INTO ... SELECT` | Insert가 성공하면 이벤트 하나를 생성합니다. |
| `INSERT OVERWRITE TABLE ... SELECT` | Overwrite가 성공하면 이벤트 하나를 생성합니다. |
| `CREATE TABLE AS SELECT` | 내부 Insert가 성공하면 이벤트 하나를 생성합니다. |

현재 구현에서는 `SELECT`, `UPDATE`, `DELETE`, 데이터 적재 작업, `VALUES`만 사용하는 삽입 또는 대상이 `__internal_schema`인 쓰기에 대해 이벤트를 생성하지 않습니다. 일부 `UPDATE` 및 `DELETE` 실행 경로는 내부적으로 Insert 명령을 재사용하지만, 원래 명령 유형을 검사하여 계보 이벤트 제출 대상에서 제외합니다.

:::caution 전달 보장

계보는 비동기 최선형(best effort) 방식으로 전달됩니다. 이벤트 수집이나 플러그인 전달이 실패해도 성공한 DML 문은 롤백되지 않습니다. 큐가 가득 차면 이벤트가 폐기될 수 있으며, Doris는 이벤트를 재시도하거나 영구 저장하지 않습니다.

:::

## 기술 설계 {#technical-design}

### 수집 흐름 {#collection-flow}

지원되는 문의 경우 Doris는 `afterAnalyze` 플래너 훅에서 분석된 Nereids 논리 계획을 기록합니다. DML이 성공하면 Doris는 해당 계획에서 계보를 추출하고 이벤트를 FE 로컬 큐에 제출합니다. 단일 데몬 워커가 로드된 모든 플러그인을 평가하고 `eventFilter()`가 `true`를 반환하는 각 플러그인에 이벤트를 전달합니다.

![데이터 계보 수집 아키텍처: 성공한 지원 DML 문을 Nereids에서 분석하고, LineageInfo로 추출하여 FE의 큐에 넣은 다음, 플러그인을 통해 외부 거버넌스 시스템으로 전달합니다.](/images/data-lineage/lineage-architecture.svg)

계보 추출 전에 Doris는 로드된 플러그인의 `eventFilter()`를 호출합니다. 이벤트를 수신하려는 플러그인이 없으면 추출을 건너뜁니다. 워커는 전달 전에 `eventFilter()`를 다시 평가합니다.

### 계보 내용 {#lineage-content}

각 `LineageInfo` 이벤트에는 테이블 계보, 직접 열 계보, 두 종류의 간접 계보 및 쿼리 컨텍스트가 포함됩니다. 아래의 전체 SQL 예제에서는 이후 절에서 사용할 소스 테이블, 대상 테이블 및 결과를 정의합니다.

#### 예제 SQL 및 결과 {#example-sql-and-result}

현재 사용자는 데이터베이스와 테이블을 생성하고, 데이터를 쓰고, 데이터를 쿼리할 수 있는 권한이 있어야 하며, FE에는 계보 플러그인이 로드되어 있어야 합니다. 이 예제는 소스 테이블 두 개를 사용하며, CTE, Join, 필터, 집계, 윈도우 함수, 조건식 및 정렬을 통해 고객 요약을 생성합니다.

```sql
CREATE DATABASE IF NOT EXISTS lineage_demo;
USE lineage_demo;

CREATE TABLE lineage_orders (
    order_id BIGINT,
    customer_id BIGINT,
    region VARCHAR(16),
    amount DECIMAL(18, 2),
    status VARCHAR(16)
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_customers (
    customer_id BIGINT,
    customer_name VARCHAR(64),
    customer_level VARCHAR(16)
)
DUPLICATE KEY(customer_id)
DISTRIBUTED BY HASH(customer_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_customer_summary (
    customer_id BIGINT,
    region_label VARCHAR(16),
    total_amount DECIMAL(18, 2),
    customer_seq BIGINT,
    region_group VARCHAR(16)
)
DUPLICATE KEY(customer_id)
DISTRIBUTED BY HASH(customer_id) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO lineage_customers VALUES
    (1, 'Alice', 'VIP'),
    (2, 'Bob', 'VIP'),
    (3, 'Carol', 'REGULAR');

INSERT INTO lineage_orders VALUES
    (101, 1, 'east', 100.00, 'PAID'),
    (102, 1, 'east',  50.00, 'PAID'),
    (103, 2, 'west',  80.00, 'PAID'),
    (104, 2, 'west',  30.00, 'CANCELLED'),
    (105, 3, 'north', 200.00, 'PAID');

INSERT INTO lineage_customer_summary
WITH customer_totals AS (
    SELECT
        o.customer_id,
        UPPER(o.region) AS region_label,
        SUM(o.amount) AS total_amount
    FROM lineage_orders o
    JOIN lineage_customers c
        ON o.customer_id = c.customer_id
    WHERE o.status = 'PAID'
      AND c.customer_level = 'VIP'
    GROUP BY o.customer_id, UPPER(o.region)
    HAVING SUM(o.amount) >= 50
)
SELECT
    customer_id,
    region_label,
    total_amount,
    ROW_NUMBER() OVER (ORDER BY customer_id) AS customer_seq,
    CASE
        WHEN region_label = 'EAST' THEN 'CORE'
        ELSE 'OTHER'
    END AS region_group
FROM customer_totals
ORDER BY total_amount DESC;

SELECT customer_id, region_label, total_amount, customer_seq, region_group
FROM lineage_customer_summary
ORDER BY customer_id;
```

쿼리는 다음 결과를 반환합니다.

```text
+-------------+--------------+--------------+--------------+--------------+
| customer_id | region_label | total_amount | customer_seq | region_group |
+-------------+--------------+--------------+--------------+--------------+
|           1 | EAST         |       150.00 |            1 | CORE         |
|           2 | WEST         |        80.00 |            2 | OTHER        |
+-------------+--------------+--------------+--------------+--------------+
```

두 개의 `VALUES` 전용 삽입은 계보 이벤트를 생성하지 않습니다. `INSERT INTO lineage_customer_summary ... SELECT` 문은 `LineageInfo` 이벤트 하나를 생성하며, 그 내용은 아래에서 설명합니다.

#### 테이블 계보 {#table-lineage}

테이블 계보는 대상 테이블 하나와 분석된 논리 계획에서 스캔하는 모든 소스 테이블을 기록합니다. `lineage_customer_summary`에 쓰는 쿼리는 `lineage_orders`와 `lineage_customers`를 모두 스캔하므로, 두 소스 테이블 모두 대상 테이블과 테이블 수준의 관계를 갖습니다. CTE는 기반 테이블로 해석되며, 모든 `UNION` 분기가 소스 테이블 집합에 반영됩니다.

이 예제는 다음과 같은 테이블 계보를 생성합니다.

| 소스 테이블 | 대상 테이블 |
| --- | --- |
| `lineage_orders` | `lineage_customer_summary` |
| `lineage_customers` | `lineage_customer_summary` |

#### 직접 열 계보 {#direct-column-lineage}

직접 열 계보는 각 대상 열의 값을 생성하는 소스 표현식을 설명합니다. 별칭과 CTE를 해석한 후 Doris는 다음 순서로 표현식을 분류합니다. 집계 함수를 포함하는 표현식은 `AGGREGATION`, 단순한 소스 열 참조는 `IDENTITY`, 그 밖의 모든 표현식은 `TRANSFORMATION`으로 분류합니다.

| 유형 | 의미 | 예제 |
| --- | --- | --- |
| `IDENTITY` | 함수나 연산 없이 소스 열에서 대상 값을 직접 가져옵니다. | `lineage_customer_summary.customer_id`는 `lineage_orders.customer_id`에서 직접 가져옵니다. |
| `TRANSFORMATION` | 산술 연산, 문자열 함수, 윈도우 함수 또는 조건식과 같은 비집계 표현식으로 대상 값을 변환합니다. | `region_label`은 `UPPER(lineage_orders.region)`에서, `customer_seq`는 `ROW_NUMBER()`에서 생성됩니다. |
| `AGGREGATION` | 집계 함수를 포함하는 표현식으로 대상 값을 생성합니다. 다른 표현식이 집계 표현식을 감싸더라도 이 유형을 유지합니다. | `total_amount`는 `SUM(lineage_orders.amount)`에서 생성됩니다. |

이 예제는 다음과 같은 직접 열 계보를 생성합니다.

| 대상 열 | 소스 표현식 | 유형 |
| --- | --- | --- |
| `lineage_customer_summary.customer_id` | `lineage_orders.customer_id` | `IDENTITY` |
| `lineage_customer_summary.region_label` | `UPPER(lineage_orders.region)` | `TRANSFORMATION` |
| `lineage_customer_summary.total_amount` | `SUM(lineage_orders.amount)` | `AGGREGATION` |
| `lineage_customer_summary.customer_seq` | `ROW_NUMBER() OVER (ORDER BY lineage_orders.customer_id)` | `TRANSFORMATION` |
| `lineage_customer_summary.region_group` | `CASE WHEN UPPER(lineage_orders.region) = 'EAST' ... END` | `TRANSFORMATION` |

#### 데이터 세트 간접 계보 {#dataset-indirect-lineage}

데이터 세트 간접 계보는 대상 열의 값을 직접 생성하지 않으면서 전체 결과 집합에 영향을 주는 표현식을 기록합니다. 이러한 종속성은 이벤트 수준의 맵에 저장되며, 필요할 때 모든 대상 출력 열에 적용할 수 있습니다.

| 유형 | 의미 | 예제 |
| --- | --- | --- |
| `JOIN` | Join 조건은 어떤 소스 행을 결합할 수 있는지 결정합니다. | `lineage_orders.customer_id = lineage_customers.customer_id`. |
| `FILTER` | `WHERE` 또는 `HAVING` 조건은 어떤 행이나 그룹이 결과에 포함되는지 결정합니다. | `status = 'PAID'`, `customer_level = 'VIP'` 및 `HAVING SUM(amount) >= 50`. |
| `GROUP_BY` | 그룹화 표현식은 집계 결과의 세분화 수준을 결정합니다. | `customer_id`와 `UPPER(region)`을 기준으로 그룹화합니다. |
| `SORT` | `ORDER BY` 또는 TopN 표현식은 결과 순서를 결정합니다. | `total_amount DESC`를 기준으로 정렬하며, 이는 `SUM(amount)`로 해석됩니다. |

이 예제는 다음과 같은 데이터 세트 간접 계보를 생성합니다.

| 유형 | 이벤트의 소스 표현식 예제 | 영향 |
| --- | --- | --- |
| `JOIN` | `lineage_orders.customer_id = lineage_customers.customer_id` | 주문과 고객을 매칭하는 방식을 결정합니다. |
| `FILTER` | `status = 'PAID'`, `customer_level = 'VIP'` 및 `SUM(amount) >= 50` | `WHERE`와 `HAVING` 조건자가 함께 어떤 행과 그룹이 결과에 포함되는지 결정합니다. |
| `GROUP_BY` | `lineage_orders.customer_id` 및 `UPPER(lineage_orders.region)` | 각 고객과 지역의 집계 세분화 수준을 결정합니다. |
| `SORT` | `total_amount DESC`, 해석 결과는 `SUM(lineage_orders.amount)` | Insert 쿼리 결과의 순서를 결정합니다. |

#### 출력 간접 계보 {#output-indirect-lineage}

출력 간접 계보는 영향을 받는 대상 열에만 연결되며 다른 출력 열에는 적용되지 않습니다.

| 유형 | 의미 | 예제 |
| --- | --- | --- |
| `WINDOW` | 윈도우 함수의 `PARTITION BY` 및 `ORDER BY` 입력은 해당 출력 열에 영향을 줍니다. | `customer_seq`는 `ROW_NUMBER() OVER (ORDER BY customer_id)`로 생성되며, 해당 `WINDOW` 종속성은 `customer_id`입니다. |
| `CONDITIONAL` | `CASE` 또는 `IF` 조건이나 `COALESCE`의 후보 표현식은 해당 출력 열에 영향을 줍니다. | `region_group`은 `CASE WHEN region_label = 'EAST' ...`로 결정되며, 해당 `CONDITIONAL` 종속성은 이 조건자입니다. |

윈도우 표현식이나 조건식 자체는 여전히 직접 열 계보에 나타납니다. 예를 들어 `customer_seq`의 직접 유형은 `TRANSFORMATION`이며, `WINDOW` 간접 계보도 가집니다. `region_group`의 직접 유형도 `TRANSFORMATION`이며, `CONDITIONAL` 간접 계보도 가집니다.

이 예제는 다음과 같은 출력 간접 계보를 생성합니다.

| 대상 열 | 유형 | 이벤트의 소스 표현식 | 영향 |
| --- | --- | --- | --- |
| `customer_seq` | `WINDOW` | `lineage_orders.customer_id` | `ROW_NUMBER()`의 윈도우 정렬 입력으로 사용되며 `customer_seq`에만 영향을 줍니다. |
| `region_group` | `CONDITIONAL` | `UPPER(lineage_orders.region) = 'EAST'` | `CASE WHEN` 조건으로 사용되며 `region_group`에만 영향을 줍니다. |

다른 세 개의 대상 열에는 출력 간접 계보가 없습니다. 데이터 세트 수준의 `JOIN`, `FILTER`, `GROUP_BY` 및 `SORT` 종속성은 여전히 전체 결과 집합에 영향을 줍니다.

#### 쿼리 컨텍스트 {#query-context}

쿼리 컨텍스트는 누가 어떤 세션에서 어떤 DML 문을 통해 계보 이벤트를 생성했는지 식별합니다.

| 필드 | 예제 또는 의미 |
| --- | --- |
| 원본 명령 | `InsertIntoTableCommand`는 이벤트가 Insert에서 생성되었음을 나타냅니다. |
| 쿼리 ID 및 원본 SQL | 쿼리 ID와 전체 `INSERT INTO lineage_customer_summary ...` 텍스트입니다. |
| 사용자 및 클라이언트 IP | 예를 들어 `lineage_user` 및 `192.0.2.10`입니다. |
| 세션 데이터베이스 및 Catalog | 이 예제에서는 `lineage_demo` 및 `internal`입니다. 세션 컨텍스트를 설명하며, 반드시 대상 테이블의 위치를 식별하는 것은 아닙니다. |
| 실행 상태 | 성공한 DML 문은 일반적으로 `OK`를 기록합니다. |
| 타임스탬프 및 소요 시간 | 이벤트 생성 시각과 쿼리 시작부터 이벤트 생성까지 걸린 시간(밀리초)입니다. 값을 알 수 없으면 `-1`입니다. |
| 외부 Catalog 속성 | 쿼리에서 참조하는 외부 Catalog의 민감하지 않은 속성입니다. 비밀번호, 키 및 숨겨진 속성은 제거됩니다. `internal` Catalog만 사용하면 맵은 비어 있습니다. |

이 예제에서 원본 SQL은 위의 복잡한 Insert 문이고, 원본 명령은 `InsertIntoTableCommand`, 세션 데이터베이스는 `lineage_demo`, 세션 Catalog는 `internal`, 성공 상태는 `OK`입니다. 쿼리 ID, 사용자, 클라이언트 IP, 타임스탬프 및 소요 시간에는 실제 실행 컨텍스트의 값이 사용됩니다. 이 예제는 Internal Catalog만 사용하므로 외부 Catalog 속성 맵은 비어 있습니다.

플러그인의 다운스트림 시스템에서 이벤트가 수신되었는지 확인합니다. 초기 배포 시에는 `fe.log`에서 `Loaded lineage plugin`, 플러그인별 오류 및 큐가 가득 찼다는 경고도 확인합니다.

![LineageInfo 이벤트 모델: 대상 및 소스 테이블을 바탕으로 직접 계보와 간접 계보를 구성하고, 이를 쿼리 컨텍스트와 결합한 다음, 플러그인이 다운스트림 시스템용 이벤트로 변환합니다.](/images/data-lineage/lineage-event-model.svg)

추출기는 이벤트가 전달되기 전에 CTE 생성자 표현식을 해석하고 `UNION` 분기를 확장합니다. 다운스트림 플러그인은 `TableIf`, `SlotReference`, `Expression`과 같은 Doris Java 객체를 안정적인 식별자 또는 자체 이벤트 스키마로 변환해야 합니다.

### 이벤트 처리 동작 {#event-processing-behavior}

`lineage_event_queue_size`는 각 FE 로컬 큐에서 대기하는 계보 이벤트의 최대 개수를 설정합니다. 바이트 수가 아닌 이벤트 수를 기준으로 합니다. 큐가 가득 차면 새 이벤트는 폐기되며 DML은 정상적으로 계속 실행됩니다. 워커는 플러그인을 순차적으로 호출하므로, 느린 플러그인은 이후 이벤트를 지연시키고 부하가 지속될 때 이벤트 유실을 일으킬 수 있습니다. 플러그인에서 발생한 예외는 로그에 기록되며, 워커를 중지하거나 DML에 영향을 주지 않습니다.

플러그인 검색과 초기화는 FE가 시작될 때만 수행됩니다. 동적 재로드 및 언로드는 지원되지 않습니다.

## 구성 및 사용 {#configure-and-use}

### 사전 요구 사항 {#prerequisites}

1. 외부 계보 플러그인을 준비합니다. Doris는 기본 제공 싱크를 포함하지 않습니다. SPI 계약, JAR 패키징 및 완전한 최소 플러그인은 [데이터 계보 플러그인 개발](/community/developer-guide/data-lineage-plugin-development)을 참조하세요.
2. 모든 FE에 플러그인 JAR과 필요한 타사 종속성 JAR을 복사합니다.
3. 플러그인이 외부 거버넌스 서비스로 이벤트를 전송한다면, DML을 실행할 수 있는 모든 FE에서 해당 서비스에 접근할 수 있는지 확인합니다.

### 플러그인 배포 {#deploy-the-plugin}

`FE_HOME`은 `bin/`, `conf/`, `lib/`가 포함된 단일 FE 설치 디렉터리를 의미합니다. 모든 FE에서 다음 디렉터리 구조를 사용합니다. 로더는 `lineage/` 바로 아래의 하위 디렉터리와 각 플러그인 디렉터리 및 그 안의 `lib/` 디렉터리에 있는 JAR만 검색합니다.

```text
$FE_HOME/plugins/
└── lineage/
    └── example-lineage/
        ├── example-lineage.jar
        └── lib/
            └── downstream-client.jar
```

모든 FE에서 `fe.conf`를 구성합니다. `example-lineage`를 플러그인 Factory의 `name()` 메서드가 반환하는 값으로 바꿉니다.

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| 구성 항목 | 유형 및 기본값 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `plugin_dir` | String; `$FE_HOME/plugins` | 아니요 | 플러그인 루트 디렉터리입니다. 계보 로더는 이 디렉터리의 `lineage/` 바로 아래에 있는 하위 디렉터리를 검색합니다. 기본 디렉터리를 사용하면 이 설정은 생략합니다. |
| `activate_lineage_plugin` | String 배열; 비어 있음 | 명시적 구성 권장 | 인스턴스화할 Factory 이름을 쉼표로 구분해 지정합니다. 값이 비어 있으면 이름 필터링을 비활성화하고 검색된 모든 Factory를 인스턴스화합니다. |
| `lineage_event_queue_size` | 양의 정수; `50000` | 아니요 | 현재 FE에서 대기할 수 있는 계보 이벤트의 최대 개수입니다. 큐가 가득 차면 새 이벤트는 폐기됩니다. |

세 설정 모두 각 FE의 `$FE_HOME/conf/fe.conf`에서 구성하며, 해당 FE 프로세스에만 적용됩니다. FE 시작 시에만 읽으므로, 설정을 변경한 후에는 해당 FE를 재시작합니다.

#### 플러그인 활성화 {#activate-plugins}

`activate_lineage_plugin`을 모든 FE의 `$FE_HOME/conf/fe.conf`에서 구성합니다. 이 설정은 검색된 Factory 중 어떤 Factory를 인스턴스화할지 제어합니다. JAR을 검색하거나 큐 용량을 제어하지는 않습니다. 각 이름은 대소문자를 구분하며 `LineagePluginFactory.name()`과 정확히 일치해야 합니다. `LineagePlugin.name()` 구현도 같은 이름을 반환해야 합니다. 플러그인 디렉터리 이름은 일치 여부를 확인하는 데 사용되지 않습니다. 여러 플러그인 이름은 쉼표로 구분합니다. FE 구성 파서는 쉼표로 구분된 각 항목의 앞뒤 공백을 제거하지만, 이름 비교 시에는 여전히 대소문자를 구분합니다.

```text
activate_lineage_plugin = example-lineage,governance-lineage
```

시작 시 FE는 기본 제공 Factory와 외부 Factory를 검색한 다음, 구성된 이름에 대해서만 인스턴스를 생성합니다. 각 FE는 자체 구성을 읽으므로, DML을 실행할 수 있는 모든 FE에서 동일한 플러그인 집합을 사용해야 합니다. 변경 후 FE를 재시작합니다. 이 설정은 `ADMIN SET FRONTEND CONFIG`로 동적으로 변경할 수 없습니다.

:::caution 빈 값의 동작

현재 구현에서 `activate_lineage_plugin` 값이 비어 있어도 계보 플러그인은 비활성화되지 않습니다. 이름 필터링을 건너뛰고 검색된 모든 Factory를 인스턴스화합니다. 활성화할 플러그인을 명시적으로 나열하고, 빈 값을 비활성화 스위치로 사용하지 마세요. 플러그인이 로드된 후에도 `eventFilter()`가 추출 전과 전달 전에 이벤트 수신 여부를 결정합니다.

:::

#### 이벤트 큐 구성 {#configure-the-event-queue}

`lineage_event_queue_size`를 모든 FE의 `$FE_HOME/conf/fe.conf`에서 구성합니다. 값은 양의 정수여야 합니다. DML을 실행할 수 있는 각 FE는 독립적인 큐를 가지며, 개별적으로 구성해야 합니다.

이 설정은 FE 시작 시 적용되며 `ADMIN SET FRONTEND CONFIG`로 동적으로 변경할 수 없습니다. 변경 후 해당 FE를 재시작합니다. 값을 늘리면 대기 중인 이벤트를 수용할 수 있는 용량과 FE 메모리 사용량이 증가합니다. 소비자 스레드가 추가되거나 플러그인의 처리량이 늘어나지는 않습니다. 이벤트가 누락되면 먼저 `fe.log`에서 `the lineage event queue is full`을 검색하고 플러그인의 `exec()` 메서드 지연 시간을 줄입니다. 그런 다음 최대 적체량과 사용 가능한 FE 메모리를 기준으로 큐 크기를 조정합니다.

다른 플러그인 설정을 변경하거나 플러그인 JAR을 교체한 후에는 모든 FE를 재시작합니다. 플러그인 구성과 디렉터리는 FE 시작 시에만 읽습니다.

## 운영 및 문제 해결 {#operate-and-troubleshoot}

### 쓰기 후 이벤트가 생성되지 않음 {#no-event-after-a-write}

일반적인 원인으로는 지원되지 않는 문, 실패한 DML 문, 현재 FE에 로드된 플러그인이 없는 경우 또는 `eventFilter()`가 `false`를 반환하는 경우가 있습니다.

다음 순서로 확인합니다.

1. 문이 성공적으로 실행된 `INSERT INTO ... SELECT`, `INSERT OVERWRITE TABLE ... SELECT` 또는 `CREATE TABLE AS SELECT`인지 확인합니다. `VALUES`만 사용하는 Insert는 이벤트를 생성하지 않습니다.
2. DML을 실행한 FE에 플러그인이 구성되고 로드되어 있는지 확인합니다. `fe.log`에서 `Loaded lineage plugin`을 검색합니다.
3. 플러그인의 `eventFilter()`가 쿼리 스레드와 워커 스레드 모두에서 `true`를 반환하는지 확인합니다.
4. 플러그인 로그와 다운스트림 서비스를 확인하여 FE 외부에서 처리에 실패하지 않았는지 확인합니다.

### 플러그인이 로드되지 않음 {#plugin-not-loaded}

플러그인 디렉터리에 JAR이 있고, 해당 JAR에 `META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory`가 포함되어 있는지 확인합니다. 각 플러그인 디렉터리는 하나의 Factory만 노출할 수 있습니다. Factory 이름은 전역적으로 고유해야 하며 `activate_lineage_plugin`과 일치해야 합니다. 디렉터리, JAR 또는 구성을 수정한 후 해당 FE를 재시작합니다.

### 높은 부하에서 이벤트 누락 {#missing-events-under-high-load}

`fe.log`에서 `the lineage event queue is full`과 플러그인 예외를 검색합니다. 큐가 가득 차면 먼저 `exec()`의 동기식 블로킹을 줄이고, 다운스트림 전달을 멱등하게 구현하되 재시도에 제한을 둡니다. 그런 다음 `lineage_event_queue_size`를 늘릴지 검토합니다. 이벤트 크기는 SQL 문에 따라 달라지므로, 값을 늘리기 전에 FE 메모리 사용량을 고려합니다.

DML을 실행할 수 있는 모든 FE에 동일한 플러그인과 구성이 있는지도 확인합니다. 각 FE는 독립적인 로컬 큐를 사용하며, 플러그인과 큐 상태는 FE 간에 동기화되지 않습니다.

### 플러그인 업데이트가 적용되지 않음 {#plugin-update-did-not-take-effect}

플러그인 디렉터리는 FE 시작 시에만 검색됩니다. 동적 재로드 및 언로드는 지원되지 않습니다. 플러그인 JAR, 종속성 또는 구성을 교체한 후 관련된 모든 FE를 재시작하고 `Loaded lineage plugin`을 다시 확인합니다.

쿼리 ID와 대상 테이블을 사용하여 다운스트림 이벤트 식별자를 구성합니다. 이렇게 하면 플러그인이 프레임워크 외부에서 재시도를 구현하더라도 거버넌스 시스템에서 이벤트의 중복을 제거할 수 있습니다.

## 추가 자료 {#further-reading}

- [데이터 계보 플러그인 개발](/community/developer-guide/data-lineage-plugin-development)
