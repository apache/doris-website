---
{
    "title": "다른 AP 시스템에서 데이터 마이그레이션",
    "language": "ko",
    "description": "Hive, Iceberg, Hudi 등 다른 OLAP/AP 시스템에서 Apache Doris로 데이터를 마이그레이션할 때 사용할 수 있는 방법과 선택 기준을 안내합니다.",
    "keywords": [
        "Doris 데이터 마이그레이션",
        "OLAP 데이터 마이그레이션",
        "AP 시스템 마이그레이션",
        "Hive에서 Doris로",
        "Iceberg에서 Doris로",
        "Hudi에서 Doris로",
        "Multi-Catalog",
        "Insert Into",
        "Doris Connector",
        "Spark Doris Connector",
        "Flink Doris Connector"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Migrating data from other AP/OLAP systems to Doris -->

이 문서는 다른 AP(분석용) 시스템에서 Apache Doris로 데이터를 마이그레이션하는 일반적인 방법을 설명합니다. 이를 통해 원본 시스템과 기존 기술 스택에 적합한 마이그레이션 방식을 선택할 수 있습니다.

## 마이그레이션 방법 개요 {#migration-approaches-overview}

원본 시스템과 사용 가능한 도구에 따라 다른 AP 시스템에서 Doris로 데이터를 마이그레이션하는 방법은 크게 세 가지로 나뉩니다.

| 마이그레이션 방법 | 적용 시나리오 | 주요 구성 요소 |
| --- | --- | --- |
| Multi-Catalog + Insert Into | 원본 시스템이 Hive, Iceberg, Hudi이거나 외부 Catalog 매핑을 지원하는 다른 시스템인 경우 | Multi-Catalog, Insert Into |
| 중간 파일을 통한 전송 | 원본 시스템이 CSV 등의 일반적인 데이터 형식으로 내보내기를 지원하는 경우 | 데이터 내보내기 도구, Doris 파일 가져오기 |
| Connector 연동 | 기존 Spark 또는 Flink 작업이 있거나 프로그래밍 방식의 마이그레이션이 필요한 경우 | Spark/Flink AP Connector, Doris Connector |

## 마이그레이션 방법 상세 {#detailed-migration-approaches}

### 방법 1: Multi-Catalog를 통해 외부 테이블로 매핑한 후 가져오기 {#approach-1-map-as-an-external-table-via-multi-catalog-and-then-import}

이 방법은 Hive, Iceberg, Hudi 등 Doris Multi-Catalog가 인식할 수 있는 시스템에 적용할 수 있습니다.

- Doris에서 Multi-Catalog를 사용하여 원본 시스템을 외부 테이블로 매핑합니다.
- `Insert Into`를 사용하여 외부 테이블의 데이터를 Doris 내부 테이블에 씁니다.

### 방법 2: 중간 파일을 통한 전송 {#approach-2-transfer-through-intermediate-files}

이 방법은 원본 시스템과 직접 연동하기는 어렵지만 데이터 내보내기를 지원하는 경우에 적용할 수 있습니다.

- 원본 AP 시스템의 데이터를 CSV 등의 일반적인 데이터 형식으로 내보냅니다.
- 내보낸 데이터 파일을 Doris로 가져옵니다.

### 방법 3: Spark 또는 Flink Connector를 통한 데이터 쓰기 {#approach-3-write-data-through-a-spark-or-flink-connector}

이 방법은 Spark 또는 Flink 데이터 처리 파이프라인이 이미 구축되어 있거나 마이그레이션 중에 데이터를 정제하거나 변환해야 하는 경우에 적용할 수 있습니다.

- AP 시스템에 해당하는 Spark 또는 Flink Connector를 사용하여 원본 데이터를 읽습니다.
- Doris Connector를 사용하여 데이터를 Doris에 씁니다.

## 자주 묻는 질문 {#faq}

**질문: 사용 중인 AP 시스템이 위 목록에 없으면 어떻게 하나요?**

이 목록에 추가할 만한 다른 마이그레이션 도구나 방법이 있다면 dev@doris.apache.org로 연락해 주세요.

:::info 참고
이 목록에 추가할 만한 다른 마이그레이션 도구가 있다면 dev@doris.apache.org로 연락해 주세요.
:::
