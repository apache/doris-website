---
{
    "title": "Обзор | Функции AI",
    "language": "ru",
    "description": "AI Function — встроенная функция, предоставляемая Doris на основе возможностей искусственного интеллекта (AI).",
    "sidebar_label": "Обзор"
}
---

# Обзор {#overview}

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Описание {#description}

AI Function — встроенная функция, предоставляемая Doris на основе возможностей искусственного интеллекта (AI). Пользователи могут напрямую вызывать AI в SQL-запросах для выполнения различных интеллектуальных задач обработки текста. AI Function подключается к нескольким основным поставщикам AI (например, OpenAI, Anthropic, DeepSeek, Gemini, Ollama, MoonShot и другим) через механизм ресурсов Doris.

Используемый AI должен предоставляться Doris извне и поддерживать анализ текста.

---

## Настройка AI Resource {#configure-ai-resource}

Перед использованием AI Function необходимо создать Resource типа AI для централизованного управления данными доступа к AI API.

### Пример: создание AI Resource {#example-create-ai-resource}

```sql
CREATE RESOURCE "ai_resource_name"
PROPERTIES (
    'type' = 'ai',
    'ai.provider_type' = 'openai',
    'ai.endpoint' = 'https://endpoint_example',
    'ai.model_name' = 'model_example',
    'ai.api_key' = 'sk-xxx',
    'ai.temperature' = '0.7',
    'ai.max_token' = '1024',
    'ai.max_retries' = '3',
    'ai.retry_delay_second' = '1',
    'ai.dimensions' = '1024'
);
 ```

##### Описание параметров {#parameter-description}

Ресурс AI должен содержать как минимум одну полную группу подключения: общую `ai.*`, группу текстового embedding `ai.embed.*` или группу мультимодального embedding `ai.embed.mm.*`. Для каждой настроенной группы требуются `endpoint`, `provider_type`, `model_name` и `api_key`, если её провайдер не `LOCAL`. Приведённые ниже обязательные поля подключения описывают общую группу, которую используют скалярные AI-функции и `AI_AGG`. Текстовый `EMBED` сначала выбирает `ai.embed.*`, а затем общую группу; JSON-мультимодальный `EMBED` выбирает `ai.embed.mm.*`, затем `ai.embed.*`, а затем общую группу. Все восемь полей и пример приведены в разделе [специальные свойства embedding](../../../ai/ai-function-overview.md#dedicated-embedding-properties).

`type`: обязательный параметр, должен иметь значение `ai` и используется как идентификатор типа для ai.

`ai.provider_type`: обязательный параметр общей группы модели. Указывает внешнего поставщика AI. Поддерживаются OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan, VoyageAI и Jina. Если другой поставщик использует API, совместимый с [OpenAI](https://platform.openai.com/docs/overview), [Anthropic](https://docs.anthropic.com/en/api/messages-examples) или [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1), укажите соответствующий совместимый тип поставщика.

Допустимый тип поставщика не означает поддержку всех AI-функций. Например, VoyageAI и Jina поддерживают embedding и не могут использоваться как модели генерации текста.

`ai.endpoint`: обязательный параметр общей группы модели. Указывает конечную точку AI API.

`ai.model_name`: обязательный параметр общей группы модели. Указывает имя модели.

`ai.api_key`: ключ API общей группы модели. Обязателен, если `ai.provider_type = local`.

`ai.temperature`: необязательный параметр, управляющий случайностью сгенерированного содержимого. Принимает значение с плавающей точкой от 0 до 1.
Значение по умолчанию — -1, что означает, что параметр не задан.

`ai.max_token`: необязательный параметр, ограничивающий максимальное число токенов в сгенерированном содержимом.
Значение по умолчанию — -1, что означает, что параметр не задан. Для Anthropic значение по умолчанию — 2048.

`ai.max_retries`: необязательный параметр, задающий максимальное число повторных попыток для одного запроса. Значение по умолчанию — 3.

`ai.retry_delay_second`: необязательный параметр, задающий задержку перед повторной попыткой в секундах. Значение по умолчанию в ветке разработки — 1; в Doris 4.1.5 — 0.

`ai.enable_structured_output`: необязательный параметр Boolean со значением по умолчанию `true`. Doris объединяет входные строки для скалярных AI-функций в пакеты. Включение этого параметра добавляет зависящие от поставщика поля формата, повышая надёжность формата ответа. Doris не проверяет, поддерживает ли настроенная модель эти поля; для LOCAL и MiniMax они не передаются. Если модель или endpoint отклоняет эти поля, установите `false`. Пакетная обработка, инструкции по формату в системном промпте и проверка ответа остаются включёнными. Это свойство не применяется к `AI_AGG` или `EMBED`.

`ai.dimensions`: необязательный параметр, управляющий размерностью вектора, возвращаемого [EMBED](./distance-functions/embed.md).
**Перед настройкой обязательно убедитесь, что модель, указанная в `ai.model_name`, поддерживает пользовательскую размерность вектора**; в противном случае вызов модели может завершиться ошибкой.

### Настройка выделенных моделей Embedding (начиная с 4.1.5) {#dedicated-embedding-model-configuration-since-415}

Начиная с версии 4.1.5 в AI Resource можно отдельно настроить общую модель, модель текстового embedding и модель мультимодального embedding. Требуется как минимум одна полная группа. Если для группы задано какое-либо свойство подключения или ключ API, эта группа должна включать `endpoint`, `provider_type` и `model_name`, а для провайдеров, отличных от `LOCAL`, также `api_key`. Отсутствующие поля не наследуются из других групп.

| Группа модели | Свойства подключения | Ключ API | Использование |
| --- | --- | --- | --- |
| Общая | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | Генерация текста и другие AI-функции; резервный вариант, если выделенная группа embedding не настроена |
| Текстовый embedding | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | Текстовый ввод в `EMBED()`; резервный вариант для мультимодального ввода |
| Мультимодальный embedding | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | JSON-мультимодальный ввод в `EMBED()` |

Текстовый `EMBED()` сначала выбирает группу текстового embedding, а затем общую группу. Мультимодальный `EMBED()` выбирает группу мультимодального embedding, затем группу текстового embedding, а затем общую группу. Выбранные провайдер и модель должны поддерживать фактический тип мультимедийных данных. Resource, содержащий только группы embedding, может обслуживать соответствующие вызовы `EMBED()`, но не может обслуживать функции генерации текста, которым требуется общая модель.

Например, Resource, используемый только для текстового embedding, не требует общей модели генерации:

```sql
CREATE RESOURCE "text_embed_resource"
PROPERTIES (
    "type" = "ai",
    "ai.embed.provider_type" = "openai",
    "ai.embed.endpoint" = "https://<embedding-service>/v1/embeddings",
    "ai.embed.model_name" = "<embedding-model>",
    "ai.embed.api_key" = "<api-key>"
);
```

Замените значения подключения конфигурацией своей службы. При успешном создании возвращается `Query OK`. Общие параметры, такие как `ai.dimensions` и параметры повторных попыток, по-прежнему берутся из конфигурации Resource.

### Уровень рассуждений: `ai.effort` (начиная с 4.1.5) {#reasoning-effort-aieffort-since-415}

Начиная с версии 4.1.5 необязательное строковое свойство `ai.effort` задаёт уровень рассуждений. По умолчанию оно не задано и не отправляется поставщику. Используйте значения в нижнем регистре с учётом проверки поставщика:

| Поставщик | Допустимые значения |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| Проверка свойства для других поставщиков | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

Успешная проверка свойства не означает, что каждая модель поддерживает соответствующий уровень. Выберите значение, поддерживаемое вашей службой и моделью. `ai.effort` не заменяет `ai.max_token`.

Пустая строка в `ALTER RESOURCE` удаляет настройку `ai.effort`.

### Разрешения на создание, изменение и удаление (начиная с 4.1.5) {#create-alter-and-drop-permissions-since-415}

Для создания AI Resource требуются глобальные привилегии `ADMIN`. Начиная с версии 4.1.5 конфигурация FE [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) может дополнительно ограничить личность создателя. Значение по умолчанию `*` не добавляет ограничений по личности.

AI Resource, созданный `root` начиная с версии 4.1.5, может изменять или удалять только `root`; другие учётные записи получают отказ даже при наличии привилегий `ADMIN`. Ресурсы, существовавшие до обновления и не имеющие этой отметки, задним числом не помечаются. Для остальных ресурсов сохраняются действующие проверки привилегий.

---

## Выбор ресурса и переменные Session {#resource-selection-and-session-variables}

При вызове функций, связанных с AI, ресурсы можно указать двумя способами:

- Явно указать ресурс: передать имя ресурса непосредственно при вызове функции.
- Неявно указать ресурс: заранее задать переменную Session, после чего функция автоматически использует соответствующий ресурс.

Формат задания переменной Session:
```sql
SET default_ai_resource='resource_name';
```

Формат вызова функции:
```sql
SELECT AI_FUNCTION([<resource_name>], <args...>);
```

### Приоритет выбора ресурса {#resource-selection-priority}

При вызове AI_Function ресурс выбирается в следующем порядке:

1. Ресурс, явно указанный пользователем при вызове
2. Глобальный ресурс по умолчанию (`default_ai_resource`)

Пример:

```sql
SET default_ai_resource='global_default_resource';
SELECT AI_SENTIMENT('this is a test'); -- Uses resource named 'global_default_resource'
SELECT AI_SENTIMENT('invoke_resource', 'this is a test'); --Uses resource named 'invoke_resource'
```

---

## Функции AI {#ai-functions}

В настоящее время Doris поддерживает следующие AI Function:

- `AI_CLASSIFY`: Классификация информации

- `AI_EXTRACT`: Извлечение информации

- `AI_FILTER`：Фильтрация информации

- `AI_FIXGRAMMAR`: Исправление грамматики

- `AI_GENERATE`: Генерация текста

- `AI_MASK`: Маскирование конфиденциальной информации

- `AI_SENTIMENT`: Анализ тональности

- `AI_SIMILARITY`: Сравнение семантического сходства текстов

- `AI_SUMMARIZE`: Обобщение текста

- `AI_TRANSLATE`: Перевод

- `AI_AGG`: Выполнение построчного агрегированного анализа нескольких текстов

### Примеры {#examples}

1. `AI_TRANSLATE`
```sql
SELECT AI_TRANSLATE('resource_name', 'this is a test', 'Chinese');
-- 这是一个测试
```

2. `AI_SENTIMENT`
```sql
SET default_ai_resource = 'resource_name';
SELECT AI_SENTIMENT('Apache Doris is a great DBMS.');
```

Подробные сведения о функциях и их использовании см. в документации каждой конкретной функции.
