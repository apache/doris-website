---
{
    "title": "Развёртывание с помощью Docker Compose",
    "sidebar_label": "Развёртывание с помощью Docker Compose",
    "language": "ru",
    "description": "Как развернуть DOG Stack на одном хосте с помощью Docker Compose? В этой статье описано, как запустить OpenTelemetry Collector, Apache Doris и Grafana с плагином Doris App, используя встроенный Doris или существующий кластер Doris, а также как проверить развёртывание, получить доступ к сервисам, остановить их и удалить данные.",
    "keywords": [
        "Развёртывание DOG Stack",
        "Docker Compose",
        "OpenTelemetry Collector",
        "Apache Doris",
        "Grafana",
        "Плагин Doris App",
        "наблюдаемость"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability platform / DOG Stack single-host deployment -->

В этой статье описано, как развернуть DOG Stack на одном хосте с помощью Docker Compose. При развёртывании запускаются OpenTelemetry Collector, Grafana с плагином Doris App и, при необходимости, Doris в конфигурации all-in-one. Этот вариант подходит для локального тестирования, разработки и PoC. Для производственных сред и сред Kubernetes см. [Развёртывание в Kubernetes](./kubernetes.md).

:::tip
Чтобы развернуть компоненты без Docker, следуйте [документации по развёртыванию Doris](https://doris.apache.org/docs/4.x/install/preparation/env-checking), [документации по установке OpenTelemetry Collector](https://opentelemetry.io/docs/collector/install/) и [документации по установке Grafana](https://grafana.com/docs/grafana/latest/setup-grafana/installation/).
:::

Это руководство проверено на коммите AI Observe Stack [`2c1fbee83170`](https://github.com/ai-observe/ai-observe-stack/tree/2c1fbee831701178c7dddba857e88130ef292949). Приведённая ниже команда checkout фиксирует эту ревизию, чтобы последующие изменения в ветке main не влияли на параметры. Встроенный образ Doris `4.0.3-all-slim` предназначен для проверки взаимодействия компонентов стека.

## Предварительные требования {#prerequisites}

- Docker Engine 20.10 или новее
- Docker Compose 2.0 или новее

## Развёртывание {#deployment}

1. Клонируйте репозиторий:

   ```Bash
   git clone https://github.com/ai-observe/ai-observe-stack.git
   cd ai-observe-stack
   git checkout 2c1fbee831701178c7dddba857e88130ef292949
   cd docker
   ```

2. Запустите сервисы. Выберите один из следующих режимов.

   - **Встроенный Doris**: запускает Doris в конфигурации all-in-one вместе с OpenTelemetry Collector и Grafana.

     ```Bash
     docker compose up -d
     ```

   - **Существующий Doris**: запускает только OpenTelemetry Collector и Grafana и записывает данные в ваш кластер Doris. Сначала создайте файл конфигурации:

     ```Bash
     cp .env.example .env
     ```

     Измените параметры подключения к Doris в `.env`:

     ```Bash
     DORIS_FE_HTTP_ENDPOINT=http://<DORIS_FE_HOST>:8030
     DORIS_FE_MYSQL_ENDPOINT=<DORIS_FE_HOST>:9030
     DORIS_USERNAME=root
     DORIS_PASSWORD=
     ```

     Затем запустите сервисы:

     ```Bash
     docker compose -f docker-compose-without-doris.yaml up -d
     ```

     Учётная запись должна иметь права на создание целевой базы данных и таблиц, загрузку данных и выполнение запросов к таблицам, используемым Grafana. OpenTelemetry Collector автоматически создаёт базу данных `otel` и её таблицы.

     OpenTelemetry Collector записывает данные через Stream Load: FE перенаправляет каждый запрос на BE по адресу, под которым этот BE зарегистрирован в Doris (отображается командой `SHOW BACKENDS`). Поэтому из контейнера OpenTelemetry Collector должны быть доступны не только FE, но и адреса BE и HTTP-порт BE (по умолчанию 8040).

3. Убедитесь, что сервисы запущены:

   ```Bash
   docker compose ps
   ```

   В режиме с существующим Doris добавьте `-f docker-compose-without-doris.yaml`. В столбце `STATUS` каждого сервиса должно отображаться `Up`. При использовании встроенного Doris OpenTelemetry Collector запускается только после того, как Doris успешно пройдёт проверку работоспособности.

4. Откройте http://localhost:3000 и войдите в Grafana с учётными данными `admin` / `admin`.

## Адреса сервисов {#service-endpoints}

| Сервис | Адрес | Учётные данные |
| --- | --- | --- |
| Grafana | http://localhost:3000 | admin / admin |
| OTLP gRPC | localhost:4317 | - |
| OTLP HTTP | localhost:4318 | - |
| Проверка работоспособности OpenTelemetry Collector | http://localhost:13133 | - |
| Веб-интерфейс Doris FE (только для встроенного Doris) | http://localhost:8030 | root / пустой пароль |
| Протокол MySQL в Doris (только для встроенного Doris) | localhost:9030 | root / пустой пароль |

Приложения, инструментированные с помощью OpenTelemetry SDK, отправляют данные на `localhost:4317` (gRPC) или `localhost:4318` (HTTP).

## Остановка и удаление данных {#stop-and-clean-up}

Остановите сервисы, сохранив данные:

```Bash
docker compose down
```

Остановите сервисы и удалите все данные:

```Bash
docker compose down -v
```

В режиме с существующим Doris добавьте `-f docker-compose-without-doris.yaml` к обеим командам. Данные в вашем кластере Doris не удаляются.
