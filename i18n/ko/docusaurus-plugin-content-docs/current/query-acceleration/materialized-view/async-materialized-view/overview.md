---
{
    "title": "비동기 구체화된 뷰 개요",
    "language": "ko",
    "description": "Doris 비동기 구체화된 뷰란 무엇일까요? 이 문서에서는 사용 사례, IVM 및 파티션 갱신 메커니즘, 투명 재작성 원리, 레이크하우스 쿼리 가속 기능을 소개합니다.",
    "keywords": ["Doris 비동기 구체화된 뷰", "구체화된 뷰", "증분 뷰 유지 관리", "IVM", "쿼리 가속", "투명 재작성", "레이크하우스 가속", "MTMV"]
}
---

<!-- Knowledge type: concept introduction + capability overview -->
<!-- Use cases: query acceleration, ETL simplification, lakehouse external table query acceleration, write performance optimization -->

비동기 구체화된 뷰는 뷰의 유연성과 물리적 테이블의 높은 성능을 결합한 쿼리 가속 솔루션입니다. 쿼리 결과를 미리 계산하여 저장하므로 후속 쿼리는 구체화된 결과 집합을 직접 활용할 수 있어, 복잡한 SQL을 반복해서 실행하는 오버헤드를 피할 수 있습니다.

## 빠르게 살펴보기 {#quick-tour}

비동기 구체화된 뷰를 사용하기 전에 다음 사항을 확인하세요.

- 업무에 쿼리 가속, ETL 간소화, 레이크하우스 외부 테이블 가속 또는 쓰기 최적화가 필요한가요?
- 쿼리가 SPJG(SELECT-PROJECT-JOIN-GROUP-BY) 패턴을 따르나요?
- 데이터에 최종 일관성(실시간이 아닌 동기화)을 적용해도 괜찮은가요?
- 기본 테이블의 Catalog가 지원 범위(Internal/Hive/Iceberg/Paimon/Hudi/JDBC/ES)에 포함되나요?
- 변경 사항이 소수의 파티션에 집중될 때 갱신 비용을 줄이기 위해 파티션 단위 증분 갱신이 필요한가요?
- 기본 테이블에서 삽입, 업데이트, 삭제가 자주 발생하지만 변경되는 행이 적다면 [증분 뷰 유지 관리(IVM)](incremental-materialized-view)가 적합한가요?

## 사용 사례 {#use-cases}

<!-- Knowledge type: scenario description -->

비동기 구체화된 뷰는 주로 다음 네 가지 시나리오를 대상으로 합니다.

| 시나리오 | 이점 |
| :--- | :--- |
| 쿼리 가속 및 동시 처리 성능 향상 | 쿼리 속도를 크게 높이고 동시 처리 성능을 향상하며 리소스 소비를 줄입니다 |
| ETL 워크플로 간소화 | 추출, 변환, 데이터 적재(ETL) 프로세스를 간소화하고 개발 효율을 높입니다 |
| 레이크하우스 외부 테이블 쿼리 가속 | 레이크하우스 아키텍처에서 외부 데이터 소스에 대한 쿼리 속도를 크게 높입니다 |
| 쓰기 효율 향상 | 리소스 경합을 줄이고 데이터 쓰기 프로세스를 최적화하며 일관성과 무결성을 보장합니다 |

## 제한 사항 {#limitations}

<!-- Knowledge type: limitation description -->

비동기 구체화된 뷰를 사용하기 전에 다음 제한 사항을 확인하세요.

- **데이터 일관성**: 비동기 구체화된 뷰는 기본 테이블과 최종 일관성을 유지하지만, 실시간 동기화는 불가능하며 실시간 일관성을 보장하지 않습니다.
- **윈도 함수**: 현재 윈도 함수가 포함된 쿼리를 구체화된 뷰 기반 형태로 투명 재작성하는 기능은 지원하지 않습니다.
- **다중 테이블 시나리오**: 구체화된 뷰가 쿼리에 사용되는 테이블보다 더 많은 테이블을 조인하는 경우(예를 들어 쿼리는 t1과 t2만 사용하지만 구체화된 뷰에는 t1, t2, t3가 포함된 경우), 현재 투명 재작성을 지원하지 않습니다.
- **투명 재작성에서 지원하지 않는 연산자**: 구체화된 뷰에 `UNION ALL`, `LIMIT`, `ORDER BY` 또는 `CROSS JOIN`이 포함되어 있어도 정상적으로 생성할 수 있지만, 투명 재작성에는 사용할 수 없습니다.
- **데이터 타입 제한**: 현재 구체화된 뷰를 생성할 때 `VARBINARY` 타입은 지원하지 않습니다.

## 동작 원리 {#principles}

<!-- Knowledge type: principle description -->

비동기 구체화된 뷰는 본질적으로 MTMV 타입의 내부 테이블입니다. 구체화된 뷰를 생성하면 시스템은 갱신 작업도 등록합니다. 이 작업이 실행되면 `INSERT OVERWRITE` 문을 통해 최신 데이터를 구체화된 뷰에 기록합니다.

### 갱신 메커니즘 {#refresh-mechanism}

동기 구체화된 뷰의 실시간 증분 갱신과 달리, 비동기 구체화된 뷰는 네 가지 계산 단위를 제공합니다.

| 갱신 방법 | 설명 | 적합한 시나리오 |
| :--- | :--- | :--- |
| `COMPLETE` | 구체화된 뷰 정의 SQL이 참조하는 모든 데이터를 다시 계산합니다 | 데이터 양이 적거나 초기 기준 데이터를 생성하거나 기준 데이터를 복구하는 경우 |
| `PARTITIONS` | 기본 테이블의 파티션 변경을 감지하고 영향을 받는 구체화된 뷰의 각 파티션을 다시 계산합니다 | 데이터 양이 많고 변경 사항이 소수의 파티션에 집중되는 경우 |
| `INCREMENTAL` | IVM으로 두 번의 갱신 사이에 발생한 행 단위 변경분을 계산하여 구체화된 뷰에 반영합니다 | 변경된 행 수가 전체 테이블이나 영향을 받는 파티션의 행 수보다 훨씬 적은 경우 |
| `AUTO` | Doris가 사용 가능한 갱신 방법을 자동으로 선택합니다 | 시스템이 IVM, 파티션 갱신, 전체 갱신 중에서 선택하도록 하려는 경우 |

`INCREMENTAL`과 `PARTITIONS`는 모두 증분 갱신이지만 처리 단위가 다릅니다. 전자는 행 단위 변경분만 처리하고, 후자는 영향을 받는 파티션 전체를 다시 계산합니다. IVM은 Doris 5.0.0부터 제공되며 현재 실험적 기능입니다. 요구 사항과 제한 사항은 [증분 뷰 유지 관리(IVM)](incremental-materialized-view)를 참고하세요.

### 투명 재작성 {#transparent-rewriting}

투명 재작성은 데이터베이스가 쿼리 성능을 최적화하는 중요한 방법입니다. 사용자 쿼리를 처리할 때 시스템은 적합한 구체화된 뷰를 활용하도록 SQL을 자동으로 재작성하여 실행 효율을 높이고 계산 비용을 줄입니다. 전체 과정은 사용자에게 투명하게 이루어지며 별도의 개입이 필요하지 않습니다.

Doris 비동기 구체화된 뷰는 SPJG(SELECT-PROJECT-JOIN-GROUP-BY) 패턴에 기반한 투명 재작성 알고리즘을 사용합니다.

1. SQL의 구조 정보를 심층 분석합니다.
2. 투명 재작성에 적합한 구체화된 뷰를 자동으로 찾아 선택합니다.
3. 후보 구체화된 뷰가 여러 개 있으면 비용 모델 등의 전략에 따라 쿼리 처리에 가장 적합한 구체화된 뷰를 선택하여 성능을 더욱 높입니다.

## 데이터 레이크에 비동기 구체화된 뷰 생성하기 {#creating-an-async-materialized-view-on-a-data-lake}

<!-- Use cases: external table acceleration in a lakehouse architecture -->

데이터 레이크에 비동기 구체화된 뷰를 생성하는 구문은 내부 테이블에 생성하는 구문과 동일하지만, 다음 사항에 유의하세요.

- **메타데이터 출처**: 구체화된 뷰 갱신에 필요한 파티션 버전 등의 정보는 외부 환경에서 직접 가져오지 않고 데이터 레이크의 메타데이터 캐시에서 가져옵니다. 따라서 갱신이 완료되면 데이터는 Doris를 통해 데이터 레이크를 쿼리한 결과와 일치하지만, 캐시 갱신 상태에 따라 다른 엔진의 쿼리 결과와는 일치하지 않을 수 있습니다.
- **외부 변경 감지**: Doris가 제어하지 않는 외부 프로세스(예: Spark, Hive 또는 Flink 작업)가 기반 Hive 데이터를 변경했지만 메타데이터는 변경되지 않은 경우(예: `insert overwrite` 실행 시), 구체화된 뷰는 기본 테이블과 일관된 상태라고 잘못 판단하며 쿼리 결과는 Doris를 통해 데이터 레이크를 쿼리한 결과와 일치하지 않게 됩니다. 이 문제는 구체화된 뷰를 수동으로 강제 갱신하여 해결할 수 있습니다.
- **Iceberg 제한 사항**: Iceberg에 파티션으로 나뉜 구체화된 뷰를 생성할 때는 파티션 컬럼이 하나인 Iceberg 테이블만 지원하며, 파티션 진화는 제한적으로 지원합니다. 예를 들어 시간 타입 파티션의 시간 범위 변경은 지원하지만, 파티션 필드 자체가 변경되면 구체화된 뷰 갱신이 실패합니다.
- **Hudi 제한 사항**: Hudi에 구체화된 뷰를 생성하면 시스템은 기본 테이블의 데이터 변경 여부를 감지할 수 없습니다. 구체화된 뷰 또는 일부 파티션이 갱신되기만 하면 기본 테이블과 동기화된 것으로 간주합니다. 따라서 Hudi에 구체화된 뷰를 생성하는 방식은 필요에 따라 수동으로 갱신하는 경우에만 적합합니다.

### 데이터 레이크의 구체화된 뷰 갱신 지원 {#materialized-view-refresh-support-on-data-lakes}

다음 표는 테이블 유형 및 Catalog별 갱신 지원 수준을 보여 줍니다.

<table>
    <tr>
        <th rowspan="2">테이블 유형</th>
        <th rowspan="2">Catalog 유형</th>
        <th colspan="2">갱신 방법</th>
        <th>갱신 트리거</th>
    </tr>
    <tr>
        <th>전체 갱신</th>
        <th>파티션 단위 갱신</th>
        <th>자동 트리거</th>
    </tr>
    <tr>
        <td>내부 테이블</td>
        <td>Internal</td>
        <td>2.1부터 지원</td>
        <td>2.1부터 지원</td>
        <td>2.1.4부터 지원</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>2.1부터 지원</td>
        <td>2.1부터 지원</td>
        <td>지원하지 않음</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>2.1부터 지원</td>
        <td>3.1부터 지원</td>
        <td>지원하지 않음</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>2.1부터 지원</td>
        <td>3.1부터 지원</td>
        <td>지원하지 않음</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>2.1부터 지원</td>
        <td>3.1부터 지원</td>
        <td>지원하지 않음</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>2.1부터 지원</td>
        <td>지원하지 않음</td>
        <td>지원하지 않음</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>2.1부터 지원</td>
        <td>지원하지 않음</td>
        <td>지원하지 않음</td>
    </tr>
</table>

### 데이터 레이크의 투명 재작성 지원 {#transparent-rewriting-support-on-data-lakes}

비동기 구체화된 뷰의 투명 재작성 기능은 현재 다음 테이블 유형과 Catalog를 지원합니다.

> **기본 테이블 데이터의 실시간 변경 감지**: 구체화된 뷰가 사용하는 기본 테이블의 데이터가 변경되면, 구체화된 뷰가 변경 사항을 실시간으로 감지하고 쿼리에서 최신 데이터를 사용할 수 있음을 의미합니다.

<table>
    <tr>
        <th>테이블 유형</th>
        <th>Catalog 유형</th>
        <th>투명 재작성 지원</th>
        <th>기본 테이블 데이터의 실시간 변경 감지</th>
    </tr>
    <tr>
        <td>내부 테이블</td>
        <td>Internal</td>
        <td>지원</td>
        <td>지원</td>
    </tr>
    <tr>
        <td>Hive</td>
        <td>Hive</td>
        <td>지원</td>
        <td>3.1부터 지원</td>
    </tr>
    <tr>
        <td>Iceberg</td>
        <td>Iceberg</td>
        <td>지원</td>
        <td>3.1부터 지원</td>
    </tr>
    <tr>
        <td>Paimon</td>
        <td>Paimon</td>
        <td>지원</td>
        <td>3.1부터 지원</td>
    </tr>
    <tr>
        <td>Hudi</td>
        <td>Hudi</td>
        <td>지원</td>
        <td>지원하지 않음</td>
    </tr>
    <tr>
        <td>JDBC</td>
        <td>JDBC</td>
        <td>지원</td>
        <td>지원하지 않음</td>
    </tr>
    <tr>
        <td>ES</td>
        <td>ES</td>
        <td>지원</td>
        <td>지원하지 않음</td>
    </tr>
</table>

#### 외부 테이블 기반 구체화된 뷰의 투명 재작성 활성화 {#enabling-transparent-rewriting-for-external-table-materialized-views}

외부 테이블을 사용하는 구체화된 뷰는 기본적으로 투명 재작성에 참여하지 않습니다. 활성화하려면 다음을 실행하세요.

```sql
SET materialized_view_rewrite_enable_contain_external_table = true;
```

#### 외부 테이블 투명 재작성 성능 최적화 {#performance-optimization-for-external-table-transparent-rewriting}

2.1.11부터 Doris는 외부 테이블의 투명 재작성 성능을 최적화했습니다. 주로 외부 테이블이 포함된 사용 가능한 구체화된 뷰를 가져오는 성능을 개선했습니다.

외부 테이블이 포함된 파티션으로 나뉜 구체화된 뷰의 투명 재작성이 느리다면 `fe.conf`에서 다음 매개변수를 조정할 수 있습니다.

| 매개변수 | 기본값 | 설명 | 버전 |
| :--- | :--- | :--- | :--- |
| `max_hive_partition_cache_num` | 10000 | Hive Metastore에서 테이블 수준 파티션 캐시의 최대 개수입니다. Hive 외부 테이블에 파티션이 많으면 `20000` 이상으로 설정하세요 | - |
| `external_cache_expire_time_minutes_after_access` | 10분 | 캐시된 객체에 마지막으로 접근한 후 만료되기까지의 시간입니다. 적절히 늘릴 수 있습니다(외부 테이블 스키마 캐시와 Hive 메타데이터 캐시에 모두 적용) | - |
| `external_cache_refresh_time_minutes` | 10분 | 외부 테이블 메타데이터 캐시 객체의 자동 갱신 주기입니다. 적절히 늘릴 수 있습니다 | 3.1+ |

외부 테이블 메타데이터 캐시 설정에 관한 자세한 내용은 [메타데이터 캐시](../../../lakehouse/meta-cache.md)를 참고하세요.

## 구체화된 뷰와 OLAP 내부 테이블의 관계 {#relationship-between-materialized-views-and-olap-internal-tables}

<!-- Knowledge type: implementation mechanism description -->

비동기 구체화된 뷰를 정의하는 SQL에서 사용하는 기본 테이블의 모델에는 제한이 없습니다. Duplicate 모델, Unique 모델(merge-on-write 또는 merge-on-read), Aggregate 모델 등을 사용할 수 있습니다.

구체화된 뷰 자체는 Duplicate 모델의 OLAP 테이블로 구현되므로 이론적으로는 Duplicate 모델의 모든 핵심 기능을 지원할 수 있습니다. 다만 구체화된 뷰가 데이터 갱신 작업을 안정적이고 효율적으로 실행하도록 기능에 몇 가지 필수적인 제약을 둡니다.

- **파티션 작업**: 구체화된 뷰의 파티션은 기본 테이블을 기반으로 자동 생성되고 관리됩니다. 사용자는 구체화된 뷰에서 파티션 작업을 수행할 수 없습니다.
- **삭제 및 이름 변경**: 구체화된 뷰에는 연결된 작업(JOB)이 있으므로 `DROP TABLE` 또는 `RENAME TABLE` 명령으로 구체화된 뷰를 조작할 수 없습니다. 해당 작업에는 구체화된 뷰 전용 명령을 사용하세요.
- **컬럼 데이터 타입**: 구체화된 뷰의 컬럼 데이터 타입은 생성 시 지정한 쿼리문에서 자동으로 유추되며 수정할 수 없습니다. 수정하면 갱신 작업이 실패할 수 있습니다.
- **속성 변경**: 구체화된 뷰에는 Duplicate 테이블에 없는 속성이 있습니다. 이러한 속성은 구체화된 뷰 전용 명령으로 변경해야 합니다. 그 외 공통 속성은 `ALTER TABLE` 명령으로 변경합니다.

## 자주 묻는 질문 {#faq}

<!-- Knowledge type: Q&A -->

**Q1: 비동기 구체화된 뷰는 기본 테이블과 실시간 데이터 일관성을 보장할 수 있나요?**

아니요. 비동기 구체화된 뷰는 기본 테이블과 최종 일관성을 유지하지만 실시간으로 동기화할 수는 없습니다. 실시간 일관성이 필요하다면 동기 구체화된 뷰를 고려하세요.

**Q2: 윈도 함수가 포함된 쿼리는 왜 재작성할 수 없나요?**

현재 투명 재작성 알고리즘은 아직 윈도 함수를 지원하지 않습니다. 윈도 함수가 포함된 쿼리는 구체화된 뷰 기반 형태로 재작성되지 않습니다.

**Q3: 외부 테이블 기반 구체화된 뷰가 재작성 시 선택되지 않는 이유는 무엇인가요?**

외부 테이블 기반 구체화된 뷰는 기본적으로 투명 재작성에 참여하지 않습니다. 재작성에 참여하도록 하려면 `materialized_view_rewrite_enable_contain_external_table = true`로 설정하세요.

**Q4: 외부 프로세스가 Hive 외부 테이블 데이터를 수정한 후 구체화된 뷰의 쿼리 결과가 일치하지 않는 이유는 무엇인가요?**

Spark, Hive 또는 Flink 같은 외부 프로세스가 Hive 데이터를 수정했지만 메타데이터는 변경되지 않은 경우(예: `insert overwrite`), 구체화된 뷰는 변경 사항을 감지할 수 없습니다. 구체화된 뷰를 수동으로 강제 갱신하여 해결할 수 있습니다.

**Q5: Hudi 기반 구체화된 뷰는 자동으로 갱신할 수 있나요?**

기본 테이블의 변경 사항을 감지할 수 없으므로 필요에 따라 수동으로 갱신하는 경우에만 적합합니다.

## 관련 문서 {#see-also}

- 비동기 구체화된 뷰 생성, 쿼리 및 유지 관리: [비동기 구체화된 뷰 생성, 쿼리 및 유지 관리](../async-materialized-view/functions-and-demands.md)
- 행 단위 변경분 유지 관리: [증분 뷰 유지 관리(IVM)](../async-materialized-view/incremental-materialized-view.mdx)
- 사용자 가이드: [사용자 가이드](../async-materialized-view/use-guide.md)
- 자주 묻는 질문: [자주 묻는 질문](../async-materialized-view/faq.md)
