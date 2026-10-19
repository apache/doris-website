---
{
    "title": "Langfuse",
    "language": "ko",
    "description": "구성, Docker Compose 배포, SDK 통합을 포함하여 Apache Doris를 분석 백엔드로 사용하는 Langfuse 배포 방법을 알아봅니다.",
    "keywords": [
        "Langfuse",
        "Apache Doris",
        "LLM 관측성",
        "Langfuse 분석 백엔드"
    ]
}
---

<!-- Knowledge type: One-sentence definition -->
<!-- Use case: LLM application observability / Analytics backend deployment -->

Langfuse는 대규모 언어 모델 애플리케이션을 위한 트레이스 추적, 성능 평가, 프롬프트 관리, 지표 모니터링 기능을 제공하는 오픈 소스 LLM 엔지니어링 플랫폼입니다. Langfuse on Doris는 Apache Doris를 분석 백엔드로 사용하며, 대규모 LLM 애플리케이션 관측성 데이터를 처리하는 데 적합합니다.

이 문서에서는 Apache Doris 기반의 Langfuse 솔루션을 배포하고 Langfuse SDK, LangChain SDK, LlamaIndex SDK를 통해 애플리케이션 트레이스를 연동하는 방법을 설명합니다.

## 사용 사례 및 핵심 기능 {#use-cases-and-core-capabilities}

<!-- Knowledge type: Feature overview -->
<!-- Use case: Solution selection / Capability evaluation -->

LLM 애플리케이션에서 호출 트레이스를 일관되게 기록하고, 모델 성능을 분석하고, 프롬프트를 관리하고, 비용과 품질을 모니터링하려는 경우 Langfuse on Doris를 사용할 수 있습니다. 애플리케이션 측 관측성에는 Langfuse를 사용하고, OLAP 분석 데이터는 Apache Doris에 저장합니다.

| 기능 | 사용자 시나리오 |
|------|----------|
| 트레이스 추적 | LLM 애플리케이션의 전체 호출 트레이스와 실행 흐름 기록 |
| 성능 평가 | 다차원 모델 성능 평가 및 품질 분석 제공 |
| 프롬프트 관리 | 프롬프트 템플릿의 중앙 집중식 관리 및 버전 관리 |
| 지표 모니터링 | 애플리케이션 성능, 비용, 품질 지표를 실시간으로 모니터링 |

## 아키텍처 및 구성 요소 {#architecture-and-components}

<!-- Knowledge type: Architecture description -->
<!-- Use case: Deployment planning / Component understanding -->

Langfuse on Doris는 마이크로서비스 아키텍처를 채택합니다. Langfuse Web과 Worker는 애플리케이션 상호작용, API 통합, 비동기 작업을 처리합니다. PostgreSQL, Redis, MinIO는 각각 트랜잭션 데이터, 캐시 및 큐, 객체 스토리지를 담당합니다. Doris는 관측성 데이터를 저장하고 쿼리하는 OLAP 분석 백엔드 역할을 합니다.

| 구성 요소 | 포트 | 설명 |
|------|------|----------|
| Langfuse Web | 3000 | 사용자 상호작용 및 데이터 수집 기능을 제공하는 웹 인터페이스와 API 서비스 |
| Langfuse Worker | 3030 | 데이터 처리 및 분석 작업을 담당하는 비동기 작업 처리 서비스 |
| PostgreSQL | 5432 | 사용자 구성과 메타데이터를 보관하는 트랜잭션 데이터 스토리지 |
| Redis | 6379 | 시스템 응답 성능을 개선하는 캐시 계층 및 메시지 큐 |
| MinIO | 9000 | 원시 이벤트와 멀티모달 첨부 파일을 저장하는 객체 스토리지 서비스 |
| Doris FE | 9030, 8030 | 사용자 요청 수신, 쿼리 파싱 및 계획 수립, 메타데이터 관리, 노드 관리를 담당하는 Doris Frontend |
| Doris BE | 8040, 8050 | 데이터 저장 및 쿼리 계획 실행을 담당하는 Doris Backend. 데이터는 샤드로 분할되어 여러 복제본으로 BE에 저장됨 |

:::note

Apache Doris를 배포할 때는 하드웨어 환경과 비즈니스 요구 사항에 따라 스토리지와 컴퓨팅이 통합된 아키텍처 또는 분리된 아키텍처를 선택할 수 있습니다.

Langfuse 배포 시 프로덕션 환경에서는 Docker Doris 사용을 권장하지 않습니다. Docker Compose 예제의 Doris FE와 Doris BE는 사용자가 Langfuse on Doris의 기능을 빠르게 체험할 수 있도록 제공됩니다.

:::

```mermaid
flowchart TB
    User["UI, API, SDKs"]
    subgraph vpc["VPC"]
        Web["Web Server<br/>(langfuse/langfuse)"]
        Worker["Async Worker<br/>(langfuse/worker)"]
        Postgres["Postgres - OLTP<br/>(Transactional Data)"]
        Cache["Redis/Valkey<br/>(Cache, Queue)"]
        Doris["Doris - OLAP<br/>(Observability Data)"]
        S3["S3 / Blob Storage<br/>(Raw events, multi-modal attachments)"]
    end
    LLM["LLM API/Gateway<br/>(optional)"]

    User --> Web
    Web --> S3
    Web --> Postgres
    Web --> Cache
    Web --> Doris
    Web -.->|"optional for playground"| LLM

    Cache --> Worker
    Worker --> Doris
    Worker --> Postgres
    Worker --> S3
    Worker -.->|"optional for evals"| LLM
```

## 배포 전 확인 사항 {#pre-deployment-checks}

<!-- Knowledge type: Pre-deployment checks -->
<!-- Use case: Environment validation / Deployment preparation -->

배포 전에 소프트웨어 버전, 하드웨어 리소스, 네트워크 연결을 확인하세요. 성능과 안정성을 높이려면 Doris를 독립적으로 배포하는 것을 권장합니다.

### 소프트웨어 환경 {#software-environment}

| 구성 요소 | 버전 요구 사항 | 설명 |
|------|----------|------|
| Docker | 20.0+ | 컨테이너 런타임 환경 |
| Docker Compose | 2.0+ | 컨테이너 오케스트레이션 도구 |
| Apache Doris | 2.1.10+ | 분석용 데이터베이스로, 독립적으로 배포해야 함 |

### 하드웨어 리소스 {#hardware-resources}

| 리소스 유형 | 최소 요구 사항 | 권장 구성 | 설명 |
|----------|----------|----------|------|
| 메모리 | 8 GB | 16 GB+ | 여러 서비스의 동시 실행 지원 |
| 디스크 | 50 GB | 100 GB+ | 컨테이너 데이터 및 로그 저장 |
| 네트워크 | 1 Gbps | 10 Gbps | 데이터 전송 성능 보장 |

### 사전 요구 사항 {#prerequisites}

1. **Doris 클러스터 준비**
    - Doris 클러스터가 정상적으로 작동하고 안정적인 성능을 제공하는지 확인하세요.
    - 네트워크를 통해 FE HTTP 포트(기본값 8030)와 쿼리 포트(기본값 9030)에 접근할 수 있는지 확인하세요.
    - Langfuse는 시작된 후 Doris에 필요한 데이터베이스와 테이블 구조를 자동으로 생성합니다.

2. **네트워크 연결**
    - 배포 환경에서 Docker Hub에 접근하여 이미지를 가져올 수 있어야 합니다.
    - Langfuse 서비스에서 Doris 클러스터의 관련 포트에 접근할 수 있어야 합니다.
    - 클라이언트에서 Langfuse Web 서비스 포트에 접근할 수 있어야 합니다.

:::tip 배포 권장 사항

Web, Worker, Redis, PostgreSQL을 포함한 Langfuse 서비스 구성 요소는 Docker로 배포하는 것을 권장합니다. 성능과 안정성을 높이려면 Doris를 독립적으로 배포하는 것을 권장합니다. 자세한 Doris 배포 가이드는 공식 문서를 참조하세요.

:::

## Langfuse 서비스 구성 {#configure-the-langfuse-service}

<!-- Knowledge type: Configuration parameters -->
<!-- Use case: Environment variable configuration / Backend connection configuration -->

Langfuse 서비스는 환경 변수를 통해 Doris, PostgreSQL, Redis 등의 구성 요소에 연결합니다. 실제 환경에 맞게 예제 값을 바꾸세요. 특히 시크릿, 비밀번호, 서비스 주소를 확인해야 합니다.

### Doris 분석 백엔드 구성 {#doris-analytics-backend-configuration}

| 매개변수 | 예제 값 | 설명 |
|----------|--------|------|
| `LANGFUSE_ANALYTICS_BACKEND` | `doris` | Doris를 분석 백엔드로 지정 |
| `DORIS_FE_HTTP_URL` | `http://localhost:8030` | Doris FE HTTP 서비스 주소 |
| `DORIS_FE_QUERY_PORT` | `9030` | Doris FE 쿼리 포트 |
| `DORIS_DB` | `langfuse` | Doris 데이터베이스 이름 |
| `DORIS_USER` | `root` | Doris 사용자 이름 |
| `DORIS_PASSWORD` | `123456` | Doris 비밀번호 |
| `DORIS_MAX_OPEN_CONNECTIONS` | `100` | 최대 데이터베이스 연결 수 |
| `DORIS_REQUEST_TIMEOUT_MS` | `300000` | 요청 제한 시간(밀리초) |

### 기본 서비스 구성 {#basic-service-configuration}

| 매개변수 | 예제 값 | 설명 |
|----------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@langfuse-postgres:5432/postgres` | PostgreSQL 데이터베이스 연결 주소 |
| `NEXTAUTH_SECRET` | `your-debug-secret-key-here-must-be-long-enough` | 세션 암호화에 사용되는 NextAuth 인증 시크릿 |
| `SALT` | `your-super-secret-salt-with-at-least-32-characters-for-encryption` | 데이터 암호화 솔트, 최소 32자 |
| `ENCRYPTION_KEY` | `0000000000000000000000000000000000000000000000000000000000000000` | 데이터 암호화 키, 64자 |
| `NEXTAUTH_URL` | `http://localhost:3000` | Langfuse Web 서비스 주소 |
| `TZ` | `UTC` | 시스템 시간대 |

### Redis 캐시 구성 {#redis-cache-configuration}

| 매개변수 | 예제 값 | 설명 |
|----------|--------|------|
| `REDIS_HOST` | `langfuse-redis` | Redis 서비스 호스트 주소 |
| `REDIS_PORT` | `6379` | Redis 서비스 포트 |
| `REDIS_AUTH` | `myredissecret` | Redis 인증 비밀번호 |
| `REDIS_TLS_ENABLED` | `false` | TLS 암호화 활성화 여부 |
| `REDIS_TLS_CA` | `-` | TLS CA 인증서 경로 |
| `REDIS_TLS_CERT` | `-` | TLS 클라이언트 인증서 경로 |
| `REDIS_TLS_KEY` | `-` | TLS 개인 키 경로 |

### 데이터 마이그레이션 구성 {#data-migration-configuration}

| 매개변수 | 예제 값 | 설명 |
|----------|--------|------|
| `LANGFUSE_ENABLE_BACKGROUND_MIGRATIONS` | `false` | 백그라운드 마이그레이션 비활성화. Doris 사용 시 반드시 비활성화해야 함 |
| `LANGFUSE_AUTO_DORIS_MIGRATION_DISABLED` | `false` | Doris 자동 마이그레이션 활성화 |

## Docker Compose로 배포 {#deploy-with-docker-compose}

<!-- Knowledge type: Operation steps -->
<!-- Use case: Quick deployment / Local validation -->

이 섹션에서는 바로 실행할 수 있는 Docker Compose 예제를 제공합니다. 실제 배포 요구 사항에 맞게 구성을 수정할 수 있습니다.

### Docker Compose 예제 다운로드 {#download-the-docker-compose-example}

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/docker-langfuse-doris.tar.gz
```

다운로드한 파일의 압축을 풀면 Compose 파일과 구성 파일의 디렉터리 구조는 다음과 같습니다.

```text
docker-langfuse-doris
├── docker-compose.yml
└── doris-config
    └── fe_custom.conf
```

### 서비스 시작 {#start-the-services}

```bash
$ docker compose up -d
[+] Running 9/9
 ✔ Network docker-langfuse-doris_doris_internal  Created                                                                                                                                                                                               0.1s
 ✔ Network docker-langfuse-doris_default         Created                                                                                                                                                                                               0.1s
 ✔ Container doris_fe                            Healthy                                                                                                                                                                                              13.8s
 ✔ Container langfuse-postgres                   Healthy                                                                                                                                                                                              13.8s
 ✔ Container langfuse-redis                      Healthy                                                                                                                                                                                              13.8s
 ✔ Container langfuse-minio                      Healthy                                                                                                                                                                                              13.8s
 ✔ Container doris_be                            Healthy                                                                                                                                                                                              54.3s
 ✔ Container langfuse-worker                     Started                                                                                                                                                                                              54.8s
 ✔ Container langfuse-web                        Started
```

### 배포 확인 {#verify-the-deployment}

서비스 상태를 확인하세요. 모든 서비스가 `Healthy` 상태이면 Compose가 정상적으로 시작된 것입니다.

```bash
$ docker compose ps
NAME                IMAGE                             COMMAND                  SERVICE           CREATED         STATUS                        PORTS
doris_be            apache/doris:be-2.1.11            "bash entry_point.sh"    doris_be          2 minutes ago   Up 2 minutes (healthy)        0.0.0.0:8040->8040/tcp, :::8040->8040/tcp, 0.0.0.0:8060->8060/tcp, :::8060->8060/tcp, 0.0.0.0:9050->9050/tcp, :::9050->9050/tcp, 0.0.0.0:9060->9060/tcp, :::9060->9060/tcp
doris_fe            apache/doris:fe-2.1.11            "bash init_fe.sh"        doris_fe          2 minutes ago   Up 2 minutes (healthy)        0.0.0.0:8030->8030/tcp, :::8030->8030/tcp, 0.0.0.0:9010->9010/tcp, :::9010->9010/tcp, 0.0.0.0:9030->9030/tcp, :::9030->9030/tcp
langfuse-minio      minio/minio                       "sh -c 'mkdir -p /da…"   minio             2 minutes ago   Up 2 minutes (healthy)        0.0.0.0:19090->9000/tcp, :::19090->9000/tcp, 127.0.0.1:19091->9001/tcp
langfuse-postgres   postgres:latest                   "docker-entrypoint.s…"   postgres          2 minutes ago   Up 2 minutes (healthy)        127.0.0.1:5432->5432/tcp
langfuse-redis      redis:7                           "docker-entrypoint.s…"   redis             2 minutes ago   Up 2 minutes (healthy)        127.0.0.1:16379->6379/tcp
langfuse-web        selectdb/langfuse-web:latest      "dumb-init -- ./web/…"   langfuse-web      2 minutes ago   Up About a minute (healthy)   0.0.0.0:13000->3000/tcp, :::13000->3000/tcp
langfuse-worker     selectdb/langfuse-worker:latest   "dumb-init -- ./work…"   langfuse-worker   2 minutes ago   Up About a minute (healthy)   0.0.0.0:3030->3030/tcp, :::3030->3030/tcp
```

### Langfuse 초기화 {#initialize-langfuse}

배포가 완료되면 Langfuse Web 인터페이스에 접속하여 프로젝트 초기화를 완료하세요.

접속 주소:

```text
http://localhost:3000
```

초기화 단계:

1. 브라우저를 열고 Langfuse Web 인터페이스에 접속합니다.
2. 관리자 계정을 생성하고 로그인합니다.
3. 새 조직과 새 프로젝트를 생성합니다.
4. Public Key와 Secret Key를 포함한 프로젝트의 API Keys를 확인합니다.
5. SDK 통합에 필요한 인증 정보를 구성합니다.

## 애플리케이션 연동 및 트레이스 확인 {#integrate-applications-and-view-traces}

<!-- Knowledge type: Operation example -->
<!-- Use case: SDK integration / Trace collection validation -->

서비스 초기화가 완료되면 Langfuse SDK, LangChain SDK 또는 LlamaIndex SDK를 사용하여 애플리케이션을 연동할 수 있습니다. 다음 예제는 DeepSeek API를 사용하며 트레이스 데이터를 로컬 Langfuse 서비스에 기록합니다.

### Langfuse SDK 사용 {#use-the-langfuse-sdk}

```python
import os

# Instead of: import openai
from langfuse.openai import OpenAI

# from langfuse import observe

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******"
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"

# use OpenAI client to access DeepSeek API
client = OpenAI(
    base_url="https://api.deepseek.com"
)

# ask a question
question = "What are the characteristics of the Doris observability solution? Answer concisely and clearly."
print(f"question: {question}")

completion = client.chat.completions.create(
    model="deepseek-chat",
    messages=[
        {"role": "user", "content": question}
    ]
)
response = completion.choices[0].message.content
print(f"response: {response}")
```

### LangChain SDK 사용 {#use-the-langchain-sdk}

```python
import os

from langfuse.langchain import CallbackHandler
from langchain_openai import ChatOpenAI

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******"
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"

# Create your LangChain components (using DeepSeek API)
llm = ChatOpenAI(
    model="deepseek-chat",
    openai_api_base="https://api.deepseek.com"
)

# ask a question
question = "What are the characteristics of the Doris observability solution? Answer concisely and clearly."
print(f"question: {question} \n")

# Run your chain with Langfuse tracing
try:
    # Initialize the Langfuse handler
    langfuse_handler = CallbackHandler()
    response = llm.invoke(question, config={"callbacks": [langfuse_handler]})
    print(f"response: {response.content}")
except Exception as e:
    print(f"Error during chain execution: {e}")
```

### LlamaIndex SDK 사용 {#use-the-llamaindex-sdk}

```python
import os

from langfuse import get_client
from openinference.instrumentation.llama_index import LlamaIndexInstrumentor
from llama_index.llms.deepseek import DeepSeek

# Langfuse config
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-******-******"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-******-******"
os.environ["LANGFUSE_HOST"] = "http://localhost:3000"

langfuse = get_client()

# Initialize LlamaIndex instrumentation
LlamaIndexInstrumentor().instrument()

# Set up the DeepSeek class with the required model and API key
llm = DeepSeek(model="deepseek-chat")

# ask a question
question = "What are the characteristics of the Doris observability solution? Answer concisely and clearly."
print(f"question: {question} \n")

with langfuse.start_as_current_span(name="llama-index-trace"):
    response = llm.complete(question)
    print(f"response: {response}")
```
