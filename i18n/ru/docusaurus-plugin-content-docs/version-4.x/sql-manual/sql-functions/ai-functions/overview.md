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

AI Function — встроенная функция, предоставляемая Doris на основе возможностей искусственного интеллекта (AI). Пользователи могут напрямую вызывать AI в SQL-запросах для выполнения различных интеллектуальных задач с текстом. AI Function подключается к нескольким ведущим поставщикам AI (например, OpenAI, Anthropic, DeepSeek, Gemini, Ollama, MoonShot и т. д.) через механизм ресурсов Doris.

Используемый AI должен предоставляться Doris извне и поддерживать анализ текста.

---

## Настройка AI Resource {#configure-ai-resource}

Перед использованием AI Function необходимо создать Resource типа AI для централизованного управления данными доступа к API AI.

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

**Начиная с 4.1.5**, ресурс AI должен содержать как минимум одну полную группу подключения: общую `ai.*`, группу text embedding `ai.embed.*` или группу multimodal embedding `ai.embed.mm.*`. Для каждой настроенной группы требуются `endpoint`, `provider_type`, `model_name` и `api_key`, если ее provider не `LOCAL`. Обязательные поля подключения ниже описывают общую группу, которую используют скалярные AI-функции и `AI_AGG`. Текстовый `EMBED` сначала выбирает `ai.embed.*`, затем общую группу; JSON-мультимодальный `EMBED` выбирает `ai.embed.mm.*`, затем `ai.embed.*`, затем общую группу. В более ранних версиях требуется общая группа. Все восемь полей и пример см. в [специальных свойствах embedding](../../../ai/ai-function-overview.md#dedicated-embedding-properties).

`type`: обязателен, должен быть равен `ai` и используется как идентификатор типа AI.

`ai.provider_type`: обязателен для общей группы моделей. Определяет внешнего поставщика AI. Поддерживаются OpenAI, Anthropic, Gemini, DeepSeek, Local, MoonShot, MiniMax, Zhipu, QWen, Baichuan, VoyageAI и Jina. Если API другого поставщика совместим с [OpenAI](https://platform.openai.com/docs/overview), [Anthropic](https://docs.anthropic.com/en/api/messages-examples) или [Gemini](https://ai.google.dev/gemini-api/docs/quickstart#rest_1), укажите соответствующий тип совместимого поставщика.

Прохождение проверки типа поставщика не означает поддержку всех AI-функций. Например, VoyageAI и Jina поддерживают embedding и не могут использоваться как модели генерации текста.

`ai.endpoint`: обязателен для общей группы моделей. Задает конечную точку API AI.

`ai.model_name`: обязателен для общей группы моделей. Задает имя модели.

`ai.api_key`: ключ API для общей группы моделей. При `ai.provider_type = local` он не требуется; в остальных случаях обязателен.

`ai.temperature`: необязательный параметр, управляющий случайностью генерируемого содержимого. Принимает значение с плавающей точкой от 0 до 1.
Значение по умолчанию — -1, то есть параметр не задан.

`ai.max_token`: необязательный параметр, ограничивающий максимальное число токенов в сгенерированном содержимом.
Значение по умолчанию — -1, то есть параметр не задан. Для Anthropic значение по умолчанию равно 2048.

`ai.max_retries`: необязательный параметр, задающий максимальное число повторных попыток для одного запроса. Значение по умолчанию — 3.

`ai.retry_delay_second`: необязательный параметр, задающий задержку (в секундах) перед повторной попыткой. Значение по умолчанию — 0.

`ai.enable_structured_output` (**Начиная с 4.2**): необязательное логическое значение, по умолчанию `true`. Doris объединяет входные строки скалярных AI-функций в пакеты. Включение этого параметра добавляет поля формата, специфичные для поставщика, чтобы повысить надежность формата ответа. Doris не проверяет, поддерживает ли настроенная модель эти поля; для LOCAL и MiniMax они не передаются. Установите `false`, если модель или endpoint отклоняет эти поля. Пакетная обработка, инструкции по формату в системном prompt и проверка ответа остаются включенными. Этот параметр не применяется к `AI_AGG` или `EMBED`.

`ai.dimensions`: необязательный параметр, управляющий размерностью вектора вывода [EMBED](./distance-functions/embed.md).
**Перед настройкой обязательно убедитесь, что модель, указанная в `ai.model_name`, поддерживает пользовательскую размерность вектора;**
иначе вызов модели может завершиться ошибкой.

### Настройка выделенных моделей embedding (начиная с 4.1.5) {#dedicated-embedding-model-configuration-since-415}

Начиная с версии 4.1.5, в AI Resource можно отдельно настроить общую модель, модель text embedding и модель multimodal embedding. Требуется как минимум одна полная группа. Если для группы задано любое свойство подключения или ключ API, эта группа должна включать `endpoint`, `provider_type` и `model_name`, а для провайдеров, отличных от `LOCAL`, также `api_key`. Отсутствующие поля не наследуются из других групп.

| Группа модели | Параметры подключения | Ключ API | Использование |
| --- | --- | --- | --- |
| Общая | `ai.endpoint`, `ai.provider_type`, `ai.model_name` | `ai.api_key` | Генерация текста и другие AI-функции; резервный вариант, если выделенная группа embedding не настроена |
| Text embedding | `ai.embed.endpoint`, `ai.embed.provider_type`, `ai.embed.model_name` | `ai.embed.api_key` | Текстовый ввод в `EMBED()`; резервный вариант для мультимодального ввода |
| Multimodal embedding | `ai.embed.mm.endpoint`, `ai.embed.mm.provider_type`, `ai.embed.mm.model_name` | `ai.embed.mm.api_key` | JSON-мультимодальный ввод в `EMBED()` |

Для текстового `EMBED()` сначала выбирается группа text embedding, затем общая группа. Мультимодальный `EMBED()` выбирает группу multimodal embedding, затем группу text embedding, затем общую группу. Выбранные provider и модель должны поддерживать фактический тип мультимедиа. Resource, содержащий только embedding-группы, может обслуживать соответствующие вызовы `EMBED()`, но не может обслуживать функции генерации текста, которым требуется общая модель.

Например, Resource, используемый только для text embedding, не требует общей модели генерации:

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

Замените значения подключения конфигурацией своей службы. При успешном создании возвращается `Query OK`. Общие настройки, такие как `ai.dimensions` и параметры повторных попыток, по-прежнему берутся из конфигурации Resource.

### Интенсивность рассуждений: `ai.effort` (начиная с 4.1.5) {#reasoning-effort-aieffort-since-415}

Начиная с версии 4.1.5 необязательное строковое свойство `ai.effort` задает интенсивность рассуждений. По умолчанию оно не задано и не отправляется поставщику. Используйте значения в нижнем регистре с учетом проверки поставщика:

| Поставщик | Допустимые значения |
| --- | --- |
| `ANTHROPIC` | `low`, `medium`, `high`, `xhigh`, `max` |
| `GEMINI` | `minimal`, `low`, `medium`, `high` |
| Проверка свойства для других поставщиков | `none`, `minimal`, `low`, `medium`, `high`, `xhigh`, `max` |

Прохождение проверки свойства не означает, что каждая модель поддерживает этот уровень интенсивности. Выберите значение, поддерживаемое вашей службой и моделью. `ai.effort` не заменяет `ai.max_token`.

Пустая строка в `ALTER RESOURCE` удаляет настройку `ai.effort`.

### Разрешения на создание, изменение и удаление (начиная с 4.1.5) {#create-alter-and-drop-permissions-since-415}

Для создания AI Resource требуются глобальные привилегии `ADMIN`. Начиная с версии 4.1.5 конфигурация FE [`ai_resource_allowed_user`](../../../admin-manual/config/fe-config.md#ai_resource_allowed_user) может дополнительно ограничить личность создателя. Значение по умолчанию `*` не добавляет ограничений по личности.

AI Resource, созданный `root` начиная с версии 4.1.5, может изменять или удалять только `root`; другим учетным записям будет отказано, даже если у них есть привилегии `ADMIN`. Ресурсы, существовавшие до обновления и не имеющие этой отметки, не помечаются задним числом. Для остальных ресурсов сохраняются прежние проверки привилегий.

---

## Выбор ресурса и переменные Session {#resource-selection-and-session-variables}

При вызове функций, связанных с AI, ресурс можно указать одним из двух способов:

- Явно указать ресурс: передать имя ресурса непосредственно при вызове функции.
- Неявно указать ресурс: заранее задать переменную Session, и функция автоматически использует соответствующий ресурс.

Формат переменной Session:
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

В настоящее время в Doris поддерживаются следующие AI Functions:

- `AI_CLASSIFY`: классификация информации

- `AI_EXTRACT`: извлечение информации

- `AI_FILTER`: фильтрация информации

- `AI_FIXGRAMMAR`: исправление грамматики

- `AI_GENERATE`: генерация текста

- `AI_MASK`: маскирование конфиденциальной информации

- `AI_SENTIMENT`: анализ тональности

- `AI_SIMILARITY`: сравнение семантического сходства текстов

- `AI_SUMMARIZE`: создание краткого содержания текста

- `AI_TRANSLATE`: перевод

- `AI_AGG`: выполнение межстрочного агрегатного анализа нескольких текстов

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
