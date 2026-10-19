---
{
    "title": "Docker Compose로 배포",
    "sidebar_label": "Docker Compose로 배포",
    "language": "ko",
    "description": "Docker Compose를 사용해 단일 호스트에 DOG Stack을 배포하는 방법을 알아봅니다. 이 문서에서는 내장 Doris 또는 기존 Doris 클러스터를 사용하여 OpenTelemetry Collector, Apache Doris, Doris App 플러그인이 설치된 Grafana를 시작하는 방법과 배포 상태 확인, 접속 및 정리 방법을 설명합니다.",
    "keywords": [
        "DOG Stack 배포",
        "Docker Compose",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Doris App plugin",
        "관측 가능성"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack single-host deployment -->

이 문서에서는 Docker Compose를 사용해 단일 호스트에 DOG Stack을 배포하는 방법을 설명합니다. 이 배포 구성은 OpenTelemetry Collector와 Doris App 플러그인이 설치된 Grafana를 시작하며, 선택적으로 올인원 Doris도 함께 시작합니다. 로컬 테스트, 개발 및 PoC에 적합합니다. 프로덕션 또는 Kubernetes 환경은 [Kubernetes에 배포](./kubernetes.md)를 참조하세요.

:::tip
Docker 없이 구성 요소를 배포하려면 [Doris 배포 문서](https://doris.apache.org/docs/4.x/install/preparation/env-checking), [OpenTelemetry Collector 설치 문서](https://opentelemetry.io/docs/collector/install/), [Grafana 설치 문서](https://grafana.com/docs/grafana/latest/setup-grafana/installation/)를 따르세요.
:::

이 가이드는 AI Observe Stack 커밋 [`2c1fbee83170`](https://github.com/ai-observe/ai-observe-stack/tree/2c1fbee831701178c7dddba857e88130ef292949)을 기준으로 검증되었습니다. 아래의 checkout 명령은 이 리비전을 고정하므로 이후 main 브랜치가 변경되어도 매개변수가 바뀌지 않습니다. 내장 Doris 이미지는 `4.0.3-all-slim`이며, 스택 연결 확인용으로 제공됩니다.

## 사전 요구 사항 {#prerequisites}

- Docker Engine 20.10 이상
- Docker Compose 2.0 이상

## 배포 {#deployment}

1. 저장소를 복제합니다.

   ```Bash
   git clone https://github.com/ai-observe/ai-observe-stack.git
   cd ai-observe-stack
   git checkout 2c1fbee831701178c7dddba857e88130ef292949
   cd docker
   ```

2. 서비스를 시작합니다. 다음 모드 중 하나를 선택하세요.

   - **내장 Doris**: OpenTelemetry Collector 및 Grafana와 함께 올인원 Doris를 시작합니다.

     ```Bash
     docker compose up -d
     ```

   - **기존 Doris**: OpenTelemetry Collector와 Grafana만 시작하고, 기존 Doris 클러스터에 데이터를 기록합니다. 먼저 구성 파일을 생성합니다.

     ```Bash
     cp .env.example .env
     ```

     `.env`에서 Doris 연결 설정을 수정합니다.

     ```Bash
     DORIS_FE_HTTP_ENDPOINT=http://<DORIS_FE_HOST>:8030
     DORIS_FE_MYSQL_ENDPOINT=<DORIS_FE_HOST>:9030
     DORIS_USERNAME=root
     DORIS_PASSWORD=
     ```

     그런 다음 서비스를 시작합니다.

     ```Bash
     docker compose -f docker-compose-without-doris.yaml up -d
     ```

     계정에는 대상 데이터베이스 및 테이블 생성, 데이터 적재, Grafana에서 사용하는 테이블에 대한 쿼리를 수행할 수 있는 권한이 있어야 합니다. OpenTelemetry Collector는 데이터베이스 `otel`과 해당 테이블을 자동으로 생성합니다.

     OpenTelemetry Collector는 Stream Load를 통해 데이터를 기록합니다. FE는 각 요청을 BE가 Doris에 등록한 주소의 BE로 리디렉션합니다(주소는 `SHOW BACKENDS`로 확인). 따라서 FE뿐 아니라 BE 주소와 BE HTTP 포트(기본값 8040)에도 OpenTelemetry Collector 컨테이너에서 접근할 수 있어야 합니다.

3. 서비스가 실행 중인지 확인합니다.

   ```Bash
   docker compose ps
   ```

   기존 Doris 모드에서는 `-f docker-compose-without-doris.yaml`을 추가합니다. 모든 서비스의 `STATUS` 열에 `Up`이 표시되어야 합니다. 내장 Doris를 사용하는 경우 OpenTelemetry Collector는 Doris가 상태 확인을 통과한 후에만 시작됩니다.

4. http://localhost:3000 에 접속한 다음 `admin` / `admin`으로 Grafana에 로그인합니다.

## 서비스 엔드포인트 {#service-endpoints}

| 서비스 | 엔드포인트 | 인증 정보 |
| --- | --- | --- |
| Grafana | http://localhost:3000 | admin / admin |
| OTLP gRPC | localhost:4317 | - |
| OTLP HTTP | localhost:4318 | - |
| OpenTelemetry Collector 상태 확인 | http://localhost:13133 | - |
| Doris FE Web UI (내장 Doris만 해당) | http://localhost:8030 | root / 빈 비밀번호 |
| Doris MySQL 프로토콜 (내장 Doris만 해당) | localhost:9030 | root / 빈 비밀번호 |

OpenTelemetry SDK로 계측된 애플리케이션은 `localhost:4317`(gRPC) 또는 `localhost:4318`(HTTP)로 데이터를 전송합니다.

## 중지 및 정리 {#stop-and-clean-up}

서비스를 중지하고 데이터를 유지합니다.

```Bash
docker compose down
```

서비스를 중지하고 모든 데이터를 삭제합니다.

```Bash
docker compose down -v
```

기존 Doris 모드에서는 두 명령 모두에 `-f docker-compose-without-doris.yaml`을 추가합니다. 기존 Doris 클러스터의 데이터는 삭제되지 않습니다.
