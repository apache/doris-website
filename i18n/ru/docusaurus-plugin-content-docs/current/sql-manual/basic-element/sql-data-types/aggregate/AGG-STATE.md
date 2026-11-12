---
{
    "title": "AGG_STATE",
    "language": "ru",
    "description": "AGGSTATE нельзя использовать в качестве ключевого столбца; при создании таблицы необходимо также указать сигнатуру агрегатной функции."
}
---

## AGG_STATE {#agg_state}
### Описание {#description}
      AGG_STATE cannot be used as a key column, and the signature of the aggregation function must be declared at the same time when creating the table.
      User does not need to specify length and default value. The actual stored data size is related to the function implementation.
    
  AGG_STATE можно использовать только с комбинаторами функций [state](../../../sql-functions/combinators/state)
     /[merge](../../../sql-functions/combinators/merge)/[union](../../../sql-functions/combinators/union).

  Сигнатура агрегатной функции также является частью типа, поэтому agg_state с разными сигнатурами нельзя смешивать. Например, если в операторе создания таблицы указана сигнатура `max_by(int,int)`, вставить `max_by(bigint,int)` или `group_concat(varchar)` нельзя.
   Атрибут nullable также является частью сигнатуры. Если вы уверены, что не будете передавать значение NULL, можно объявить параметр как not null. Это позволит уменьшить объём хранимых данных и накладные расходы на сериализацию и десериализацию.

**Примечание: поскольку agg_state хранит промежуточный результат агрегатной функции, процессы чтения и записи сильно зависят от конкретной реализации этой функции. Если при обновлении версии Doris реализация агрегатной функции изменится, может возникнуть несовместимость. В таком случае материализованное представление, использующее соответствующий agg_state, необходимо удалить и создать заново, а связанная с ним базовая агрегатная таблица станет недоступной. Поэтому используйте agg_state с осторожностью.**

### Пример {#example}

Пример создания таблицы:
```sql
  -- after doris-2.1.1
  create table a_table(
      k1 int null,
      k2 agg_state<max_by(int not null,int)> generic,
      k3 agg_state<group_concat(string)> generic
  )
  aggregate key (k1)
  distributed BY hash(k1) buckets 3
  properties("replication_num" = "1");  

  -- until doris-2.1.0
  create table a_table(
      k1 int null,
      k2 agg_state max_by(int not null,int),
      k3 agg_state group_concat(string)
  )
  aggregate key (k1)
  distributed BY hash(k1) buckets 3
  properties("replication_num" = "1");
```
Здесь для k2 и k3 в качестве типов агрегации используются max_by и group_concat соответственно.

Пример вставки данных:
```sql
    insert into a_table values(1,max_by_state(3,1),group_concat_state('a'));
    insert into a_table values(1,max_by_state(2,2),group_concat_state('bb'));
    insert into a_table values(2,max_by_state(1,3),group_concat_state('ccc'));
```
Для столбца agg_state оператор insert должен использовать функцию [state](../../../sql-functions/combinators/state), чтобы сформировать соответствующие данные agg_state. При этом функции и типы входных параметров должны полностью соответствовать объявлению agg_state.

Пример выборки данных:
```sql
    mysql [test]>select k1,max_by_merge(k2),group_concat_merge(k3) from a_table group by k1 order by k1;
    +------+--------------------+--------------------------+
    | k1   | max_by_merge(`k2`) | group_concat_merge(`k3`) |
    +------+--------------------+--------------------------+
    |    1 |                  2 | bb,a                     |
    |    2 |                  1 | ccc                      |
    +------+--------------------+--------------------------+
```
Для получения итогового результата необходимо использовать соответствующую функцию [merge](../../../sql-functions/combinators/merge).

```sql
    mysql [test]>select max_by_merge(u2),group_concat_merge(u3) from (
    select k1,max_by_union(k2) as u2,group_concat_union(k3) u3 from a_table group by k1 order by k1
    ) t;
    +--------------------+--------------------------+
    | max_by_merge(`u2`) | group_concat_merge(`u3`) |
    +--------------------+--------------------------+
    |                  1 | ccc,bb,a                 |
    +--------------------+--------------------------+
```
Если требуется агрегировать только agg_state, не получая итоговый результат в процессе, можно использовать функцию [union](../../../sql-functions/combinators/union).

Дополнительные примеры см. в [datatype_p0/agg_state](https://github.com/apache/doris/tree/master/regression-test/suites/datatype_p0/agg_state)
### Ключевые слова {#keywords}

    AGG_STATE
