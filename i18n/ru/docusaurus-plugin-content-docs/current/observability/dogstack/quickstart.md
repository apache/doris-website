---
{
    "title": "Быстрый старт",
    "sidebar_label": "Быстрый старт",
    "language": "ru",
    "description": "Как быстро опробовать решение DOG Stack для наблюдаемости? В этой статье описано развёртывание одним нажатием с помощью Docker Compose и подробно рассмотрены плагин Doris App, поиск по журналам, анализ трассировок, панели мониторинга и оповещения.",
    "keywords": [
        "быстрый старт с DOG Stack",
        "Docker Compose",
        "плагин Doris App",
        "Grafana",
        "OpenTelemetry",
        "поиск по журналам",
        "анализ трассировок",
        "панель мониторинга",
        "оповещения"
    ]
}
---

<!-- Knowledge type: operational steps -->
<!-- Applicable scenario: observability quick validation / DOG Stack onboarding -->

Проще всего познакомиться с DOG Stack через [онлайн-демонстрацию](https://observability-demo.velodb.io/): развёртывание не требуется. Если вы хотите запустить собственный экземпляр, это так же просто сделать с помощью Docker Compose.



## Развёртывание {#deployment}

```Bash
git clone https://github.com/ai-observe/ai-observe-stack.git
cd ai-observe/demo
docker compose up -d
```

Эти команды запускают полноценный DOG Stack вместе с демонстрационным приложением для электронной коммерции, состоящим из 10+ микросервисов.

Откройте браузер, перейдите по адресу http://localhost:33000/grafana/plugins, найдите `doris` и нажмите на пункт **Doris App**.

![Плагин Doris App](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_plugin.png)

Затем нажмите кнопку **Включить**, чтобы включить Doris App.

![Включение Doris App](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_enable.png)

После включения Doris App появится в разделе «Другие приложения» в меню слева. Нажмите «Doris App», чтобы начать знакомство с приложением.

![Пункт Doris App](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_apps.png)



## Поиск {#search}

В Doris App выберите `Doris` в качестве источника данных, `otel` в качестве базы данных и `otel_logs` в качестве таблицы. На экране появятся данные. Пользователям Kibana интерфейс покажется знакомым и простым в использовании.

![Источник данных журналов](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_logs.png)

Попробуйте ввести `body:error` в поле поиска, чтобы найти записи журнала, в поле body которых содержится слово `error`.

![Поиск body:error](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_search.png)



## Трассировки {#traces}

Нажмите **Трассировки** в меню **Doris App**, чтобы просматривать и анализировать трассировки.

Выберите `Doris` в качестве источника данных, `otel` в качестве базы данных и `otel_traces` в качестве таблицы. Нажмите кнопку **Найти трассировки**, чтобы получить 50 последних записей трассировок. Они отобразятся на диаграмме вверху и в списке под ней. Поэкспериментируйте с фильтрами «Сервис», «Операция», «Теги» и «Длительность» слева и попробуйте разные варианты сортировки под диаграммой трассировок.

![Список трассировок](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_traces.png)

Нажмите на нужную трассировку, чтобы открыть её каскадную диаграмму. В этом представлении используйте **Фильтр спанов**, чтобы дополнительно отфильтровать спаны внутри трассировки.

![Каскадная диаграмма трассировки](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_waterfall.png)

## Панели мониторинга {#dashboards}

В меню слева нажмите **Панели мониторинга**, затем **Демо Doris**, а после этого **Самомониторинг коллектора**. Откроется показанная ниже демонстрационная панель мониторинга, которая отображает метрики хоста самого OpenTelemetry Collector.

![Демонстрационная панель мониторинга](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_dashboard.png)



## Оповещения {#alerting}

Вы можете создавать правила оповещения на основе SQL-запросов к Doris. Задайте параметры условия срабатывания оповещения, такие как функция **Свёртка** и **Порог**.

![Правило оповещения](https://cdnd.selectdb.com/images/upload/dogstack/quickstart_alert.png)
