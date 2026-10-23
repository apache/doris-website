---
{
    "title": "CREATE FUNCTION",
    "language": "ru",
    "description": "Этот оператор используется для создания пользовательской функции."
}
---

## Описание {#description}

Этот оператор используется для создания пользовательской функции.

## Синтаксис {#syntax}


```sql
CREATE [ GLOBAL ] 
    [{AGGREGATE | TABLES | ALIAS }] FUNCTION <function_name>
    (<arg_type> [, ...])
    [ RETURNS <ret_type> ]
    [ INTERMEDIATE <inter_type> ]
    [ WITH PARAMETER(<param> [,...]) AS <origin_function> ]
    [ PROPERTIES ("<key>" = "<value>" [, ...]) ]
```

## Обязательные параметры {#required-parameters}

**1. `<function_name>`**

> Если `function_name` содержит имя базы данных, например `db1.my_func`, пользовательская функция будет создана в соответствующей базе данных. В противном случае функция будет создана в базе данных текущего сеанса. Имя и параметры новой функции не должны совпадать с именем и параметрами существующей функции в текущем пространстве имён; иначе создание завершится ошибкой.

**2. `<arg_type>`**

> Типы входных параметров функции. Можно объявить один или несколько фиксированных аргументов. **Начиная с версии 4.1.5, объявление функций с переменным числом аргументов с помощью `...` больше не поддерживается. Для передачи переменного числа значений используйте параметр `ARRAY`.**

**3. `<ret_type>`**

> Тип возвращаемого значения функции. Это обязательный параметр при создании новой функции. При создании псевдонима для существующей функции этот параметр не требуется.

## Необязательные параметры {#optional-parameters}

**1. `GLOBAL`**

> Если указан, создаваемая функция будет доступна глобально.

**2. `AGGREGATE`**

> Если указан, создаваемая функция будет агрегатной.

**3. `TABLES`**

> Если указан, создаваемая функция будет табличной.

**4. `ALIAS`**

> Если указан, создаваемая функция будет функцией-псевдонимом.

> Если ни один из перечисленных выше параметров, задающих тип функции, не выбран, создаваемая функция будет скалярной.

**5. `<inter_type>`**

> Указывает тип данных на промежуточном этапе работы агрегатной функции.

**6. `<param>`**

> Указывает параметры функции-псевдонима; требуется как минимум один параметр.

**7. `<origin_function>`**

> Указывает исходную функцию, которой соответствует функция-псевдоним.

**8. `<properties>`**

> - `file`: Указывает JAR-пакет, содержащий пользовательскую функцию (UDF). В среде с несколькими машинами пакет также можно скачать по HTTP. Этот параметр обязателен.
> - `symbol`: Указывает имя класса, содержащего реализацию UDF. Этот параметр обязателен.
> - `type`: Указывает тип вызова UDF. По умолчанию используется Native. Для Java UDF используйте JAVA_UDF.
> - `always_nullable`: Указывает, может ли результат UDF содержать значения NULL. Это необязательный параметр со значением по умолчанию true.
> - `volatility`: Указывает, насколько стабилен результат функции. Это необязательный параметр. По умолчанию для скалярных UDF используется `volatile`, а для UDAF/UDTF используется `immutable`. Допустимые значения:
>   - `immutable`: Одинаковые входные данные всегда дают одинаковый результат. Большинство детерминированных UDF следует помечать как `immutable`, чтобы оптимизатор мог применять больше оптимизаций плана.
>   - `stable`: Результат стабилен в пределах одного оператора SQL, но может меняться между операторами, как у `now()`. Для функций этого типа отключены кеш SQL и переписывание запросов с использованием материализованных представлений.
>   - `volatile`: Результат может меняться при каждом вызове, как у `random()`. Для функций этого типа отключены кеш SQL, переписывание запросов с использованием материализованных представлений и многие правила переписывания запросов оптимизатором.

## Требования к управлению доступом {#access-control-requirements}

Для выполнения этой команды пользователь должен обладать привилегиями `ADMIN_PRIV`.

## Пример {#example}

1. Создание пользовательской функции UDF. Подробнее см. [JAVA-UDF](../../../query-data/udf/java-user-defined-function).

   

   ```sql
   CREATE FUNCTION java_udf_add_one(int) RETURNS int PROPERTIES (
       "file"="file:///path/to/java-udf-demo-jar-with-dependencies.jar",
       "symbol"="org.apache.doris.udf.AddOne",
       "always_nullable"="true",
       "type"="JAVA_UDF",
       "volatility"="immutable"
   );
   ```

2. Создание пользовательской функции UDAF.

   

   ```sql
   CREATE AGGREGATE FUNCTION simple_sum(INT) RETURNS INT PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.SimpleDemo",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

3. Создание пользовательской функции UDTF.

   

   ```sql
   CREATE TABLES FUNCTION java_udtf(string, string) RETURNS array<string> PROPERTIES (
       "file"="file:///pathTo/java-udaf.jar",
       "symbol"="org.apache.doris.udf.demo.UDTFStringTest",
       "always_nullable"="true",
       "type"="JAVA_UDF"
   );
   ```

4. Создание пользовательской функции-псевдонима. Подробнее см. [Функция-псевдоним](../../../query-data/udf/alias-function).

   

   ```sql
   CREATE ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```

5. Создание глобальной пользовательской функции-псевдонима.

   

   ```sql
   CREATE GLOBAL ALIAS FUNCTION id_masking(INT) WITH PARAMETER(id) AS CONCAT(LEFT(id, 3), '****', RIGHT(id, 4));
   ```

6. Создание Python UDF типа volatile. Для функций, таких как `uuid.uuid4()`, результат которых зависит от случайных значений, следует сохранять значение по умолчанию `volatility = volatile`; их нельзя ошибочно помечать как `immutable`.

   ```sql
   CREATE TABLE cte_uuid_seed (id INT) ENGINE=OLAP DUPLICATE KEY(id)
   DISTRIBUTED BY HASH(id) BUCKETS 1 PROPERTIES ("replication_num" = "1");
   INSERT INTO cte_uuid_seed VALUES (1),(2),(3);

   DROP FUNCTION IF EXISTS py_uuid_token(INT);
   CREATE FUNCTION py_uuid_token(INT)
   RETURNS STRING
   PROPERTIES (
       "type" = "PYTHON_UDF",
       "symbol" = "py_uuid_token_impl",
       "always_nullable" = "false",
       "runtime_version" = "3.12.11",
       "volatility" = "volatile"
   )
   AS $$
   import uuid
   def py_uuid_token_impl(x):
       return f"{x}-{uuid.uuid4()}"
   $$;

   SET enable_cte_materialize = true;
   SET inline_cte_referenced_threshold = 10;

   WITH cte AS (SELECT id, py_uuid_token(id) AS token FROM cte_uuid_seed)
   SELECT id, COUNT(DISTINCT token) AS distinct_tokens
   FROM (SELECT id, token FROM cte UNION ALL SELECT id, token FROM cte) u
   GROUP BY id ORDER BY id;
   ```

   Корректный результат:

   ```text
   +------+-----------------+
   | id   | distinct_tokens |
   +------+-----------------+
   |    1 |               1 |
   |    2 |               1 |
   |    3 |               1 |
   +------+-----------------+
   ```

   Следующее определение этой функции некорректно:

   ```sql
   DROP FUNCTION IF EXISTS py_uuid_token(INT);
   CREATE FUNCTION py_uuid_token(INT)
   RETURNS STRING
   PROPERTIES (
       "type" = "PYTHON_UDF",
       "symbol" = "py_uuid_token_impl",
       "always_nullable" = "false",
       "runtime_version" = "3.12.11",
       "volatility" = "immutable"
   )
   AS $$
   import uuid
   def py_uuid_token_impl(x):
       return f"{x}-{uuid.uuid4()}"
   $$;
   ```

   Выполните тот же запрос ещё раз:

   ```sql
   WITH cte AS (SELECT id, py_uuid_token(id) AS token FROM cte_uuid_seed)
   SELECT id, COUNT(DISTINCT token) AS distinct_tokens
   FROM (SELECT id, token FROM cte UNION ALL SELECT id, token FROM cte) u
   GROUP BY id ORDER BY id;
   ```

   Некорректный результат:

   ```text
   +------+-----------------+
   | id   | distinct_tokens |
   +------+-----------------+
   |    1 |               2 |
   |    2 |               2 |
   |    3 |               2 |
   +------+-----------------+
   ```

   Почему это неверно:
   Поскольку `py_uuid_token` является функцией типа volatile, каждый вызов `uuid.uuid4()` генерирует новое значение. Если функция ошибочно помечена как `volatility = immutable`, оптимизатор может счесть преобразование повторных ссылок безопасным и выбрать план, в котором UDF вычисляется отдельно по обе стороны `UNION ALL`. В результате для одного и того же `id` могут быть получены два разных значения `token`, а `COUNT(DISTINCT token)` изменится с `1` на `2`.
