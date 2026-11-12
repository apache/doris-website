---
{
    "title": "QUANTILE_STATE",
    "language": "ru",
    "description": "QUANTILESTATE"
}
---

## QUANTILE_STATE {#quantile_state}
### Описание {#description}

QUANTILE_STATE

**В версии 2.0 поддерживается функция [agg_state](AGG-STATE.md), и вместо этого типа рекомендуется использовать agg_state quantile_union(quantile_state not null).**

QUANTILE_STATE нельзя использовать в качестве ключевого столбца. Столбцы типа QUANTILE_STATE можно использовать в таблицах Aggregate, Duplicate и Unique. При использовании в таблице Aggregate во время создания таблицы необходимо указать тип агрегации QUANTILE_UNION.

Пользователю не требуется указывать длину и значение по умолчанию. Длина определяется системой в зависимости от степени агрегации данных.
Выполнять запросы к столбцу QUANTILE_STATE или использовать его можно только с помощью вспомогательных функций QUANTILE_PERCENT, QUANTILE_UNION и TO_QUANTILE_STATE.
Тип QUANTILE_STATE предназначен для вычисления приближённых значений квантилей. Разные значения с одинаковым ключом предварительно агрегируются в процессе загрузки. Когда число агрегированных значений не превышает 2048, все данные сохраняются в исходном виде. Когда число агрегированных значений превышает 2048, для агрегации (кластеризации) данных используется алгоритм [TDigest] (https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf), после чего сохраняются центроиды кластеров.

Связанные функции:

    QUANTILE_UNION(QUANTILE_STATE):
      
      This function is an aggregation function, which is used to aggregate the intermediate results of different quantile calculations. The result returned by this function is still QUANTILE_STATE

    
    TO_QUANTILE_STATE(DOUBLE raw_data [,FLOAT compression]):
       
       This function converts a numeric type to a QUANTILE_STATE type
       The compression parameter is optional and can be set in the range [2048, 10000]. 
       The larger the value, the higher the precision of quantile approximation calculations, the greater the memory consumption, and the longer the calculation time.
       An unspecified or set value for the compression parameter is outside the range [2048, 10000], run with the default value of 2048

    QUANTILE_PERCENT(QUANTILE_STATE, percent):
       This function converts the intermediate result variable (QUANTILE_STATE) of the quantile calculation into a specific quantile value

    
### Примечание {#notice}

В настоящее время QUANTILE_STATE можно использовать только в таблицах модели Aggregate. Перед использованием необходимо включить поддержку типа QUANTILE_STATE следующей командой:

```
$ mysql-client > admin set frontend config("enable_quantile_state_type"="true");
```

При таком способе настройки параметр будет сброшен после перезапуска процесса FE. Для постоянной настройки можно добавить параметр `enable_quantile_state_type=true` в fe.conf.


### Пример {#example}
    select QUANTILE_PERCENT(QUANTILE_UNION(v1), 0.5) from test_table group by k1, k2, k3;
    

### Ключевые слова {#keywords}

    QUANTILE_STATE, QUANTILE_UNION, TO_QUANTILE_STATE, QUANTILE_PERCENT
