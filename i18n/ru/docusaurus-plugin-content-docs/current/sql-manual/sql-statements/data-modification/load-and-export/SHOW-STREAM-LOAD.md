---
{
    "title": "SHOW STREAM LOAD",
    "language": "ru",
    "description": "Эта инструкция используется для отображения сведений о выполнении указанной задачи Stream Load"
}
---

## Описание {#description}

Эта инструкция используется для отображения сведений о выполнении указанной задачи Stream Load

Синтаксис:

```sql
SHOW STREAM LOAD
[FROM db_name]
[
  WHERE
  [LABEL [ = "your_label" | LIKE "label_matcher"]]
  [STATUS = ["SUCCESS"|"FAIL"]]
]
[ORDER BY...]
[LIMIT limit][OFFSET offset];
```

Пояснения:

1. По умолчанию BE не сохраняет записи о задачах Stream Load. Чтобы просматривать эти записи, необходимо включить их сохранение на BE с помощью параметра конфигурации: `enable_stream_load_record=true`. Подробнее см. в разделе [Параметры конфигурации BE](../../../../admin-manual/config/be-config)
2. Если db_name не указан, используется текущая база данных по умолчанию
3. Если используется LABEL LIKE, выбираются задачи Stream Load, метки которых содержат label_matcher
4. Если используется LABEL =, выбираются задачи с точным совпадением указанной метки
5. Если указан STATUS, задачи STREAM LOAD выбираются по соответствующему статусу
6. С помощью ORDER BY можно сортировать результаты по любой комбинации столбцов
7. Если указан LIMIT, отображается limit подходящих записей. В противном случае отображаются все записи
8. Если указан OFFSET, результаты запроса отображаются начиная со смещения offset. По умолчанию смещение равно 0.

## Пример {#example}

1. Отобразить все задачи Stream Load для базы данных по умолчанию

   ```sql
     SHOW STREAM LOAD;
   ```

2. Отобразить задачи Stream Load для указанной базы данных, метки которых содержат строку "2014_01_02", и вывести 10 самых старых задач

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE LABEL LIKE "2014_01_02" LIMIT 10;
   ```

3. Отобразить задачу Stream Load для указанной базы данных с меткой "load_example_db_20140102"

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE LABEL = "load_example_db_20140102";
   ```

4. Отобразить задачи Stream Load для указанной базы данных со статусом "success" и отсортировать их по StartTime в порядке убывания

   ```sql
   SHOW STREAM LOAD FROM example_db WHERE STATUS = "success" ORDER BY StartTime DESC;
   ```

5. Отобразить задачи загрузки для указанной базы данных, отсортировать их по StartTime в порядке убывания и вывести 10 результатов запроса начиная со смещения 5

   ```sql
   SHOW STREAM LOAD FROM example_db ORDER BY StartTime DESC limit 5,10;
   SHOW STREAM LOAD FROM example_db ORDER BY StartTime DESC limit 10 offset 5;
   ```

## Ключевые слова {#keywords}

SHOW, STREAM, LOAD
