---
{
    "title": "CloudCanal",
    "language": "ko",
    "description": "CloudCanal은 전적으로 자체 개발한 시각적 인터페이스 기반의 자동화된 데이터 마이그레이션 및 동기화 도구입니다. 널리 사용되는 관계형 데이터베이스, 실시간 데이터 웨어하우스, 메시지 미들웨어, 캐시 데이터베이스, 검색 엔진 등 30+종의 시스템 간 데이터 교환을 지원합니다. 효율적인 실시간 처리, 정확한 연동, 안정성과 확장성, 원스톱 운영, 하이브리드 배포, 복잡한 데이터 변환 기능을 제공합니다."
}
---

CloudCanal은 전적으로 자체 개발한 시각적 인터페이스 기반의 자동화된 데이터 마이그레이션 및 동기화 도구입니다. 널리 사용되는 관계형 데이터베이스, 실시간 데이터 웨어하우스, 메시지 미들웨어, 캐시 데이터베이스, 검색 엔진 등 30+종의 시스템 간 데이터 교환을 지원합니다. 효율적인 실시간 처리, 정확한 연동, 안정성과 확장성, 원스톱 운영, 하이브리드 배포, 복잡한 데이터 변환 기능을 제공합니다.

## 기능 설명 {#feature-description}
CloudCanal은 스키마 마이그레이션, 전체 데이터 마이그레이션, 증분 동기화, 검증 및 보정을 쉽게 수행할 수 있는 시각적 인터페이스를 제공합니다. 또한 매개변수를 설정하여 데이터 동기화를 더 세밀하게 조정하고 사용자 환경에 맞게 구성할 수 있습니다. 현재 Doris 연동을 지원하는 데이터 소스는 다음과 같습니다.

| 소스 데이터 소스            | 스키마 마이그레이션 | 전체 마이그레이션 | 증분 동기화 | 검증 및 보정 |
|------------------------------|------------------|----------------|------------------|------------------------------|
| MySQL/MariaDB/AuroraMySQL    | 지원        | 지원      | 지원        | 지원                    |
| Oracle                       | 지원        | 지원      | 지원        | 지원                    |
| PostgreSQL/AuroraPostgreSQL | 지원        | 지원      | 지원        | 지원                    |
| SQL Server                   | 지원        | 지원      | 지원        | 지원                    |
| Kafka                        | 미지원    | 미지원  | 지원        | 미지원                |
| AutoMQ                       | 미지원    | 미지원  | 지원        | 미지원                |
| TiDB                         | 지원        | 지원      | 지원        | 지원                    |
| Hana                         | 지원        | 지원      | 지원        | 지원                    |
| PolarDB-X                    | 지원        | 지원      | 지원        | 지원                    |

:::info
더 많은 기능과 매개변수 설정은 [CloudCanal 데이터 연동 문서](https://www.clougence.com/cc-doc/dataMigrationAndSync/connection/mysql2?target=Doris)를 참조하세요.
:::


## 다운로드 및 설치 {#download-and-installation}
[신규 설치(Docker Linux/MacOS)](https://www.clougence.com/cc-doc/productOP/docker/install_linux_macos)를 참조하고 [CloudCanal 공식 웹사이트](https://www.clougence.com/)를 방문하여 프라이빗 배포 버전을 다운로드하고 설치하세요.

## 사용 예제 {#usage-example}
다음은 MySQL을 예로 들어 MySQL에서 Doris로 데이터를 마이그레이션하고 동기화하는 방법을 설명합니다.

### 데이터 소스 추가 {#add-a-data-source}
1. CloudCanal 콘솔에 로그인하고 **데이터 소스 관리** > **데이터 소스 추가**를 클릭합니다.
2. MySQL과 Doris 데이터 소스를 각각 선택하고 해당 정보를 입력합니다.
   ![데이터 소스 추가 -1](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-1.png)

3. **연결 테스트**를 클릭합니다. 연결에 성공하면 **데이터 소스 추가**를 클릭하여 데이터 소스 추가를 완료합니다.
   ![데이터 소스 추가 -2](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-2.png)

### 작업 생성 {#create-a-task}
1. **동기화 작업** > **작업 생성**을 클릭합니다.
2. 소스 및 대상 데이터 소스를 선택하고 각각 **연결 테스트**를 클릭합니다.
   ![작업 생성 -1](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-3.png)

3. **데이터 동기화**를 선택하고 **전체 초기화**를 체크합니다.
   ![작업 생성 -2](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-4.png)

4. 동기화할 테이블을 선택합니다.
   ![작업 생성 -3](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-5.png)

5. 동기화할 열을 선택합니다.
   ![작업 생성 -4](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-6.png)

6. 작업 생성을 확인합니다.
7. 작업이 자동으로 실행됩니다. CloudCanal은 다음 단계를 포함하는 작업 흐름을 자동으로 처리합니다.
  - 스키마 마이그레이션: 소스 측 테이블 스키마를 대상으로 마이그레이션합니다. 대상에 같은 이름의 테이블이 이미 있으면 해당 테이블은 건너뜁니다.
  - 전체 데이터 마이그레이션: 기존 데이터를 모두 대상으로 마이그레이션하며, 중단된 지점부터 전송을 재개할 수 있습니다.
  - 증분 데이터 동기화: 증분 데이터를 대상 데이터베이스에 실시간으로 지속적으로 동기화합니다(초 단위 지연).
  ![작업 생성 -5](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-8.png)
