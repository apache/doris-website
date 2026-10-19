---
{
    "title": "Metabase",
    "language": "ko",
    "description": "Doris Driver를 사용하여 Metabase를 Apache Doris에 연결하고, 데이터 소스를 구성하고, 대시보드를 만들고, Catalog 및 매개변수화된 SQL을 사용하는 방법을 설명합니다.",
    "keywords": [
        "Metabase와 Doris 연결",
        "Apache Doris Metabase Driver",
        "Doris 시각화 대시보드",
        "Metabase Doris 데이터 소스"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Connect to Apache Doris in Metabase and build visualization dashboards -->

Metabase는 데이터 분석, 데이터 시각화, 대화형 대시보드, 데이터 드릴다운, SQL 쿼리 편집, 데이터 내보내기 기능을 제공하는 오픈 소스 비즈니스 인텔리전스 도구입니다. Metabase Apache Doris Driver를 사용하면 Apache Doris 데이터베이스와 테이블을 Metabase의 데이터 소스로 연동하여 Doris 내부 데이터와 외부 데이터를 쿼리하고 시각화 대시보드를 만들 수 있습니다.

이 드라이버는 독립형 Metabase 커뮤니티 드라이버이며 Metabase에 기본으로 포함되어 있지 않습니다.

이 문서에서는 사용자 시나리오를 중심으로 다음 작업을 수행하는 방법을 설명합니다.

| 시나리오 | 사용자 목표 | 주요 작업 |
|----------|----------|----------|
| Metabase 환경 준비 | Metabase가 Apache Doris를 데이터 소스로 인식하도록 설정 | Metabase 설치 후 Doris 드라이버 다운로드 및 설치 |
| Doris 데이터 소스 구성 | Metabase에서 Doris `tpch` 데이터베이스에 연결 | FE 노드, Query Port, Catalog, 데이터베이스, 사용자 이름 및 비밀번호 입력 |
| 시각화 분석 구성 | 시간에 따른 운송 방식별 주문 금액 변화 분석 | 질문 생성, SQL 작성, 선 차트 구성 후 대시보드에 저장 |
| 고급 기능 사용 | 외부 데이터 소스에 접근하고 쿼리 사용 편의성 개선 | Catalog, 매개변수화된 쿼리, 파티션 프루닝, 구체화된 뷰 및 캐싱 사용 |

## Metabase 환경 준비 {#prepare-the-metabase-environment}

### 사전 요구 사항 {#prerequisites}

구성을 시작하기 전에 다음 환경이 준비되어 있는지 확인합니다.

| 항목 | 요구 사항 |
|------|------|
| Metabase | Metabase `0.59.6.3` 이상을 다운로드하여 설치합니다. 설치 방법은 [Metabase 설치 문서](https://www.metabase.com/docs/latest/installation-and-operation/installing-metabase)를 참조하세요. |
| Java | Metabase를 실행하려면 Java 21이 필요합니다. |
| Apache Doris | 접근 가능한 Apache Doris 클러스터를 준비합니다. |
| Doris 드라이버 | [Metabase Doris Driver](https://github.com/velodb/metabase-doris-driver/releases/tag/v1.0.0)를 다운로드합니다. |

### 드라이버 다운로드 및 검증 {#download-and-verify-the-driver}

:::caution
Metabase Doris Driver는 타사에서 제공하고 유지 관리합니다. Apache Doris 프로젝트의 일부가 아니며, Apache Doris 커뮤니티에서 릴리스하거나 보증하지 않습니다. 프로덕션에서 사용하기 전에 드라이버를 직접 평가하고, 다운로드한 파일의 체크섬을 검증하고, 타사 프로젝트의 라이선스를 준수하세요. 드라이버 관련 문제는 해당 드라이버를 제공하는 프로젝트에 보고하세요.
:::

릴리스 JAR 및 체크섬 파일을 다운로드합니다.

```bash
curl -LO https://github.com/velodb/metabase-doris-driver/releases/download/v1.0.0/doris.metabase-driver-v1.0.0.jar
curl -LO https://github.com/velodb/metabase-doris-driver/releases/download/v1.0.0/doris.metabase-driver-v1.0.0.jar.sha256
sha256sum -c doris.metabase-driver-v1.0.0.jar.sha256
```

예상 SHA-256 해시값은 다음과 같습니다.

```text
b23e82f19a7f9226343e42566e1e192b6df7a0dfc48a73d2101fc74bfec243f3
```

### 일반 배포 환경에 드라이버 설치 {#install-the-driver-for-a-regular-deployment}

Metabase를 일반적인 방식으로 배포한 경우 다음과 같이 Doris 드라이버를 설치합니다.

1. 앞서 설명한 대로 드라이버 릴리스 파일을 다운로드하고 검증합니다.

2. Metabase 플러그인 디렉터리가 없으면 생성합니다.

    ```bash
    mkdir -p /path/to/metabase/plugins
    ```

3. 릴리스 JAR을 플러그인 디렉터리에 복사합니다.

    ```bash
    cp doris.metabase-driver-v1.0.0.jar /path/to/metabase/plugins/doris.metabase-driver.jar
    ```

4. Metabase 서비스를 다시 시작합니다.

5. Metabase 시작 로그에서 `doris` 드라이버가 등록되었는지 확인합니다. **관리자 설정** > **데이터베이스** > **데이터베이스 추가**에서 **Apache Doris** 데이터베이스 유형이 표시되어야 합니다.

### Docker 배포 환경에 드라이버 설치 {#install-the-driver-for-a-docker-deployment}

Docker로 Metabase를 시작하는 경우 `doris.metabase-driver.jar`를 마운트하여 시작하는 것이 좋습니다. Docker 컨테이너 내부의 플러그인 경로는 `/plugins/`입니다.

1. 드라이버 릴리스 파일을 다운로드하고 검증합니다.

2. 사전 요구 사항을 충족하는 Metabase 이미지로 컨테이너를 시작합니다.

    ```bash
    docker run -d \
      -p 3000:3000 \
      --name metabase \
      -v "$(pwd)/doris.metabase-driver-v1.0.0.jar:/plugins/doris.metabase-driver.jar:ro" \
      metabase/metabase
    ```

## Doris 데이터 소스 구성 {#configure-the-doris-data-source}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Add an Apache Doris database connection on the Metabase admin page -->

Metabase와 `metabase-doris-driver`를 설치한 후 Metabase에서 Doris `tpch` 데이터베이스에 연결하는 데이터 소스를 추가할 수 있습니다.

### 연결 매개변수 {#connection-parameters}

Apache Doris에 연결할 때 필요한 필드는 다음과 같습니다.

| 매개변수 | 의미 | 예시 |
|------|------|------|
| **표시 이름** | 데이터 소스의 표시 이름 | Doris-TPCH |
| **호스트** | Doris FE 노드 주소 | 127.0.0.1 |
| **포트** | Doris Query Port(MySQL 프로토콜 포트). 기본값은 `9030` | 9030 |
| **Catalog** | Catalog 이름. 선택 사항이며 기본값은 `internal` | internal |
| **데이터베이스(선택 사항)** | 선택한 Catalog의 데이터베이스. 선택 사항이며 비워 두면 Catalog에서 조회 가능한 모든 데이터베이스를 검색함 | tpch |
| **사용자 이름** | 사용자 이름 | root |
| **비밀번호** | 비밀번호 | your_password |
| **SSL** | JDBC TLS 활성화. 드라이버는 MariaDB `sslMode=trust`를 사용하며 서버 인증서나 호스트 이름을 검증하지 않음 | false |
| **스키마 동기화 포함 목록** | 선택 사항. **데이터베이스(선택 사항)**가 비어 있을 때 사용. 쉼표로 구분된 데이터베이스 허용 목록 | tpch |
| **스키마 동기화 제외 목록** | 선택 사항. **데이터베이스(선택 사항)**가 비어 있을 때 사용. 쉼표로 구분된 데이터베이스 차단 목록. 제외 규칙이 포함 규칙보다 우선함 | information_schema |
| **추가 JDBC 연결 문자열 옵션** | 기타 MariaDB JDBC URL 매개변수 | connectTimeout=10000 |

다음과 같이 Catalog 및 데이터베이스 범위를 선택합니다.

- **내부 테이블**: **Catalog**를 `internal`로 유지하고 `tpch`와 같은 데이터베이스를 입력합니다.
- **외부 테이블**: 외부 Catalog와 해당 Catalog에서 조회 가능한 데이터베이스를 입력합니다.
- **여러 데이터베이스**: **데이터베이스(선택 사항)**를 비워 둡니다. 드라이버는 구성된 계정으로 조회 가능한 데이터베이스를 검색하고, 포함 목록과 제외 목록을 적용한 후 해당 데이터베이스의 테이블을 나열합니다.

**데이터베이스(선택 사항)**가 비어 있으면 드라이버는 기본적으로 `information_schema`, `__internal_schema`, `mysql`을 제외합니다. 포함 및 제외 규칙은 대소문자를 구분하지 않고 일치 여부를 확인하며, 동일한 데이터베이스가 두 목록에 모두 있으면 제외 규칙이 우선합니다. **데이터베이스(선택 사항)**를 명시적으로 설정하면 동기화 범위가 해당 데이터베이스로 제한되며, 포함 및 제외 설정은 동기화 범위에 영향을 주지 않습니다.

### 구성 단계 {#configuration-steps}

1. Metabase를 시작하고 로그인합니다.

2. 오른쪽 위의 톱니바퀴 아이콘을 클릭하고 **관리자 설정**을 선택합니다.

![Metabase 관리자 설정](/images/next/connection-integration/data-integration/metabase/metabase-01.png)

3. 왼쪽 메뉴에서 **데이터베이스**를 선택하고 오른쪽 위의 **데이터베이스 추가** 버튼을 클릭합니다.

![데이터베이스 추가](/images/next/connection-integration/data-integration/metabase/metabase-02.png)

4. **데이터베이스 유형** 드롭다운에서 **Apache Doris**를 선택합니다.

![Apache Doris 선택](/images/next/connection-integration/data-integration/metabase/metabase-03.png)

5. 연결 정보를 입력합니다.

    | 매개변수 | 예시 값 |
    |------|--------|
    | **표시 이름** | Doris-TPCH |
    | **호스트** | 127.0.0.1 |
    | **포트** | 9030 |
    | **Catalog** | internal |
    | **데이터베이스(선택 사항)** | tpch |
    | **사용자 이름** | admin |
    | **비밀번호** | ****** |

![연결 정보 입력](/images/next/connection-integration/data-integration/metabase/metabase-04.png)

6. **저장**을 클릭하여 구성을 저장합니다.

7. Metabase가 연결을 테스트하고 데이터베이스 메타데이터 동기화를 시작합니다. 연결에 성공하면 성공 메시지가 표시됩니다.

![연결 성공](/images/next/connection-integration/data-integration/metabase/metabase-05.png)

데이터 소스 구성이 완료되면 Metabase에서 시각화를 만들 수 있습니다.

## 시각화 대시보드 만들기 {#build-a-visualization-dashboard}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Use Doris TPC-H data to create a Question and a Dashboard in Metabase -->

이 예제에서는 TPC-H 데이터를 데이터 소스로 사용합니다. Doris TPC-H 데이터 소스를 구축하는 방법은 [Doris TPC-H 벤치마크 문서](../../lakehouse/best-practices/tpch.md)를 참조하세요.

비용 분석을 위해 시간에 따른 운송 방식별 주문 금액 증가 추이를 분석해야 한다고 가정해 보겠습니다. 다음 절차에 따라 시각화를 구성할 수 있습니다.

### 질문 만들기 {#create-a-question}

1. 홈 페이지 오른쪽 위의 **새로 만들기 +** 버튼을 클릭하고 **질문**을 선택합니다.

![새 질문 만들기](/images/next/connection-integration/data-integration/metabase/metabase-06.png)

2. 데이터 소스를 선택합니다.

    | 매개변수 | 예시 값 |
    |------|--------|
    | **데이터베이스** | Doris TPCH |
    | **테이블** | lineitem |

![테이블 선택](/images/next/connection-integration/data-integration/metabase/metabase-07.png)

### SQL로 사용자 지정 지표 만들기 {#build-a-custom-metric-with-sql}

매출을 계산하려면 사용자 지정 SQL 표현식을 사용해야 합니다.

1. 오른쪽 위의 **SQL 보기**를 클릭한 다음 **이 질문을 SQL로 변환**을 클릭하여 SQL을 편집합니다.

![SQL 모드로 전환](/images/next/connection-integration/data-integration/metabase/metabase-08.png)

2. 다음 SQL 쿼리를 입력합니다.

    ```sql
    SELECT
      DATE_FORMAT(l_shipdate, '%Y-%m') AS ship_month,
      l_shipmode,
      SUM(l_extendedprice * (1 - l_discount)) AS revenue
    FROM lineitem
    WHERE l_shipdate >= '1995-01-01'
      AND l_shipdate < '1997-01-01'
    GROUP BY
      DATE_FORMAT(l_shipdate, '%Y-%m'),
      l_shipmode
    ORDER BY ship_month, l_shipmode
    ```

3. 오른쪽 아래의 **시각화** 버튼을 클릭하여 결과를 확인합니다.

![결과 확인](/images/next/connection-integration/data-integration/metabase/metabase-09.png)

### 시각화 차트 구성 {#configure-the-visualization-chart}

1. 기본적으로 결과는 테이블로 표시됩니다. 왼쪽 아래의 **시각화** 버튼을 클릭하고 **선** 차트 유형을 선택합니다.

![선 차트 선택](/images/next/connection-integration/data-integration/metabase/metabase-10.png)

2. 필요에 따라 차트 매개변수를 구성합니다. Metabase는 다음 구성을 자동으로 생성합니다.

    | 구성 | 예시 값 | 의미 |
    |--------|--------|------|
    | **X축** | ship_month | 배송 월 |
    | **Y축** | revenue | 매출 |
    | **계열** | l_shipmode | 운송 방식 |

3. 차트 스타일을 사용자 지정합니다.

    - **설정** 아이콘을 클릭하여 색상, 레이블, 범례 위치 등을 조정합니다.
    - **표시** 탭에서 축 제목, 숫자 형식 등을 설정할 수 있습니다.

4. 차트 구성이 완료되면 오른쪽 위의 **저장**을 클릭하여 저장합니다.

5. 질문 이름으로 **my-tpch**를 입력하고 저장할 컬렉션을 선택합니다.

![질문 이름 지정](/images/next/connection-integration/data-integration/metabase/metabase-11.png)

### 대시보드 만들기 {#create-a-dashboard}

1. **+ 새로 만들기** > **대시보드**를 클릭하여 새 대시보드를 만들고, 대시보드 이름으로 **my-tpch**를 입력합니다.

![대시보드 만들기](/images/next/connection-integration/data-integration/metabase/metabase-12.png)

2. **차트 추가**를 클릭하여 저장한 질문을 대시보드에 추가합니다.

![질문 추가](/images/next/connection-integration/data-integration/metabase/metabase-13.png)

3. 차트 위치와 크기를 조정하고 오른쪽 위의 **저장**을 클릭하여 대시보드를 저장합니다.

![대시보드 저장](/images/next/connection-integration/data-integration/metabase/metabase-14.png)

이제 Metabase를 Apache Doris에 연결하고 데이터 분석 및 시각화 대시보드 생성을 완료했습니다.

## 드라이버 기능 및 제한 사항 {#driver-capabilities-and-limitations}

다음 표는 드라이버의 기능과 현재 지원 범위를 요약한 것입니다.

| 기능 | 지원 상태 및 범위 |
|------|------|
| 내부 Catalog | Doris 내부 테이블의 동기화 및 쿼리 지원 |
| 네이티브 SQL | 지원됨. SQL은 구성된 Doris 계정의 권한으로 실행되며, 드라이버는 구문을 읽기 전용으로 제한하지 않음 |
| 쿼리 빌더 | 그룹 집계 및 일 단위 버킷화 지원 |
| 외부 Catalog | Doris 외부 Catalog에 있는 데이터의 동기화 및 쿼리 지원. 사용 가능한 범위와 메타데이터의 완전성은 개별 커넥터에 따라 다름 |
| 네이티브 템플릿 매개변수 | 숫자, 텍스트 및 선택적 블록 지원 |
| 복합 타입 | 최상위 `ARRAY`, `MAP`, `JSON` 및 내부 구조를 노출하지 않는 복합 필드는 표시되지만, 중첩 하위 필드는 확장되지 않음 |
| 키 및 인덱스 메타데이터 | 기본 키, 외래 키, 인덱스 및 테이블 권한은 동기화되지 않음 |
| Metabase 쓰기 기능 | 데이터 업로드, 다시 쓰기, 작업, 데이터 편집 및 영구 저장 모델은 지원되지 않음 |

## 고급 시나리오 {#advanced-scenarios}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenario: Access external data sources, create interactive dashboards, and optimize query performance -->

### Catalog를 사용하여 외부 데이터에 접근 {#use-catalog-to-access-external-data}

연결 페이지에서 **Catalog** 및 **데이터베이스(선택 사항)**를 설정하여 Doris 외부 Catalog의 테이블을 동기화합니다.

| 구성 | 예시 값 | 설명 |
|--------|--------|------|
| `Catalog` | `hive_catalog` | 이름이 `hive_catalog`인 Doris Catalog 선택 |
| `Database (optional)` | `warehouse` | Catalog의 `warehouse` 데이터베이스 선택 |

![Catalog 구성](/images/next/connection-integration/data-integration/metabase/metabase-15.png)

SQL 쿼리에서 Catalog를 명시적으로 지정합니다.

```sql
SELECT * FROM hive.warehouse.orders LIMIT 100;
```

### 매개변수화된 쿼리 사용 {#use-parameterized-queries}

드라이버는 기본적인 네이티브 SQL 템플릿 매개변수를 지원합니다. 다음 예제에서는 숫자 매개변수, 텍스트 매개변수 및 선택적 블록을 사용합니다.

```sql
SELECT
  category,
  COUNT(*) AS row_count,
  SUM(amount) AS total_amount
FROM orders
WHERE amount > {{min_amount}}
[[AND category = {{category}}]]
GROUP BY category
```

`category`에 값이 없으면 Metabase는 선택적 블록 전체를 제거합니다.

| 템플릿 기능 | 지원 상태 |
|----------|----------|
| 숫자 변수 | 지원됨 |
| 텍스트 변수 | 지원됨 |
| 선택적 블록 `[[ ... ]]` | 지원됨 |
| 필드 필터 | 지원되지 않음 |
| `{{#card-id}}`와 같은 카드 참조 | 지원되지 않음 |
| 동적 테이블 참조 | 지원되지 않음 |

### 데이터 타입 {#data-types}

메타데이터 동기화 중에 드라이버는 다음 표와 같이 Doris 타입을 Metabase 기본 타입에 매핑합니다.

| Doris 타입 | Metabase 기본 타입 |
|------------|-------------------|
| `BOOLEAN` | `type/Boolean` |
| `TINYINT`, `SMALLINT`, `INT`, `INTEGER`, `INT(11)`과 같은 표시 너비 포함 | `type/Integer` |
| `BIGINT`, `LARGEINT`, `BIGINT(20)`과 같은 표시 너비 포함 | `type/BigInteger` |
| `FLOAT`, `DOUBLE` | `type/Float` |
| `DECIMAL` | `type/Decimal` |
| `DATE`, `DATEV2` | `type/Date` |
| `TIME`, 초의 소수 부분 정밀도 포함 | `type/Time` |
| `DATETIME`, `DATETIMEV2`, `TIMESTAMP` | `type/DateTime` |
| `TIMESTAMPTZ` | `type/DateTimeWithTZ` |
| `CHAR`, `VARCHAR`, `STRING`, `TEXT` | `type/Text` |
| `JSON`, `JSONB` | `type/JSON` |
| `ARRAY` | `type/Array` |
| `MAP` | `type/Dictionary` |
| `STRUCT`, `VARIANT`, `HLL`, `BITMAP` | `type/*` |

`ARRAY`, `MAP`, `JSON`, `STRUCT` 또는 `VARIANT` 값 내부의 중첩 필드는 Metabase 하위 필드로 확장되지 않습니다. `LARGEINT`는 `type/BigInteger`에 매핑되며 문자열로 변환할 필요가 없습니다.

### 성능 튜닝 권장 사항 {#performance-tuning-recommendations}

| 권장 사항 | 설명 |
|------|------|
| 파티션 프루닝 사용 | `WHERE` 절에 파티션 열 필터 조건을 추가합니다. 예: `WHERE date >= '2024-01-01' AND date < '2024-02-01'` |
| 구체화된 뷰 활용 | 복잡한 집계 쿼리의 경우 Doris에서 구체화된 뷰를 생성하여 쿼리 속도를 높입니다. |
| 결과 집합 크기 제어 | `LIMIT`를 사용하여 반환되는 행 수를 제한하고 한 번에 너무 많은 데이터를 불러오지 않도록 합니다. |
| 쿼리 캐싱 사용 | Metabase는 쿼리 결과를 자동으로 캐싱합니다. 적절한 캐시 시간을 설정하면 성능을 개선할 수 있습니다. |

### 연결 및 사용 팁 {#connection-and-usage-tips}

| 시나리오 | 권장 사항 |
|------|------|
| 드라이버 설치 | `doris.metabase-driver.jar`가 Metabase의 `plugins` 디렉터리에 있는지 확인하고 Metabase를 다시 시작합니다. |
| 시간대 설정 | 시간대 문제가 발생하면 JDBC 연결 문자열에 `serverTimezone=Asia/Shanghai`를 추가합니다. |
| 파티션 테이블 최적화 | Doris 파티션 테이블을 적절히 생성하고 시간을 기준으로 파티셔닝 및 버킷팅하여 쿼리가 스캔하는 데이터양을 효과적으로 줄입니다. |
| 네트워크 연결 | VPC 사설 연결을 사용하여 공용 네트워크 접근에 따른 보안 위험을 방지합니다. |
| 권한 제어 | Doris 사용자 계정의 역할과 접근 권한을 세밀하게 설정하고 최소 권한 원칙을 따릅니다. |
| 메타데이터 동기화 | Doris의 테이블 구조가 변경되면 Metabase 관리자 페이지에서 **지금 데이터베이스 스키마 동기화**를 클릭하여 수동으로 동기화합니다. |
| 성능 모니터링 | 느린 쿼리의 경우 Doris에서 `SHOW QUERY PROFILE`을 사용하여 성능 병목을 분석합니다. |

### 데이터 타입 표시 이상 {#abnormal-data-type-display}

Metabase에서 데이터 타입이 비정상적으로 표시되면 먼저 최신 버전의 Doris Driver를 사용하고 있는지 확인합니다. Doris `largeint` 타입은 SQL에서 명시적으로 변환해야 합니다.

```sql
SELECT CAST(large_int_col AS STRING) FROM table
```
