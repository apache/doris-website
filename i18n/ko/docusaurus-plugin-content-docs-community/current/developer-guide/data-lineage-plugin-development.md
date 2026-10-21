---
title: 데이터 계보 플러그인 개발
language: ko
description: 계보 이벤트를 로그에 기록하거나 외부 거버넌스 시스템으로 전달하는 Apache Doris 데이터 계보 플러그인을 개발, 패키징, 배포하고 검증하는 방법을 설명합니다.
keywords:
    - Apache Doris
    - 데이터 계보
    - LineagePlugin
    - LineagePluginFactory
    - ServiceLoader
    - 플러그인 개발
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

<!-- Knowledge type: Extension development -->
<!-- Applicable scenario: Data governance integration / Kernel extension development -->

이 문서에서는 Apache Doris용 외부 데이터 계보 플러그인을 개발하는 방법을 설명합니다. 플러그인은 지원되는 DML 문이 성공한 후 `LineageInfo` 이벤트를 수신하고, 이벤트를 변환하여 로그, 메시징 시스템 또는 외부 메타데이터 거버넌스 플랫폼에 기록합니다.

> 적용 버전: Apache Doris 커뮤니티 에디션 4.0.6 이상. FE에 배포된 Doris 커뮤니티 릴리스 또는 소스 리비전과 정확히 일치하는 버전을 기준으로 플러그인을 컴파일하세요.

## 범위 및 수명 주기 {#scope-and-lifecycle}

계보 프레임워크는 FE 측 SPI입니다. 계보 데이터를 저장하거나, 쿼리 API를 제공하거나, 계보 그래프를 렌더링하지 않습니다. 플러그인은 `LineageInfo`에 있는 메모리 내 Java 객체를 다운스트림 시스템에서 요구하는 형식과 전송 프로토콜로 변환합니다.

현재 구현은 성공한 `INSERT INTO ... SELECT`, `INSERT OVERWRITE TABLE ... SELECT`, `CREATE TABLE AS SELECT` 문에 대해서만 이벤트를 생성합니다. `VALUES`만 사용하는 쓰기와 대상이 `__internal_schema`인 쓰기는 건너뜁니다. `SELECT`, `UPDATE`, `DELETE` 및 데이터 적재 작업은 이 프레임워크의 범위에 포함되지 않습니다. 일부 `UPDATE` 및 `DELETE` 실행 경로는 내부적으로 Insert 명령을 재사용하지만, 원래 명령 유형을 확인하는 검사에서 이러한 명령을 계보 이벤트 제출 대상에서 제외합니다.

![데이터 계보 수집 아키텍처: 성공한 지원 대상 DML 문을 Nereids가 분석하고 LineageInfo로 추출한 다음, FE의 큐에 넣고 플러그인을 통해 외부 거버넌스 시스템으로 전달합니다.](/images/data-lineage/lineage-architecture.svg)

`eventFilter()`는 DML 쿼리 경로에서 계보 추출 전에 한 번 호출되고, 워커가 이벤트를 전달하기 전에 다시 호출됩니다. 플러그인이 이벤트를 수신하지 않아야 할 때는 `false`를 반환하세요. 이 메서드는 쿼리 스레드와 워커 스레드에서 동시에 호출되므로 스레드 안전성을 보장해야 합니다. `exec()`는 하나의 워커 스레드에서 호출되지만, `eventFilter()`와 동시에 실행될 수 있습니다.

FE가 시작되면 ServiceLoader가 먼저 각 `LineagePluginFactory`를 검색합니다. 그런 다음 FE는 Factory의 `create(context)` 메서드를 호출하고, 반환된 플러그인의 `initialize(context)`를 호출합니다. 기본 `LineagePluginFactory.create(context)` 구현은 인수가 없는 `create()`에 위임하므로, 이 가이드의 최소 예제에서는 `create()`만 구현합니다. `PluginContext`는 `getProperties()`를 통해 변경할 수 없는 속성 맵을 제공합니다. FE는 플러그인 이름과 디렉터리를 `plugin.name` 및 `plugin.path` 항목에 저장합니다. 이 값은 `context.getProperties().get("plugin.name")`과 `context.getProperties().get("plugin.path")`로 읽을 수 있습니다. 플러그인 디렉터리에서 설정 파일을 읽는 운영용 플러그인은 `initialize(context)`를 재정의하고, `plugin.path` 항목을 통해 파일을 찾은 뒤 해당 메서드에서 리소스를 초기화할 수 있습니다.

## 계보 이벤트 모델 {#lineage-event-model}

`LineageInfo`에는 대상 테이블, 대상 출력 컬럼, 소스 테이블, 직접 계보, 간접 계보 및 `LineageContext`가 포함됩니다.

| 구성 요소 | 의미 |
| --- | --- |
| 대상 | 쓰기 대상 테이블과 출력 컬럼입니다. |
| 소스 테이블 | 분석된 논리 계획에서 참조하는 테이블입니다. |
| 직접 계보 | 각 출력 Slot을 소스 표현식에 매핑하며, `IDENTITY`, `TRANSFORMATION` 또는 `AGGREGATION`으로 분류합니다. |
| 데이터셋 간접 계보 | 전체 결과 집합에 영향을 미치는 표현식으로, `JOIN`, `FILTER`, `GROUP_BY`, `SORT`가 있습니다. |
| 출력 간접 계보 | 특정 출력 컬럼에 영향을 미치는 의존성으로, `WINDOW`와 `CONDITIONAL`이 있습니다. |
| 쿼리 컨텍스트 | 쿼리 ID, SQL 텍스트, 사용자, 클라이언트 IP, 세션 데이터베이스와 Catalog, 실행 상태, 타임스탬프, 소요 시간 및 민감 정보가 제거된 외부 Catalog 속성입니다. |

직접 계보는 출력 값이 생성되는 방식을 설명합니다. 단순한 소스 컬럼 참조는 `IDENTITY`이며, 예를 들면 `target.customer_id <- source.customer_id`입니다. 집계 함수를 포함하지 않는 계산, 함수, 윈도우 표현식 또는 조건식은 `TRANSFORMATION`이며, 예를 들면 `UPPER(source.region)`입니다. 집계 함수를 포함하는 표현식은 `AGGREGATION`이며, 예를 들면 `SUM(source.amount)`입니다. 간접 계보는 출력 값으로 직접 사용되지는 않지만 출력에 영향을 미치는 표현식을 기록합니다. 여기에는 Join 키, `WHERE` 및 `HAVING` 조건식, 그룹화 키, 정렬 키가 포함됩니다. `WINDOW`는 윈도우 파티셔닝 및 정렬에 사용되는 입력을 기록합니다. `CONDITIONAL`은 `CASE`, `IF` 또는 `COALESCE`가 특정 출력 컬럼에 미치는 영향을 기록합니다.

### 계보 이벤트 모델 예제 {#lineage-event-model-example}

다음 예제는 하나의 소스 테이블과 하나의 대상 테이블을 사용하여 세 가지 직접 계보 유형, 데이터셋 간접 계보 및 출력 간접 계보를 모두 보여 줍니다. 현재 사용자에게는 데이터베이스 및 테이블 생성, 데이터 쓰기, 데이터 쿼리 권한이 있어야 합니다.

```sql
CREATE DATABASE IF NOT EXISTS lineage_demo;
USE lineage_demo;

CREATE TABLE lineage_source (
    region VARCHAR(32),
    amount DECIMAL(18, 2),
    status VARCHAR(16)
)
DUPLICATE KEY(region)
DISTRIBUTED BY HASH(region) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE lineage_target (
    region VARCHAR(32),
    total_amount DECIMAL(18, 2),
    region_seq BIGINT,
    region_group VARCHAR(16)
)
DUPLICATE KEY(region)
DISTRIBUTED BY HASH(region) BUCKETS 1
PROPERTIES ("replication_num" = "1");

INSERT INTO lineage_source VALUES
    ('east', 100.00, 'PAID'),
    ('east', 30.00, 'CANCELLED'),
    ('west', 80.00, 'PAID');

INSERT INTO lineage_target
SELECT
    region,
    SUM(amount) AS total_amount,
    ROW_NUMBER() OVER (ORDER BY region) AS region_seq,
    CASE
        WHEN region = 'east' THEN 'CORE'
        ELSE 'OTHER'
    END AS region_group
FROM lineage_source
WHERE status = 'PAID'
GROUP BY region
ORDER BY SUM(amount) DESC;

SELECT region, total_amount, region_seq, region_group
FROM lineage_target
ORDER BY region;
```

쿼리는 다음 결과를 반환합니다.

```text
+--------+--------------+------------+--------------+
| region | total_amount | region_seq | region_group |
+--------+--------------+------------+--------------+
| east   |       100.00 |          1 | CORE         |
| west   |        80.00 |          2 | OTHER        |
+--------+--------------+------------+--------------+
```

첫 번째 Insert는 `VALUES`만 사용하므로 이벤트를 생성하지 않습니다. `INSERT INTO lineage_target ... SELECT`가 성공하면 해당 이벤트에 다음 주요 관계가 포함됩니다.

| 계보 수준 | 이 예제의 내용 |
| --- | --- |
| 테이블 계보 | `internal.lineage_demo.lineage_source` -> `internal.lineage_demo.lineage_target`. |
| 직접 컬럼 계보 | `region`은 `IDENTITY`이고, `total_amount`는 `AGGREGATION`이며, `region_seq`와 `region_group`은 `TRANSFORMATION`입니다. |
| 데이터셋 간접 계보 | `FILTER`는 `status = 'PAID'`이고, `GROUP_BY`는 `region`이며, `SORT`는 `SUM(amount) DESC`입니다. |
| 출력 간접 계보 | `WINDOW` 의존성은 `region_seq`의 경우 `region`이며, `CONDITIONAL` 의존성은 `region_group`의 경우 `region = 'east'`입니다. |
| 쿼리 컨텍스트 | 실제 쿼리 ID, 위의 Insert SQL, 실행 사용자 및 클라이언트 IP를 포함합니다. 세션 데이터베이스는 `lineage_demo`, Internal Catalog은 `internal`, 실행 상태는 `OK`입니다. |

이 예제에는 Join이 없으므로 데이터셋 수준의 `JOIN` 의존성도 없습니다. Join이 있는 쿼리는 Join 조건을 데이터셋 수준의 `JOIN` 의존성으로 기록합니다.

이벤트가 플러그인에 도달하기 전에 추출기는 CTE 프로듀서 표현식을 해석하고 `UNION` 분기를 확장합니다. 그래도 플러그인은 `Expression`, `SlotReference`, `TableIf`를 Doris 내부 Java 객체로 취급하고, FE 외부로 보내기 전에 안정적인 이름이나 다운스트림 스키마로 변환해야 합니다.

## 플러그인 API 참조 {#plugin-api-reference}

계보 SPI는 FE 시작 시 검색되는 Factory, 해당 Factory가 생성하는 플러그인 인스턴스, 변경할 수 없는 런타임 컨텍스트, 플러그인에 전달되는 `LineageInfo` 이벤트로 구성됩니다. 다음 요약은 플러그인 구현에서 직접 사용하는 확장 메서드를 보여 줍니다.

### API 요약 {#api-summary}

| 메서드 | 입력 | 반환 유형 | 용도 |
| --- | --- | --- | --- |
| `LineagePluginFactory.name()` | 없음 | `String` | `activate_lineage_plugin`에서 사용하는 고유한 Factory 이름을 반환합니다. |
| `LineagePluginFactory.create()` | 없음 | `LineagePlugin` | Factory에서 런타임 컨텍스트를 읽지 않고 플러그인 인스턴스를 생성합니다. |
| `LineagePluginFactory.create(PluginContext)` | `PluginContext` | `LineagePlugin` | 런타임 컨텍스트에 접근하여 플러그인 인스턴스를 생성합니다. 기본 구현은 `create()`에 위임합니다. |
| `LineagePlugin.name()` | 없음 | `String` | 플러그인 이름을 반환합니다. Factory 이름과 일치해야 합니다. |
| `LineagePlugin.eventFilter()` | 없음 | `boolean` | 플러그인이 현재 계보 이벤트를 수신하려는지 나타냅니다. |
| `LineagePlugin.exec(LineageInfo)` | `LineageInfo` | `boolean` | 계보 이벤트 하나를 처리합니다. |
| `Plugin.initialize(PluginContext)` | `PluginContext` | `void` | Factory가 플러그인을 생성한 후 리소스를 초기화합니다. 기본 구현은 아무 작업도 하지 않습니다. |
| `Plugin.close()` | 없음 | `void` | 플러그인 리소스를 해제하기 위한 수명 주기 훅입니다. 기본 구현은 아무 작업도 하지 않습니다. |
| `PluginContext.getProperties()` | 없음 | `Map<String, String>` | 변경할 수 없는 런타임 속성 맵을 반환합니다. |

### `LineagePluginFactory` {#lineagepluginfactory}

`LineagePluginFactory`는 ServiceLoader의 진입점입니다. FE는 Factory를 검색하고, `name()`이 반환하는 값으로 필터링한 다음 플러그인 인스턴스 하나를 생성합니다.

```java
String name();
LineagePlugin create();
default LineagePlugin create(PluginContext context);
```

#### `name()` {#name}

- **입력:** 없음.
- **반환값:** `String`. 대소문자를 구분하는 고유한 Factory 식별자입니다.
- **동작:** 이 값을 `activate_lineage_plugin`의 각 항목과 비교합니다. 예제에서는 `example-lineage`를 반환합니다.

#### `create()` {#create}

- **입력:** 없음.
- **반환값:** 새로운 `LineagePlugin` 인스턴스입니다.
- **동작:** 플러그인을 생성할 때 런타임 컨텍스트가 필요하지 않으면 이 메서드를 구현합니다. 기본 `create(PluginContext)` 메서드는 이 메서드에 위임합니다.

#### `create(PluginContext context)` {#createplugincontext-context}

- **입력:** `PluginContext context`. 이 플러그인 디렉터리를 위해 준비된, 변경할 수 없는 런타임 컨텍스트입니다.
- **반환값:** 새로운 `LineagePlugin` 인스턴스입니다.
- **동작:** Factory 자체가 생성 과정에서 런타임 속성을 필요로 할 때만 이 메서드를 재정의합니다. FE는 생성 후 반환된 플러그인의 `initialize(context)`를 호출합니다.

생성 중에 `null`을 반환하거나 예외가 발생하면 해당 플러그인은 로드되지 않습니다. 플러그인 검색은 FE 시작 중에 수행되므로 Factory 메서드에서 오래 걸리는 다운스트림 호출을 수행하지 마세요.

### `LineagePlugin` {#lineageplugin}

`LineagePlugin`은 계보 이벤트를 수신하며, `initialize()` 및 `close()` 수명 주기 메서드를 `Plugin`에서 상속합니다.

```java
String name();
boolean eventFilter();
boolean exec(LineageInfo lineageInfo);
default void initialize(PluginContext context);
default void close();
```

#### `name()` {#name-1}

- **입력:** 없음.
- **반환값:** `String`. 플러그인 식별자입니다.
- **동작:** `LineagePluginFactory.name()`과 동일한 고정 식별자를 반환하여 활성화, 로그 및 운영 설정에서 하나의 이름을 사용하도록 합니다.

#### `eventFilter()` {#eventfilter}

- **입력:** 없음.
- **반환값:** `boolean`. `true`는 플러그인이 계보 이벤트를 수신하려는 것을 의미하고, `false`는 FE가 해당 플러그인을 건너뛰는 것을 의미합니다.
- **동작:** FE는 쿼리 스레드에서 계보 추출 전에 이 메서드를 호출하고, 계보 워커 스레드에서 이벤트를 전달하기 전에 다시 호출합니다. 스레드 안전성을 보장해야 하며 빠르게 반환해야 합니다. 로드된 모든 플러그인이 추출 전에 `false`를 반환하면 FE는 해당 문의 계보 추출을 건너뜁니다.

#### `exec(LineageInfo lineageInfo)` {#execlineageinfo-lineageinfo}

- **입력:** `LineageInfo lineageInfo`. 지원되는 DML 문이 성공한 후 추출된 계보 이벤트 하나입니다.
- **반환값:** `boolean`. `true`는 호출자에게 성공을 알리고, `false`는 실패를 알립니다.
- **동작:** 하나의 계보 워커 스레드가 `exec()`를 호출하지만, 쿼리 스레드의 `eventFilter()` 호출과 동시에 실행될 수 있습니다. 현재 프레임워크는 `exec()`가 `false`를 반환해도 재시도하거나, 이벤트를 큐에 다시 넣거나, DML 상태를 변경하지 않습니다. 예외가 발생하면 로그에 기록하고 이후 플러그인이나 이벤트의 처리를 계속합니다.

#### `initialize(PluginContext context)` {#initializeplugincontext-context}

- **입력:** `PluginContext context`. Factory에 제공된 것과 동일한 런타임 컨텍스트입니다.
- **반환값:** `void`.
- **동작:** FE는 플러그인을 생성한 후 이 메서드를 호출합니다. 이 메서드를 재정의하여 `plugin.path`에서 설정을 읽거나, 클라이언트를 생성하거나, 다른 리소스를 할당할 수 있습니다. 예외가 발생하면 플러그인은 로드되지 않습니다.

#### `close()` {#close}

- **입력:** 없음.
- **반환값:** `void`.
- **동작:** 상속된 이 수명 주기 훅은 리소스 정리를 위한 것입니다. 현재 계보 프로세서에는 동적 언로드 또는 다시 로드하는 경로가 없으므로, 플러그인은 JAR 교체 시 `close()`가 호출될 것이라고 가정해서는 안 됩니다. JAR을 교체한 후에도 FE를 다시 시작해야 합니다.

### `PluginContext` {#plugincontext}

```java
Map<String, String> getProperties();
```

`getProperties()`는 입력을 받지 않으며 변경할 수 없는 `Map<String, String>`을 반환합니다. 계보 로더는 다음 항목을 제공합니다.

| 속성 | 유형 | 의미 |
| --- | --- | --- |
| `plugin.name` | `String` | 검색된 Factory가 반환한 이름입니다. |
| `plugin.path` | `String` | 외부 플러그인 디렉터리의 절대 경로입니다. |

이 값은 `context.getProperties().get("plugin.name")`과 `context.getProperties().get("plugin.path")`로 읽습니다. 이 맵은 수정할 수 없습니다. 플러그인은 `plugin.path`를 사용하여 자체 설정 파일을 찾을 수 있지만, 디렉터리 이름이 Factory 이름과 같다고 가정해서는 안 됩니다.

### `LineageInfo` {#lineageinfo}

`LineageInfo`는 `exec()`의 입력 유형입니다. 플러그인은 다음 메서드를 통해 이 객체를 읽고 Doris 객체를 다운스트림 이벤트 스키마로 변환해야 합니다.

| 메서드 | 반환 유형 | 의미 |
| --- | --- | --- |
| `getTargetTable()` | `TableIf` | 쓰기 대상 테이블입니다. |
| `getTargetColumns()` | `List<Slot>` | 쓰기 순서대로 나열된 대상 출력 컬럼입니다. |
| `getTableLineageSet()` | `Set<TableIf>` | 분석된 계획에서 참조하는 소스 테이블입니다. |
| `getDirectLineageMap()` | `Map<SlotReference, SetMultimap<DirectLineageType, Expression>>` | 각 출력 Slot의 직접 소스 표현식입니다. |
| `getDatasetIndirectLineageMap()` | `Multimap<IndirectLineageType, Expression>` | 데이터셋 수준의 `JOIN`, `FILTER`, `GROUP_BY`, `SORT` 의존성입니다. |
| `getInDirectLineageMapByDataset()` | `Map<SlotReference, SetMultimap<IndirectLineageType, Expression>>` | 데이터셋 수준의 의존성을 모든 출력 Slot에 적용한 파생 뷰입니다. `WINDOW`와 `CONDITIONAL`은 제외됩니다. |
| `getOutputIndirectLineageMap()` | `Map<SlotReference, SetMultimap<IndirectLineageType, Expression>>` | 각 출력의 `WINDOW` 및 `CONDITIONAL` 의존성입니다. |
| `getContext()` | `LineageContext` | 이 이벤트의 쿼리 및 실행 메타데이터입니다. |

`LineageInfo`는 FE 추출기에서 사용하는 setter 및 `add*` 메서드도 제공합니다. 싱크 플러그인은 일반적으로 위의 getter를 통해 객체를 읽으며, 이벤트를 수정해서는 안 됩니다. 반환되는 `TableIf`, `Slot`, `SlotReference`, `Expression` 값은 Doris 런타임 객체이며, 전송 형식에서 사용할 수 있는 안정적인 식별자가 아닙니다.

### `LineageContext` {#lineagecontext}

`LineageContext`는 `LineageInfo.getContext()`가 반환합니다. 이 객체의 getter는 입력을 받지 않습니다.

| 메서드 | 반환 유형 | 의미 |
| --- | --- | --- |
| `getSourceCommand()` | `Class<? extends Command>` | 이벤트를 생성한 명령 클래스입니다. 예를 들면 `InsertIntoTableCommand`입니다. |
| `getQueryId()` | `String` | 쿼리 ID입니다. |
| `getQueryText()` | `String` | 원래 DML 텍스트입니다. |
| `getUser()` | `String` | 실행 사용자입니다. |
| `getClientIp()` | `String` | 클라이언트 IP 주소입니다. |
| `getState()` | `String` | 쿼리 실행 상태입니다. |
| `getDatabase()` | `String` | 세션 데이터베이스입니다. 대상 테이블의 데이터베이스와 반드시 같지는 않습니다. |
| `getCatalog()` | `String` | 세션 Catalog입니다. 대상 테이블의 Catalog과 반드시 같지는 않습니다. |
| `getTimestampMs()` | `long` | 밀리초 단위의 이벤트 타임스탬프이며, 사용할 수 없으면 `-1`입니다. |
| `getDurationMs()` | `long` | 밀리초 단위의 쿼리 소요 시간이며, 사용할 수 없으면 `-1`입니다. |
| `getExternalCatalogProperties()` | `Map<String, Map<String, String>>` | 쿼리에서 참조하는 외부 Catalog의 속성으로, 민감 정보가 제거되어 있습니다. |

원래 SQL, 사용자, 클라이언트 IP, 표현식 및 외부 Catalog 속성에는 민감한 데이터가 포함될 수 있습니다. 운영용 플러그인은 이를 외부로 내보내기 전에 자체 접근 제어, 마스킹, 크기 제한 및 보존 정책을 적용해야 합니다.

## 플러그인 개발 {#develop-a-plugin}

이 절에서는 공개 `4.0.6` 태그의 소스를 공식 `github.com/apache/doris` 커뮤니티 저장소에서 가져와 소스 트리 안에 `example-lineage` Maven 하위 모듈을 추가합니다. 플러그인은 각 이벤트를 FE 로그에만 기록합니다. HTTP 서비스를 시작하지 않으며 외부 거버넌스 플랫폼에 의존하지도 않습니다. 이 구현은 플러그인을 개발하고 로드하는 전체 과정을 보여 줍니다. 운영용 플러그인은 `LineageInfo`를 타사 스키마로 변환하거나, OpenMetadata와 같은 메타데이터 플랫폼에서 제공하는 API를 호출하거나, OpenLineage 명세를 따르는 계보 이벤트를 내보낼 수 있습니다. 아래의 모든 소스 경로는 동일한 Doris 소스 루트를 기준으로 한 상대 경로입니다.

### 1단계: Doris 소스 준비 {#step-1-prepare-the-doris-source}

대상 FE와 정확히 일치하는 공개 릴리스를 체크아웃하고 소스 루트를 `DORIS_SOURCE`에 저장합니다.

```shell
git clone https://github.com/apache/doris.git
export DORIS_SOURCE="$(pwd)/doris"
cd "${DORIS_SOURCE}"
git checkout 4.0.6
```

이후의 모든 `$DORIS_SOURCE/fe_plugins/...` 경로는 이 소스 디렉터리를 가리킵니다. 이를 FE 설치 디렉터리로 바꾸지 말고, 다른 버전의 FE JAR을 기준으로 컴파일하지 마세요.

### 2단계: Maven 모듈 생성 {#step-2-create-the-maven-modules}

Doris 소스 루트에서 다음 명령을 실행합니다.

```shell
cd "${DORIS_SOURCE}"
mkdir -p fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example
mkdir -p fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services
```

이 절을 마치면 새 파일의 구조는 다음과 같습니다.

```text
$DORIS_SOURCE/
└── fe_plugins/
    ├── pom.xml                                      # Existing file; add the lineage module
    └── lineage/
        ├── pom.xml
        └── example-lineage/
            ├── pom.xml
            └── src/main/
                ├── java/org/apache/doris/plugin/lineage/example/
                │   ├── ExampleLineagePluginFactory.java
                │   └── LoggingLineagePlugin.java
                └── resources/META-INF/services/
                    └── org.apache.doris.nereids.lineage.LineagePluginFactory
```

기존 `$DORIS_SOURCE/fe_plugins/pom.xml`을 편집하여 `lineage`를 `<modules>`에 추가합니다. 기존 모듈은 모두 유지하고, 전체 파일을 이 코드 조각으로 대체하지 마세요.

```xml
<modules>
    <!-- Keep the modules already present in fe_plugins/pom.xml -->
    <module>lineage</module>
</modules>
```

`$DORIS_SOURCE/fe_plugins/lineage/pom.xml`을 생성합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.apache.doris</groupId>
        <artifactId>fe-plugins</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>lineage</artifactId>
    <packaging>pom</packaging>
    <modules>
        <module>example-lineage</module>
    </modules>
</project>
```

`$DORIS_SOURCE/fe_plugins/lineage/example-lineage/pom.xml`을 생성합니다.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.apache.doris</groupId>
        <artifactId>lineage</artifactId>
        <version>1.0-SNAPSHOT</version>
        <relativePath>../pom.xml</relativePath>
    </parent>
    <artifactId>example-lineage</artifactId>
    <packaging>jar</packaging>
    <dependencies>
        <dependency>
            <groupId>org.apache.doris</groupId>
            <artifactId>fe-core</artifactId>
            <version>${doris.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.doris</groupId>
            <artifactId>fe-extension-spi</artifactId>
            <version>${doris.version}</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.apache.logging.log4j</groupId>
            <artifactId>log4j-api</artifactId>
            <scope>provided</scope>
        </dependency>
    </dependencies>
    <build>
        <finalName>example-lineage</finalName>
    </build>
</project>
```

FE가 이러한 API를 제공하므로 모든 의존성은 `provided`를 사용합니다. 플러그인 JAR에 Doris 또는 Log4j 클래스를 패키징하지 마세요.

### 3단계: Factory 구현 {#step-3-implement-the-factory}

`$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/ExampleLineagePluginFactory.java`를 생성합니다.

```java
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.doris.plugin.lineage.example;

import org.apache.doris.nereids.lineage.LineagePlugin;
import org.apache.doris.nereids.lineage.LineagePluginFactory;

/** Factory discovered by ServiceLoader at FE startup. */
public class ExampleLineagePluginFactory implements LineagePluginFactory {
    @Override
    public String name() {
        return "example-lineage";
    }

    @Override
    public LineagePlugin create() {
        return new LoggingLineagePlugin();
    }
}
```

`example-lineage`는 `name()`이 반환하는 값으로, 고유한 플러그인 식별자입니다. 뒤에서 설정할 `activate_lineage_plugin`에도 정확히 같은 값을 사용해야 합니다.

### 4단계: 로깅 플러그인 구현 {#step-4-implement-the-logging-plugin}

`$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/java/org/apache/doris/plugin/lineage/example/LoggingLineagePlugin.java`를 생성합니다.

```java
// Licensed to the Apache Software Foundation (ASF) under one
// or more contributor license agreements.  See the NOTICE file
// distributed with this work for additional information
// regarding copyright ownership.  The ASF licenses this file
// to you under the Apache License, Version 2.0 (the
// "License"); you may not use this file except in compliance
// with the License.  You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
// KIND, either express or implied.  See the License for the
// specific language governing permissions and limitations
// under the License.

package org.apache.doris.plugin.lineage.example;

import org.apache.doris.catalog.TableIf;
import org.apache.doris.nereids.lineage.LineageContext;
import org.apache.doris.nereids.lineage.LineageInfo;
import org.apache.doris.nereids.lineage.LineagePlugin;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.util.Objects;
import java.util.stream.Collectors;

/** Minimal lineage plugin that writes one summary line for each event. */
public class LoggingLineagePlugin implements LineagePlugin {
    private static final Logger LOG = LogManager.getLogger(LoggingLineagePlugin.class);
    private static final String PLUGIN_NAME = "example-lineage";

    @Override
    public String name() {
        return PLUGIN_NAME;
    }

    @Override
    public boolean eventFilter() {
        return true;
    }

    @Override
    public boolean exec(LineageInfo lineageInfo) {
        if (lineageInfo == null) {
            return false;
        }

        LineageContext context = lineageInfo.getContext();
        LOG.info("LINEAGE_EVENT queryId={} command={} user={} clientIp={} "
                        + "catalog={} database={} state={} durationMs={} target={} sources={} "
                        + "direct={} datasetIndirect={} outputIndirect={}",
                value(context == null ? null : context.getQueryId()),
                command(context),
                value(context == null ? null : context.getUser()),
                value(context == null ? null : context.getClientIp()),
                value(context == null ? null : context.getCatalog()),
                value(context == null ? null : context.getDatabase()),
                value(context == null ? null : context.getState()),
                context == null ? -1L : context.getDurationMs(),
                tableName(lineageInfo.getTargetTable()),
                sourceTables(lineageInfo),
                lineageInfo.getDirectLineageMap(),
                lineageInfo.getDatasetIndirectLineageMap(),
                lineageInfo.getOutputIndirectLineageMap());
        return true;
    }

    private String sourceTables(LineageInfo lineageInfo) {
        if (lineageInfo.getTableLineageSet() == null) {
            return "[]";
        }
        return lineageInfo.getTableLineageSet().stream()
                .filter(Objects::nonNull)
                .map(TableIf::getNameWithFullQualifiers)
                .sorted()
                .collect(Collectors.joining(",", "[", "]"));
    }

    private String tableName(TableIf table) {
        return table == null ? "" : table.getNameWithFullQualifiers();
    }

    private String command(LineageContext context) {
        return context == null || context.getSourceCommand() == null
                ? "" : context.getSourceCommand().getSimpleName();
    }

    private String value(String value) {
        return value == null ? "" : value;
    }
}
```

이 예제는 원래 SQL, 외부 Catalog 속성 또는 인증 정보를 로그에 기록하지 않습니다. 다만 직접 및 간접 계보 표현식에는 SQL 리터럴이 포함될 수 있으므로 이 구현은 개발 단계의 검증에만 사용하세요. 운영용 플러그인은 보안 정책에 따라 표현식에서 민감 정보를 제거하고, 각 로그 항목의 길이를 제한하며, 사용자 및 클라이언트 IP 값을 기록할지 결정해야 합니다.

### 5단계: Factory 등록 {#step-5-register-the-factory}

`$DORIS_SOURCE/fe_plugins/lineage/example-lineage/src/main/resources/META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory`를 생성합니다. 이 파일에는 정규화된 Factory 클래스 이름만 포함합니다.

```text
org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory
```

각 외부 플러그인 디렉터리는 하나의 `LineagePluginFactory`만 제공할 수 있습니다. 또한 Factory 이름은 로드된 모든 플러그인에서 고유해야 합니다.

### 6단계: 플러그인 빌드 {#step-6-build-the-plugin}

이 소스 디렉터리에서 플러그인을 처음 빌드하기 전에 [Linux](/community/source-install/compilation-linux) 또는 [macOS](/community/source-install/compilation-mac)용 Doris 소스 빌드 환경을 준비한 다음 FE를 한 번 빌드합니다. 다음 환경 변수는 계보 플러그인 빌드에 필요하지 않은 UI, Hive UDF 및 BE Java 확장만 비활성화합니다. FE 빌드는 건너뛰지 않습니다.

```shell
cd "${DORIS_SOURCE}"
DISABLE_BUILD_UI=ON \
DISABLE_BE_JAVA_EXTENSIONS=ON \
DISABLE_BUILD_HIVE_UDF=ON \
./build.sh --fe
```

이 단계에서는 Thrift 및 Protobuf 소스를 생성하고 FE를 빌드합니다. 새로 체크아웃한 소스 트리에서 이 단계를 건너뛰고 아래 Maven 명령을 바로 실행하지 마세요. `org.apache.doris.thrift`와 같은 생성된 클래스가 없어 컴파일에 실패합니다. 동일한 소스 버전에서 `./build.sh --fe`가 이미 성공했다면 이 단계를 반복할 필요는 없습니다.

다음으로 플러그인에 필요한 FE 모듈을 로컬 Maven 저장소에 설치한 후 플러그인 하위 모듈을 빌드합니다.

```shell
cd "${DORIS_SOURCE}"
mvn -f fe/pom.xml install \
  -pl fe-common,fe-extension-spi,fe-extension-loader,fe-core \
  -DskipTests -Dcheckstyle.skip=true
mvn -f fe_plugins/pom.xml -pl lineage/example-lineage -am clean package \
  -DskipTests -Dcheckstyle.skip=true
```

빌드에 성공하면 다음 파일이 생성됩니다.

```text
$DORIS_SOURCE/fe_plugins/lineage/example-lineage/target/example-lineage.jar
```

SPI 파일과 JAR 내용을 확인합니다.

```shell
PLUGIN_JAR="${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar"
unzip -p "${PLUGIN_JAR}" \
  META-INF/services/org.apache.doris.nereids.lineage.LineagePluginFactory
if jar tf "${PLUGIN_JAR}" | grep -qE '^org/apache/doris/(nereids|extension)/'; then
  echo "ERROR: Doris API classes must not be packaged in the plugin JAR" >&2
  exit 1
fi
```

첫 번째 명령은 `org.apache.doris.plugin.lineage.example.ExampleLineagePluginFactory`를 출력해야 합니다. 이어지는 검사는 JAR에 Doris API 클래스가 없으면 아무것도 출력하지 않고 영을 반환합니다.

### 7단계: 플러그인 배포 및 활성화 {#step-7-deploy-and-activate-the-plugin}

이 절에서 `FE_HOME`은 `bin/`, `conf/`, `lib/`를 포함하는 하나의 FE 설치 디렉터리를 의미하며, Doris 소스 디렉터리가 아닙니다. `start_fe.sh`는 이 디렉터리를 FE 프로세스의 `DORIS_HOME`으로 설정합니다. 모든 FE에 JAR을 복사합니다.

```shell
export FE_HOME=/opt/apache-doris/fe
mkdir -p "${FE_HOME}/plugins/lineage/example-lineage"
cp "${DORIS_SOURCE}/fe_plugins/lineage/example-lineage/target/example-lineage.jar" \
  "${FE_HOME}/plugins/lineage/example-lineage/"
```

FE를 실행하는 운영체제 사용자는 플러그인 디렉터리와 JAR을 읽을 수 있어야 합니다.

배포된 디렉터리 구조는 다음과 같습니다.

```text
$FE_HOME/
└── plugins/
    └── lineage/
        └── example-lineage/
            └── example-lineage.jar
```

모든 FE에서 `$FE_HOME/conf/fe.conf`를 편집합니다.

```text
plugin_dir = /opt/apache-doris/fe/plugins
activate_lineage_plugin = example-lineage
lineage_event_queue_size = 50000
```

| 설정 | 유형 및 기본값 | 필수 여부 | 효과 |
| --- | --- | --- | --- |
| `plugin_dir` | 문자열; `$FE_HOME/plugins` | 아니요 | 플러그인 루트 디렉터리입니다. 계보 로더는 그 아래 `lineage/`의 직계 하위 디렉터리를 검색합니다. 기본 디렉터리를 사용한다면 이 설정을 생략하세요. |
| `activate_lineage_plugin` | 문자열 배열; 비어 있음 | 명시적 설정 권장 | 인스턴스를 생성할 Factory 이름을 쉼표로 구분한 목록입니다. 값이 비어 있으면 검색된 모든 Factory의 인스턴스를 생성합니다. |
| `lineage_event_queue_size` | 양의 정수; `50000` | 아니요 | 현재 FE에서 워커의 처리를 기다릴 수 있는 최대 이벤트 수입니다. 큐가 가득 차면 새 이벤트는 버려집니다. |

이 설정은 현재 FE 프로세스에 적용되며 시작 시에만 읽습니다. DML을 실행할 수 있는 모든 FE에 플러그인을 배포하고 설정하세요. 설정을 변경하거나 JAR을 교체한 후에는 해당 FE를 다시 시작해야 합니다. 이 설정은 `ADMIN SET FRONTEND CONFIG`를 통해 동적으로 변경할 수 없습니다.

## 플러그인 검증 {#verify-the-plugin}

FE를 다시 시작한 후 먼저 플러그인이 로드되었는지 확인합니다. FE 로그 디렉터리를 사용자 지정했다면 `FE_LOG`를 실제 `fe.log` 경로로 바꾸세요.

```shell
export FE_LOG="${FE_HOME}/log/fe.log"
grep 'Loaded lineage plugin: example-lineage' "${FE_LOG}" | tail -1
```

앞의 [계보 이벤트 모델 예제](#lineage-event-model-example)를 실행한 다음 최신 이벤트를 조회합니다.

```shell
grep 'LINEAGE_EVENT' "${FE_LOG}" | tail -1
```

로그에는 실제 쿼리 ID, `InsertIntoTableCommand`, 대상 테이블 `lineage_target`, 소스 테이블 `lineage_source` 및 `direct`, `datasetIndirect`, `outputIndirect` 섹션이 포함되어야 합니다. 예를 들면 다음과 같습니다.

```text
LINEAGE_EVENT queryId=<query-id> command=InsertIntoTableCommand ...
target=internal.lineage_demo.lineage_target
sources=[internal.lineage_demo.lineage_source] direct={...}
datasetIndirect={...} outputIndirect={...}
```

실제 로그는 한 줄이며, 위에서는 읽기 쉽도록 줄을 나누었습니다. `INSERT INTO lineage_source VALUES ...`는 이벤트를 생성하지 않습니다. `INSERT INTO lineage_target ... SELECT`만 이 로그 항목을 생성합니다.

검증을 마치고 예제 데이터가 더 이상 필요하지 않으면 다음을 실행합니다.

```sql
DROP DATABASE lineage_demo;
```

## 신뢰성 및 문제 해결 {#reliability-and-troubleshooting}

| 상황 | 프레임워크 동작 | 플러그인 권장 사항 |
| --- | --- | --- |
| 큐가 가득 참 | 새 이벤트를 버리고 경고를 로그에 기록합니다. DML 결과에는 영향을 주지 않습니다. | `exec()`를 빠르게 유지하세요. 다운스트림 쓰기의 배치 처리나 버퍼링은 FE의 주요 처리 경로 밖에서 수행하세요. |
| `exec()`에서 예외 발생 | 워커는 예외를 로그에 기록하고 다음 플러그인이나 이벤트의 처리를 계속합니다. | 예상 가능한 다운스트림 오류를 처리하고, 재시도 횟수나 시간을 제한하며, 메트릭을 제공하세요. |
| `exec()`가 `false`를 반환 | 현재 프레임워크는 반환값을 무시합니다. 재시도하거나, 이벤트를 큐에 다시 넣거나, DML 상태를 변경하지 않습니다. | 실패를 기록하고 플러그인 내부에서 횟수나 시간이 제한된 재시도를 구현하세요. 복구를 반환값에 의존하지 마세요. |
| 플러그인이 느림 | 하나의 워커가 이벤트를 순차적으로 전달합니다. 느린 플러그인은 뒤따르는 모든 이벤트를 지연시킵니다. | 다운스트림 시스템이 느리면 크기가 제한된 내부 큐와 별도의 전송 스레드 풀을 사용하세요. |
| Factory 이름 중복 | 처음 검색된 Factory를 유지하고 중복된 Factory는 건너뜁니다. | 전역적으로 고유한 이름을 사용하세요. |
| 시작 후 JAR 변경 | 로더는 플러그인 디렉터리를 감시하거나 다시 로드하거나 언로드하지 않습니다. | JAR 또는 의존성을 교체한 후 FE를 다시 시작하세요. |

### FE 로그로 문제 진단 {#diagnose-problems-from-fe-logs}

| 로그 키워드 | 일반적인 원인 | 조치 |
| --- | --- | --- |
| `Skip lineage plugin directory due to load failure` | 플러그인 디렉터리에 JAR이 없거나, SPI 파일이 없거나, 디렉터리에서 여러 Factory를 제공하거나, 의존성 로드에 실패했습니다. | 디렉터리와 JAR을 확인하고, SPI 파일에 Factory 클래스 이름이 하나만 포함되어 있는지 확인한 다음, 예외의 `stage` 및 `message`를 확인하세요. |
| `Skip lineage plugin not in activate_lineage_plugin` | Factory가 검색되었지만 해당 `name()`이 활성화 목록에 없습니다. | Factory 이름을 `activate_lineage_plugin`과 비교하세요. 이름은 대소문자를 구분합니다. |
| `Failed to create/initialize lineage plugin` | `create(context)` 또는 `initialize(context)`에서 예외가 발생했습니다. | 스택 트레이스, 초기화 로직, 설정 파일 및 디렉터리 권한을 확인하세요. |
| `the lineage event queue is full` | 플러그인의 이벤트 소비 속도가 생성 속도보다 느리고, 현재 FE의 큐가 가득 찼습니다. | 먼저 `exec()` 처리 시간을 줄이고 다운스트림에서 처리가 차단되는 원인을 조사한 다음, `lineage_event_queue_size`를 늘릴지 검토하세요. |

### 플러그인 비활성화 및 롤백 {#disable-and-roll-back-the-plugin}

플러그인을 비활성화하려면 해당 FE를 중지하고, 플러그인 디렉터리를 `plugin_dir/lineage/` 밖으로 옮긴 다음, `example-lineage`를 `activate_lineage_plugin`에서 제거하고 FE를 시작합니다. JAR을 그대로 둔 채 `activate_lineage_plugin`만 비우지 마세요. 목록이 비어 있으면 검색된 모든 계보 플러그인이 활성화됩니다.

```shell
mkdir -p "${FE_HOME}/plugins-disabled"
mv "${FE_HOME}/plugins/lineage/example-lineage" \
  "${FE_HOME}/plugins-disabled/"
```

FE가 시작된 후 새 `Loaded lineage plugin: example-lineage` 항목이 나타나지 않는지 확인합니다. 플러그인을 복원하려면 디렉터리를 `${FE_HOME}/plugins/lineage/` 아래로 다시 옮기고, `activate_lineage_plugin`을 복원한 다음 FE를 다시 시작합니다.

계보 전달은 최선형 방식으로 동작하며 DML과 트랜잭션으로 묶이지 않습니다. DML이 성공해도 외부 거버넌스 시스템으로의 전달이 보장되지는 않습니다. 쿼리 ID와 대상 테이블을 사용하여 멱등성을 보장하는 다운스트림 이벤트 식별자를 구성하세요.
