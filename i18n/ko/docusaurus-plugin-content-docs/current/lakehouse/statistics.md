---
{
    "title": "통계 | Lakehouse",
    "language": "ko",
    "description": "Doris는 Hive, Iceberg, Paimon과 같은 외부 데이터 소스의 테이블에 대해 자동 또는 수동 통계 수집을 지원합니다.",
    "sidebar_label": "통계"
}
---

# 통계 {#statistics}

Doris는 Hive, Iceberg, Paimon과 같은 외부 데이터 소스의 테이블에 대해 자동 또는 수동 통계 수집을 지원합니다. 통계의 정확도는 비용 추정의 정확도를 직접 결정하며, 이는 최적의 쿼리 계획을 선택하는 데 매우 중요합니다. 이를 통해 특히 복잡한 쿼리 환경에서 쿼리 실행 효율을 크게 높일 수 있습니다.

자세한 내용은 [통계](../query-acceleration/optimization-technology-principle/statistics#external-table-collection) 문서의 "외부 테이블 수집" 섹션을 참조하세요.
