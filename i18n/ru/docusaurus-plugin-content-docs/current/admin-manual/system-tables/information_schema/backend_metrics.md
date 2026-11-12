---
{
    "title": "backend_metrics",
    "language": "ru"
}
---

## Обзор {#overview}

Используется для просмотра метрик узлов Backend

## База данных {#database}


`information_schema`


## Информация о таблице {#table-information}

| Имя столбца       | Тип          | Описание                                                     |
| ----------------- | ------------ | ------------------------------------------------------------ |
| BE_ID             | varchar(256) | Идентификатор экземпляра Backend                              |
| BE_IP             | varchar(256) | IP-адрес экземпляра Backend                                   |
| METRIC_NAME       | varchar(256) | Название метрики                                             |
| METRIC_TYPE       | varchar(256) | Тип метрики                                                  |
| METRIC_VALUE      | varchar(256) | Значение метрики                                             |
| TAG               | varchar(256) | Тег метрики                                                  |
