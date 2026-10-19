---
{
    "title": "Kettle",
    "language": "ko",
    "description": "Kettle에서 Kettle Doris Plugin을 설치하고 설정하는 방법과 Stream Load를 통해 외부 데이터 소스의 데이터를 Apache Doris로 동기화하는 방법을 알아봅니다.",
    "keywords": [
        "Kettle Doris Plugin",
        "Kettle에서 Doris로 데이터 적재",
        "Stream Load",
        "Doris로 데이터 동기화"
    ]
}
---

<!-- Knowledge type: Operating procedure -->
<!-- Applicable scenario: Data integration / Writing external data sources to Doris through Kettle -->

Kettle Doris Plugin은 Kettle에서 Stream Load를 통해 다른 데이터 소스의 데이터를 Doris에 쓰는 Doris용 Kettle 플러그인입니다.

이 플러그인은 Doris의 Stream Load 기능을 사용하여 데이터를 적재하며, 반드시 Kettle 서비스와 함께 사용해야 합니다. 이미 Kettle로 ETL 작업을 오케스트레이션하고 있고 Kettle이 지원하는 데이터 소스의 데이터를 Doris에 쓰려는 경우, 이 플러그인을 사용하여 데이터를 동기화할 수 있습니다.

## Kettle 소개 {#about-kettle}

[Kettle](https://pentaho.com/)은 Pentaho에서 처음 개발한 오픈 소스 ETL(추출, 변환, 데이터 적재) 도구입니다. Pentaho 제품군의 핵심 구성 요소 중 하나로, 주로 데이터 통합과 데이터 처리에 사용됩니다. 다양한 소스에서 데이터를 추출하고, 데이터를 정제 및 변환한 뒤 대상 시스템에 적재할 수 있습니다.

자세한 내용은 [Pentaho 공식 웹사이트](https://pentaho.com/)를 참조하세요.

## 작업 흐름 {#workflow}

Kettle Doris Plugin을 사용하여 Doris에 데이터를 쓰는 작업 흐름은 다음과 같습니다.

| 단계 | 사용자 목표 | 작업 |
| --- | --- | --- |
| 1 | Kettle 환경 준비 | Kettle을 다운로드하여 압축을 풀거나 직접 빌드합니다. |
| 2 | Doris 플러그인 준비 | Doris 소스 코드에서 Kettle Doris Plugin을 빌드합니다. |
| 3 | 플러그인 설치 | 빌드한 `doris-stream-loader` 플러그인을 Kettle의 `plugins` 디렉터리에 복사합니다. |
| 4 | 작업 생성 | Kettle에서 Doris Stream Loader를 선택하고 Doris 연결 및 데이터 적재 매개변수를 설정합니다. |
| 5 | 동기화 실행 | 작업을 시작하여 Stream Load를 통해 Doris에 데이터를 씁니다. |

## Kettle 환경 준비 {#prepare-the-kettle-environment}

### Kettle 다운로드 및 시작 {#download-and-start-kettle}

1. [Kettle 다운로드 페이지](https://pentaho.com/download/#download-pentaho)에서 Kettle을 다운로드합니다.
2. 다운로드한 패키지의 압축을 풉니다.
3. `spoon.sh`를 실행하여 Kettle을 시작합니다.

### Kettle 직접 빌드 {#build-kettle-yourself}

Kettle을 직접 빌드하려면 [Pentaho Kettle 빌드 안내](https://github.com/pentaho/pentaho-kettle?tab=readme-ov-file#how-to-build)를 참조하세요.

## Kettle Doris Plugin 빌드 및 설치 {#build-and-install-the-kettle-doris-plugin}

### 플러그인 빌드 {#build-the-plugin}

Doris 소스 코드 디렉터리에서 `extension/kettle`로 이동한 다음 플러그인을 빌드합니다.

```shell
cd doris/extension/kettle
mvn clean package -DskipTests
```

### 플러그인 설치 {#install-the-plugin}

빌드가 완료되면 플러그인 패키지의 압축을 풀고 `doris-stream-loader`를 Kettle의 `plugins` 디렉터리에 복사합니다.

```shell
cd assemblies/plugin/target
unzip doris-stream-loader-plugins-9.4.0.0-343.zip
cp -r doris-stream-loader ${KETTLE_HOME}/plugins/
```

## 작업 생성 및 실행 {#build-and-run-a-job}

### Doris Stream Loader 작업 생성 {#build-a-doris-stream-loader-job}

Kettle의 대량 적재에서 Doris Stream Loader를 찾아 작업을 생성합니다.

![Kettle에서 Doris Stream Loader 작업 생성](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/create.png)

### 작업 실행 {#run-the-job}

시작을 클릭하여 작업을 실행하고 데이터 동기화를 완료합니다.

![Kettle에서 Doris Stream Loader 작업 실행](https://raw.githubusercontent.com/apache/doris/refs/heads/master/extension/kettle/images/running.png)

## 매개변수 {#parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Kettle Doris Plugin job configuration -->

다음 표는 Doris Stream Loader 작업의 주요 설정 항목을 설명합니다.

| 매개변수 | 기본값 | 필수 여부 | 설명 |
| --- | --- | --- | --- |
| `Step name` | -- | Y | 단계 이름입니다. |
| `fenodes` | -- | Y | Doris FE의 HTTP 주소입니다. 여러 주소를 지정할 수 있으며 쉼표로 구분합니다. |
| 데이터베이스 | -- | Y | 데이터를 쓸 Doris의 대상 데이터베이스입니다. |
| 대상 테이블 | -- | Y | 데이터를 쓸 Doris의 대상 테이블입니다. |
| 사용자 이름 | -- | Y | Doris에 액세스할 때 사용하는 사용자 이름입니다. |
| 비밀번호 | -- | N | Doris에 액세스할 때 사용하는 비밀번호입니다. |
| 데이터 적재당 최대 행 수 | 10000 | N | 한 번의 데이터 적재에 포함할 수 있는 최대 행 수입니다. |
| 데이터 적재당 최대 바이트 수 | 10485760 (10 MB) | N | 한 번의 데이터 적재에 허용되는 최대 크기이며, 단위는 바이트입니다. |
| 데이터 적재 재시도 횟수 | 3 | N | 데이터 적재 실패 후 재시도하는 횟수입니다. |
| Stream Load 속성 | -- | N | Stream Load의 요청 헤더입니다. |
| 삭제 모드 | N | N | 삭제 모드를 활성화할지 여부입니다. 기본적으로 Stream Load는 삽입 작업을 수행합니다. 삭제 모드를 활성화하면 Stream Load의 모든 쓰기는 삭제 작업으로 수행됩니다. |

Stream Load의 다른 매개변수는 [Stream Load 문서](../../data-operate/import/import-way/stream-load-manual.md)를 참조하세요.

## 자주 묻는 질문 {#faq}

### Kettle Doris Plugin을 단독으로 사용할 수 있나요? {#can-the-kettle-doris-plugin-be-used-on-its-own}

아니요. Kettle Doris Plugin은 반드시 Kettle 서비스와 함께 사용해야 합니다.

### `fenodes`는 어떻게 입력하나요? {#how-should-fenodes-be-filled-in}

`fenodes`를 Doris FE의 HTTP 주소로 설정합니다. FE 주소가 여러 개이면 쉼표로 구분합니다.

### 삭제 모드는 쓰기에 어떤 영향을 미치나요? {#how-does-delete-mode-affect-writes}

기본적으로 Stream Load는 삽입 작업을 수행합니다. 삭제 모드를 활성화하면 Stream Load의 모든 쓰기는 삭제 작업으로 수행됩니다.
