---
{
    "title": "Langfuse",
    "language": "ru",
    "description": "Узнайте, как развернуть Langfuse с Apache Doris в качестве аналитического бэкенда: настройка, развёртывание с Docker Compose и интеграция через SDK.",
    "keywords": [
        "Langfuse",
        "Apache Doris",
        "наблюдаемость LLM",
        "аналитический бэкенд Langfuse"
    ]
}
---

<!-- Knowledge type: One-sentence definition -->
<!-- Use case: LLM application observability / Analytics backend deployment -->

Langfuse — платформа с открытым исходным кодом для разработки приложений на базе LLM. Она обеспечивает отслеживание трасс, оценку производительности, управление промптами и мониторинг метрик приложений на базе больших языковых моделей. Langfuse on Doris использует Apache Doris в качестве аналитического бэкенда и подходит для обработки больших объёмов данных наблюдаемости приложений на базе LLM.

В этом документе описано, как развернуть решение Langfuse на базе Apache Doris и настроить сбор трасс приложений через Langfuse SDK, LangChain SDK и LlamaIndex SDK.

## Варианты использования и основные возможности {#use-cases-and-core-capabilities}

<!-- Knowledge type: Feature overview -->
<!-- Use case: Solution selection / Capability evaluation -->

Langfuse on Doris подходит для централизованной регистрации трасс вызовов, анализа производительности моделей, управления промптами и мониторинга затрат и качества в приложениях на базе LLM. Langfuse обеспечивает наблюдаемость на стороне приложения, а Apache Doris хранит аналитические данные OLAP.

| Возможность | Сценарий использования |
|------|----------|
| Отслеживание трасс | Запись полных трасс вызовов и последовательностей выполнения приложений на базе LLM |
| Оценка производительности | Многомерная оценка производительности моделей и анализ качества |
| Управление промптами | Централизованное управление шаблонами промптов и контроль их версий |
| Мониторинг метрик | Мониторинг производительности приложений, затрат и показателей качества в реальном времени |

## Архитектура и компоненты {#architecture-and-components}

<!-- Knowledge type: Architecture description -->
<!-- Use case: Deployment planning / Component understanding -->

Langfuse on Doris использует микросервисную архитектуру. Langfuse Web и Worker обрабатывают взаимодействия с приложениями, интеграцию через API и асинхронные задачи. PostgreSQL, Redis и MinIO отвечают за транзакционные данные, кэш и очередь, а также объектное хранилище соответственно. Doris служит аналитическим бэкендом OLAP для хранения и запросов данных наблюдаемости.

| Компонент | Порт | Описание |
|------|------|----------|
| Langfuse Web | 3000 | Веб-интерфейс и сервис API для взаимодействия с пользователями и приёма данных |
| Langfuse Worker | 3030 | Обработка асинхронных задач, включая обработку данных и аналитические задачи |
| PostgreSQL | 5432 | Хранилище транзакционных данных, содержащее пользовательские настройки и метаданные |
| Redis | 6379 | Слой кэширования и очередь сообщений, ускоряющие отклик системы |
| MinIO | 9000 | Сервис объектного хранения для исходных событий и мультимодальных вложений |
| Doris FE | 9030, 8030 | Doris Frontend, отвечает за приём пользовательских запросов, разбор и планирование запросов, управление метаданными и узлами |
| Doris BE | 8040, 8050 | Doris Backend, отвечает за хранение данных и выполнение планов запросов. Данные разбиваются на шарды и хранятся на узлах BE в нескольких репликах |

:::note

При развёртывании Apache Doris можно выбрать архитектуру с совмещёнными или разделёнными хранением и вычислениями в зависимости от имеющегося оборудования и бизнес-требований.

При развёртывании Langfuse использование Doris в Docker не рекомендуется для производственных сред. Doris FE и Doris BE в примере Docker Compose предназначены только для быстрого знакомства с возможностями Langfuse on Doris.

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

## Проверки перед развёртыванием {#pre-deployment-checks}

<!-- Knowledge type: Pre-deployment checks -->
<!-- Use case: Environment validation / Deployment preparation -->

Перед развёртыванием проверьте версии программного обеспечения, аппаратные ресурсы и сетевую доступность. Для повышения производительности и стабильности рекомендуется развернуть Doris отдельно.

### Программное окружение {#software-environment}

| Компонент | Требуемая версия | Описание |
|------|----------|------|
| Docker | 20.0+ | Среда выполнения контейнеров |
| Docker Compose | 2.0+ | Инструмент оркестрации контейнеров |
| Apache Doris | 2.1.10+ | Аналитическая база данных, должна быть развёрнута отдельно |

### Аппаратные ресурсы {#hardware-resources}

| Тип ресурса | Минимальные требования | Рекомендуемая конфигурация | Описание |
|----------|----------|----------|------|
| Память | 8 GB | 16 GB+ | Обеспечивает одновременное выполнение нескольких сервисов |
| Диск | 50 GB | 100 GB+ | Хранит данные контейнеров и журналы |
| Сеть | 1 Gbps | 10 Gbps | Обеспечивает скорость передачи данных |

### Предварительные условия {#prerequisites}

1. **Подготовка кластера Doris**
    - Убедитесь, что кластер Doris работает корректно и стабильно.
    - Проверьте, что HTTP-порт FE (по умолчанию 8030) и порт запросов (по умолчанию 9030) доступны по сети.
    - После запуска Langfuse автоматически создаёт необходимые базы данных и структуры таблиц в Doris.

2. **Сетевая доступность**
    - Среда развёртывания имеет доступ к Docker Hub для загрузки образов.
    - Сервис Langfuse имеет доступ к соответствующим портам кластера Doris.
    - Клиенты имеют доступ к порту сервиса Langfuse Web.

:::tip Рекомендация по развёртыванию

Компоненты сервиса Langfuse, включая Web, Worker, Redis и PostgreSQL, рекомендуется развёртывать с помощью Docker. Для повышения производительности и стабильности рекомендуется развернуть Doris отдельно. Подробное руководство по развёртыванию Doris приведено в официальной документации.

:::

## Настройка сервиса Langfuse {#configure-the-langfuse-service}

<!-- Knowledge type: Configuration parameters -->
<!-- Use case: Environment variable configuration / Backend connection configuration -->

Сервис Langfuse подключается к таким компонентам, как Doris, PostgreSQL и Redis, через переменные окружения. Замените значения из примера в соответствии со своей средой, особенно секреты, пароли и адреса сервисов.

### Настройка аналитического бэкенда Doris {#doris-analytics-backend-configuration}

| Параметр | Пример значения | Описание |
|----------|--------|------|
| `LANGFUSE_ANALYTICS_BACKEND` | `doris` | Задаёт Doris в качестве аналитического бэкенда |
| `DORIS_FE_HTTP_URL` | `http://localhost:8030` | Адрес HTTP-сервиса Doris FE |
| `DORIS_FE_QUERY_PORT` | `9030` | Порт запросов Doris FE |
| `DORIS_DB` | `langfuse` | Имя базы данных Doris |
| `DORIS_USER` | `root` | Имя пользователя Doris |
| `DORIS_PASSWORD` | `123456` | Пароль Doris |
| `DORIS_MAX_OPEN_CONNECTIONS` | `100` | Максимальное число подключений к базе данных |
| `DORIS_REQUEST_TIMEOUT_MS` | `300000` | Тайм-аут запроса в миллисекундах |

### Основная конфигурация сервиса {#basic-service-configuration}

| Параметр | Пример значения | Описание |
|----------|--------|------|
| `DATABASE_URL` | `postgresql://postgres:postgres@langfuse-postgres:5432/postgres` | Адрес подключения к базе данных PostgreSQL |
| `NEXTAUTH_SECRET` | `your-debug-secret-key-here-must-be-long-enough` | Секрет аутентификации NextAuth, используемый для шифрования сеансов |
| `SALT` | `your-super-secret-salt-with-at-least-32-characters-for-encryption` | Соль для шифрования данных, не менее 32 символов |
| `ENCRYPTION_KEY` | `0000000000000000000000000000000000000000000000000000000000000000` | Ключ шифрования данных, 64 символа |
| `NEXTAUTH_URL` | `http://localhost:3000` | Адрес сервиса Langfuse Web |
| `TZ` | `UTC` | Часовой пояс системы |

### Настройка кэша Redis {#redis-cache-configuration}

| Параметр | Пример значения | Описание |
|----------|--------|------|
| `REDIS_HOST` | `langfuse-redis` | Адрес хоста сервиса Redis |
| `REDIS_PORT` | `6379` | Порт сервиса Redis |
| `REDIS_AUTH` | `myredissecret` | Пароль аутентификации Redis |
| `REDIS_TLS_ENABLED` | `false` | Включено ли шифрование TLS |
| `REDIS_TLS_CA` | `-` | Путь к сертификату центра сертификации TLS |
| `REDIS_TLS_CERT` | `-` | Путь к клиентскому сертификату TLS |
| `REDIS_TLS_KEY` | `-` | Путь к закрытому ключу TLS |

### Настройка миграции данных {#data-migration-configuration}

| Параметр | Пример значения | Описание |
|----------|--------|------|
| `LANGFUSE_ENABLE_BACKGROUND_MIGRATIONS` | `false` | Отключает фоновые миграции; при использовании Doris они должны быть отключены |
| `LANGFUSE_AUTO_DORIS_MIGRATION_DISABLED` | `false` | Включает автоматическую миграцию Doris |

## Развёртывание с Docker Compose {#deploy-with-docker-compose}

<!-- Knowledge type: Operation steps -->
<!-- Use case: Quick deployment / Local validation -->

В этом разделе приведён пример Docker Compose, который можно сразу запустить. Измените конфигурацию в соответствии со своими требованиями к развёртыванию.

### Загрузка примера Docker Compose {#download-the-docker-compose-example}

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/docker-langfuse-doris.tar.gz
```

После загрузки и распаковки структура каталогов с файлом Compose и файлами конфигурации выглядит следующим образом:

```text
docker-langfuse-doris
├── docker-compose.yml
└── doris-config
    └── fe_custom.conf
```

### Запуск сервисов {#start-the-services}

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

### Проверка развёртывания {#verify-the-deployment}

Проверьте состояние сервисов. Когда все сервисы находятся в состоянии `Healthy`, запуск Compose завершён успешно.

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

### Инициализация Langfuse {#initialize-langfuse}

После завершения развёртывания откройте веб-интерфейс Langfuse и выполните инициализацию проекта.

Адрес для доступа:

```text
http://localhost:3000
```

Шаги инициализации:

1. Откройте браузер и перейдите в веб-интерфейс Langfuse.
2. Создайте учётную запись администратора и войдите в систему.
3. Создайте новую организацию и новый проект.
4. Получите ключи API проекта, включая публичный и секретный ключи.
5. Настройте данные аутентификации, необходимые для интеграции через SDK.

## Интеграция приложений и просмотр трасс {#integrate-applications-and-view-traces}

<!-- Knowledge type: Operation example -->
<!-- Use case: SDK integration / Trace collection validation -->

После инициализации сервиса можно подключить приложения с помощью Langfuse SDK, LangChain SDK или LlamaIndex SDK. В следующих примерах используется DeepSeek API, а данные трасс записываются в локальный сервис Langfuse.

### Использование Langfuse SDK {#use-the-langfuse-sdk}

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

### Использование LangChain SDK {#use-the-langchain-sdk}

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

### Использование LlamaIndex SDK {#use-the-llamaindex-sdk}

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
