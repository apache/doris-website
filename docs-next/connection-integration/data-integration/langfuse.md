---
{
    "title": "Langfuse",
    "language": "en",
    "description": "Learn how to deploy Langfuse with Apache Doris as the analytics backend, including configuration, Docker Compose deployment, and SDK integration.",
    "keywords": [
        "Langfuse",
        "Apache Doris",
        "LLM observability",
        "Langfuse analytics backend"
    ]
}
---

<!-- Knowledge type: One-sentence definition -->
<!-- Use case: LLM application observability / Analytics backend deployment -->

Langfuse is an open-source LLM engineering platform that provides trace tracking, performance evaluation, prompt management, and metrics monitoring for large language model applications. Langfuse on Doris uses Apache Doris as the analytics backend and is suitable for processing large-scale LLM application observability data.

This document describes how to deploy the Langfuse solution based on Apache Doris and integrate application traces through the Langfuse SDK, LangChain SDK, and LlamaIndex SDK.

## Use Cases and Core Capabilities

<!-- Knowledge type: Feature overview -->
<!-- Use case: Solution selection / Capability evaluation -->

When you want to uniformly record call traces, analyze model performance, manage prompts, and monitor cost and quality in LLM applications, you can use Langfuse on Doris. It uses Langfuse for application-side observability and Apache Doris to host OLAP analytics data.

| Capability | User Scenario |
|------|----------|
| Trace tracking | Records the complete call traces and execution flows of LLM applications |
| Performance evaluation | Provides multi-dimensional model performance evaluation and quality analysis |
| Prompt management | Centrally manages and version-controls prompt templates |
| Metrics monitoring | Monitors application performance, cost, and quality metrics in real time |

## Architecture and Components

<!-- Knowledge type: Architecture description -->
<!-- Use case: Deployment planning / Component understanding -->

Langfuse on Doris adopts a microservices architecture. Langfuse Web and Worker handle application interactions, API integration, and asynchronous tasks. PostgreSQL, Redis, and MinIO handle transactional data, cache and queue, and object storage respectively. Doris serves as the OLAP analytics backend that stores and queries observability data.

| Component | Port | Description |
|------|------|----------|
| Langfuse Web | 3000 | Web interface and API service that provides user interaction and data ingestion |
| Langfuse Worker | 3030 | Asynchronous task processing, responsible for data processing and analytics tasks |
| PostgreSQL | 5432 | Transactional data storage that holds user configurations and metadata |
| Redis | 6379 | Cache layer and message queue that improves system response performance |
| MinIO | 9090 | Object storage service that stores raw events and multi-modal attachments |
| Doris FE | 9030, 8030 | Doris Frontend, responsible for receiving user requests, query parsing and planning, metadata management, and node management |
| Doris BE | 8040, 8050 | Doris Backend, responsible for data storage and query plan execution. Data is split into shards and stored in BEs in multiple replicas |

:::note

When deploying Apache Doris, you can choose either the integrated storage-compute architecture or the separated storage-compute architecture based on your hardware environment and business requirements.

In the Langfuse deployment, Docker Doris is not recommended for production environments. The Doris FE and Doris BE in the example Docker Compose are only intended to help users quickly experience the capabilities of Langfuse on Doris.

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

## Pre-Deployment Checks

<!-- Knowledge type: Pre-deployment checks -->
<!-- Use case: Environment validation / Deployment preparation -->

Before deployment, confirm software versions, hardware resources, and network connectivity. Doris is recommended to be deployed independently for better performance and stability.

### Software Environment

| Component | Version Requirement | Description |
|------|----------|------|
| Docker | 20.0+ | Container runtime environment |
| Docker Compose | 2.0+ | Container orchestration tool |
| Apache Doris | 2.1.10+ | Analytics database, must be deployed independently |

### Hardware Resources

| Resource Type | Minimum Requirement | Recommended Configuration | Description |
|----------|----------|----------|------|
| Memory | 8 GB | 16 GB+ | Supports concurrent execution of multiple services |
| Disk | 50 GB | 100 GB+ | Stores container data and logs |
| Network | 1 Gbps | 10 Gbps | Ensures data transfer performance |

### Prerequisites

1. **Doris Cluster Preparation**
    - Ensure that the Doris cluster runs normally and performs stably.
    - Verify that the FE HTTP port (default 8030) and query port (default 9030) are reachable over the network.
    - After Langfuse starts, it automatically creates the required databases and table structures in Doris.

2. **Network Connectivity**
    - The deployment environment can access Docker Hub to pull images.
    - The Langfuse service can access the relevant ports of the Doris cluster.
    - Clients can access the Langfuse Web service port.

:::tip Deployment Recommendation

It is recommended to deploy the Langfuse service components, including Web, Worker, Redis, and PostgreSQL, with Docker. Doris is recommended to be deployed independently for better performance and stability. For the detailed Doris deployment guide, refer to the official documentation.

:::

## Configure the Langfuse Service

<!-- Knowledge type: Configuration parameters -->
<!-- Use case: Environment variable configuration / Backend connection configuration -->

The Langfuse service connects to components such as Doris, PostgreSQL, and Redis through environment variables. Replace the example values according to your actual environment, especially the secrets, passwords, and service addresses.

### Doris Analytics Backend Configuration

| Parameter | Example Value | Description |
|----------|--------|------|
| `LANGFUSE_ANALYTICS_BACKEND` | `doris` | Specifies Doris as the analytics backend |
| `DORIS_FE_HTTP_URL` | `http://localhost:8030` | Doris FE HTTP service address |
| `DORIS_FE_QUERY_PORT` | `9030` | Doris FE query port |
| `DORIS_DB` | `langfuse` | Doris database name |
| `DORIS_USER` | `root` | Doris username |
| `DORIS_PASSWORD` | `123456` | Doris password |
| `DORIS_MAX_OPEN_CONNECTIONS` | `100` | Maximum number of database connections |
| `DORIS_REQUEST_TIMEOUT_MS` | `300000` | Request timeout, in milliseconds |

### Basic Service Configuration

| Parameter | Example Value | Description |
|----------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@langfuse-postgres:5432/postgres` | PostgreSQL database connection address |
| `NEXTAUTH_SECRET` | `your-debug-secret-key-here-must-be-long-enough` | NextAuth authentication secret, used for session encryption |
| `SALT` | `your-super-secret-salt-with-at-least-32-characters-for-encryption` | Data encryption salt, at least 32 characters |
| `ENCRYPTION_KEY` | `0000000000000000000000000000000000000000000000000000000000000000` | Data encryption key, 64 characters |
| `NEXTAUTH_URL` | `http://localhost:3000` | Langfuse Web service address |
| `TZ` | `UTC` | System time zone |

### Redis Cache Configuration

| Parameter | Example Value | Description |
|----------|--------|------|
| `REDIS_HOST` | `langfuse-redis` | Redis service host address |
| `REDIS_PORT` | `6379` | Redis service port |
| `REDIS_AUTH` | `myredissecret` | Redis authentication password |
| `REDIS_TLS_ENABLED` | `false` | Whether to enable TLS encryption |
| `REDIS_TLS_CA` | `-` | Path to the TLS CA certificate |
| `REDIS_TLS_CERT` | `-` | Path to the TLS client certificate |
| `REDIS_TLS_KEY` | `-` | Path to the TLS private key |

### Data Migration Configuration

| Parameter | Example Value | Description |
|----------|--------|------|
| `LANGFUSE_ENABLE_BACKGROUND_MIGRATIONS` | `false` | Disables background migrations, must be turned off when using Doris |
| `LANGFUSE_AUTO_DORIS_MIGRATION_DISABLED` | `false` | Enables Doris automatic migration |

## Deploy with Docker Compose

<!-- Knowledge type: Operation steps -->
<!-- Use case: Quick deployment / Local validation -->

This section provides a Docker Compose example that you can start directly. You can modify the configuration based on your actual deployment requirements.

### Download the Docker Compose Example

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/docker-langfuse-doris.tar.gz
```

After downloading and extracting, the directory structure of the Compose file and configuration files is as follows:

```text
docker-langfuse-doris
├── docker-compose.yml
└── doris-config
    └── fe_custom.conf
```

### Start the Services

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

### Verify the Deployment

Check the service status. When all services are in the `Healthy` state, Compose has started successfully.

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

### Initialize Langfuse

After the deployment is complete, access the Langfuse Web interface and finish project initialization.

Access address:

```text
http://localhost:3000
```

Initialization steps:

1. Open a browser and access the Langfuse Web interface.
2. Create an administrator account and log in.
3. Create a new organization and a new project.
4. Obtain the API Keys of the project, including the Public Key and Secret Key.
5. Configure the authentication information required for SDK integration.

## Integrate Applications and View Traces

<!-- Knowledge type: Operation example -->
<!-- Use case: SDK integration / Trace collection validation -->

After service initialization is complete, you can use the Langfuse SDK, LangChain SDK, or LlamaIndex SDK to integrate applications. The following examples use the DeepSeek API and write trace data to the local Langfuse service.

### Use the Langfuse SDK

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

### Use the LangChain SDK

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

### Use the LlamaIndex SDK

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
