---
{
    "title": "Doris Core 릴리스 노트",
    "language": "ko",
    "description": "이 문서는 Apache Doris Core 릴리스 노트를 최신순으로 제공합니다."
}
---

이 문서는 Apache Doris Core 릴리스 노트를 최신순으로 제공합니다.

## Doris Core 릴리스 노트 {#doris-core-release-notes}

:::tip 최신 릴리스
🎉 버전 4.1.5가 출시되었습니다. 🔗[릴리스 노트](./v4.1/release-4.1.5.md)를 확인하세요. Apache Doris 4.1.5에는 Hive 테이블의 정적 파티션 덮어쓰기, 사용자 정의 역색인 분석기의 IK 토크나이저, AI 리소스의 전용 임베딩 속성, Routine Load 작업과 비동기 구체화된 뷰의 컴퓨팅 그룹 바인딩이 추가되었습니다. 쿼리 실행, 데이터 적재, Lakehouse 호환성, File Cache 동작 및 안정성도 개선되었습니다.

<br />

🎉 버전 4.0.8이 출시되었습니다. 🔗[릴리스 노트](./v4.0/release-4.0.8.md)를 확인하세요. Apache Doris 4.0.8은 컴퓨팅과 스토리지가 분리된 배포 환경, 데이터 적재 및 트랜잭션 안정성, File Cache 동작, 내부 엔드포인트의 보안 강화, Lakehouse 호환성에 중점을 둔 유지보수 릴리스입니다. 모든 4.0.x 사용자에게 업그레이드를 권장합니다.

<br />

🎉 버전 3.1.4가 출시되었습니다. 🔗[릴리스 노트](./v3.1/release-3.1.4.md)를 확인하세요. Doris 3.1은 VARIANT 데이터 타입에 희소 컬럼과 스키마 템플릿을 도입하여 로그 및 JSON 데이터처럼 동적 필드가 있는 대규모 데이터셋을 더 효율적으로 저장하고 쿼리할 수 있게 했습니다. Lakehouse 기능 측면에서는 비동기 구체화된 뷰를 개선하고 Iceberg와 Paimon에 대한 지원을 확대하여 데이터 레이크와 데이터 웨어하우스 간의 연결을 강화했습니다.

<br />

🎉 버전 3.0.8이 출시되었습니다. 🔗[릴리스 노트](./v3.0/release-3.0.8.md)를 확인하세요. 버전 3.X부터 Apache Doris는 클러스터 배포를 위해 컴퓨팅과 스토리지가 결합된 모드 외에 분리된 모드도 지원합니다. 컴퓨팅 계층과 스토리지 계층을 분리하는 클라우드 네이티브 아키텍처를 통해 사용자는 여러 컴퓨팅 클러스터의 쿼리 부하를 물리적으로 격리하고 읽기 부하와 쓰기 부하도 격리할 수 있습니다.

<br />

🎉 버전 2.1.11이 출시되었습니다. 🔗[릴리스 노트](./v2.1/release-2.1.11.md)를 확인하세요. 버전 2.1은 TPC-DS 1TB 테스트에서 입증된 기본 설정 기준 100% 향상된 쿼리 성능, Trino와 Spark보다 4~6배 빠른 데이터 레이크 분석, 새로운 Variant 타입과 다양한 분석 함수가 제공하는 강력한 반정형 데이터 분석 지원, 쿼리 가속을 위한 비동기 구체화된 뷰, 대규모 실시간 쓰기 최적화, 안정성과 실행 중 SQL 리소스 추적을 통한 향상된 워크로드 관리를 제공합니다.

:::


<br />

- [2026-10-16, Apache Doris 4.1.5 출시](./v4.1/release-4.1.5.md)

- [2026-09-29, Apache Doris 4.1.4.1 출시](./v4.1/release-4.1.4.1.md)

- [2026-09-10, Apache Doris 4.1.4 출시](./v4.1/release-4.1.4.md)

- [2026-08-14, Apache Doris 4.0.8 출시](./v4.0/release-4.0.8.md)

- [2026-07-13, Apache Doris 4.1.3 출시](./v4.1/release-4.1.3.md)

- [2026-07-12, Apache Doris 4.0.7 출시](./v4.0/release-4.0.7.md)

- [2026-06-17, Apache Doris 4.1.2 출시](./v4.1/release-4.1.2.md)

- [2026-06-08, Apache Doris 4.0.6 출시](./v4.0/release-4.0.6.md)

- [2026-05-24, Apache Doris 4.1.1 출시](./v4.1/release-4.1.1.md)

- [2026-04-21, Apache Doris 4.1.0 출시](./v4.1/release-4.1.0.md)

- [2026-04-07, Apache Doris 4.0.5 출시](./v4.0/release-4.0.5.md)

- [2026-03-11, Apache Doris 4.0.4 출시](./v4.0/release-4.0.4.md)

- [2026-02-02, Apache Doris 4.0.3 출시](./v4.0/release-4.0.3.md)

- [2025-12-29, Apache Doris 3.1.4 출시](./v3.1/release-3.1.4.md)

- [2025-12-15, Apache Doris 4.0.2 출시](./v4.0/release-4.0.2.md)

- [2025-11-24, Apache Doris 3.1.3 출시](./v3.1/release-3.1.3.md)

- [2025-11-08, Apache Doris 4.0.1 출시](./v4.0/release-4.0.1.md)

- [2025-10-27, Apache Doris 3.1.2 출시](./v3.1/release-3.1.2.md)

- [2025-10-14, Apache Doris 4.0.0 출시](./v4.0/release-4.0.0.md)

- [2025-09-26, Apache Doris 3.1.1 출시](./v3.1/release-3.1.1.md)

- [2025-09-19, Apache Doris 3.0.8 출시](./v3.0/release-3.0.8.md)

- [2025-09-04, Apache Doris 3.1.0 출시](./v3.1/release-3.1.0.md)

- [2025-08-25, Apache Doris 3.0.7 출시](./v3.0/release-3.0.7.md)

- [2025-08-15, Apache Doris 2.1.11 출시](./v2.1/release-2.1.11.md)

- [2025-06-16, Apache Doris 3.0.6 출시](./v3.0/release-3.0.6.md)

- [2025-05-17, Apache Doris 2.1.10 출시](./v2.1/release-2.1.10.md)

- [2025-04-28, Apache Doris 3.0.5 출시](./v3.0/release-3.0.5.md)

- [2025-04-02, Apache Doris 2.1.9 출시](./v2.1/release-2.1.9.md)

- [2025-02-28, Apache Doris 3.0.4 출시](./v3.0/release-3.0.4.md)

- [2025-01-24, Apache Doris 2.1.8 출시](./v2.1/release-2.1.8.md)

- [2024-12-02, Apache Doris 3.0.3 출시](./v3.0/release-3.0.3.md)

- [2024-11-10, Apache Doris 2.1.7 출시](./v2.1/release-2.1.7.md)

- [2024-10-15, Apache Doris 3.0.2 출시](./v3.0/release-3.0.2.md)

- [2024-09-30, Apache Doris 2.0.15 출시](./v2.0/release-2.0.15.md)

- [2024-09-10, Apache Doris 2.1.6 출시](./v2.1/release-2.1.6.md)

- [2024-08-23, Apache Doris 3.0.1 출시](./v3.0/release-3.0.1.md)

- [2024-07-24, Apache Doris 2.1.5 출시](./v2.1/release-2.1.5.md)

- [2024-07-17, Apache Doris 2.0.13 출시](./v2.0/release-2.0.13.md)

- [2024-06-27, Apache Doris 2.0.12 출시](./v2.0/release-2.0.12.md)

- [2024-06-26, Apache Doris 2.1.4 출시](./v2.1/release-2.1.4.md)

- [2024-06-05, Apache Doris 2.0.11 출시](./v2.0/release-2.0.11.md)

- [2024-05-21, Apache Doris 2.1.3 출시](./v2.1/release-2.1.3.md)

- [2024-05-16, Apache Doris 2.0.10 출시](./v2.0/release-2.0.10.md)

- [2024-04-23, Apache Doris 2.0.9 출시](./v2.0/release-2.0.9.md)

- [2024-04-12, Apache Doris 2.1.2 출시](./v2.1/release-2.1.2.md)

- [2024-04-09, Apache Doris 2.0.8 출시](./v2.0/release-2.0.8.md)

- [2024-04-03, Apache Doris 2.1.1 출시](./v2.1/release-2.1.1.md)

- [2024-03-26, Apache Doris 2.0.7 출시](./v2.0/release-2.0.7.md)

- [2024-03-12, Apache Doris 2.1.0 출시](./v2.1/release-2.1.0.md)

- [2024-03-11, Apache Doris 2.0.6 출시](./v2.0/release-2.0.6.md)

- [2024-02-28, Apache Doris 2.0.5 출시](./v2.0/release-2.0.5.md)

- [2024-01-26, Apache Doris 2.0.4 출시](./v2.0/release-2.0.4.md)
