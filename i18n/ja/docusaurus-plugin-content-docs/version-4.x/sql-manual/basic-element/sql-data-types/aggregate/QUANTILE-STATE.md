---
{
    "title": "QUANTILE_STATE",
    "language": "ja",
    "description": "分位数の近似値を計算するための QUANTILE_STATE 型"
}
---

## QUANTILE_STATE
### 説明

QUANTILE_STATE

**2.0 では [agg_state](AGG-STATE.md) 関数がサポートされています。この型の代わりに agg_state quantile_union(quantile_state not null) を使用することを推奨します。**

QUANTILE_STATE はキー列として使用できません。QUANTILE_STATE 型の列は Aggregate テーブル、Duplicate テーブル、Unique テーブルで使用できます。Aggregate テーブルで使用する場合は、テーブル作成時に集約型として QUANTILE_UNION を指定します。

長さとデフォルト値を指定する必要はありません。長さはデータの集約度に応じてシステム内部で制御されます。
また、QUANTILE_STATE 列のクエリや使用は、対応する QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE 関数を通じてのみ行えます。
QUANTILE_STATE は分位数の近似値を計算するための型です。ロード時には、同じキーを持つ異なる値が事前集約されます。集約する値の数が 2048 以下の場合は、すべてのデータが詳細に記録されます。2048 を超える場合は、[TDigest] アルゴリズム (https://github.com/tdunning/t-digest/blob/main/docs/t-digest-paper/histo.pdf) を使用してデータを集約（クラスタリング）し、クラスタリング後の重心点を保存します。

関連する関数：
    
    QUANTILE_UNION(QUANTILE_STATE):
      
      This function is an aggregation function, which is used to aggregate the intermediate results of different quantile calculations. The result returned by this function is still QUANTILE_STATE

    
    TO_QUANTILE_STATE(DOUBLE raw_data [,FLOAT compression]):
       
       This function converts a numeric type to a QUANTILE_STATE type
       The compression parameter is optional and can be set in the range [2048, 10000]. 
       The larger the value, the higher the precision of quantile approximation calculations, the greater the memory consumption, and the longer the calculation time.
       An unspecified or set value for the compression parameter is outside the range [2048, 10000], run with the default value of 2048

    QUANTILE_PERCENT(QUANTILE_STATE, percent):
       This function converts the intermediate result variable (QUANTILE_STATE) of the quantile calculation into a specific quantile value

    
### 注意事項

現在、QUANTILE_STATE は Aggregate モデルのテーブルでのみ使用できます。使用前に、次のコマンドで QUANTILE_STATE 型の機能を有効にしてください。

```
$ mysql-client > admin set frontend config("enable_quantile_state_type"="true");
```

この方法で設定した場合、FE プロセスの再起動後に設定はリセットされます。永続的に有効にするには、fe.conf に `enable_quantile_state_type=true` を追加します。
    

### 例
    select QUANTILE_PERCENT(QUANTILE_UNION(v1), 0.5) from test_table group by k1, k2, k3;
    

### キーワード

    QUANTILE_STATE, QUANTILE_UNION, TO_QUANTILE_STATE, QUANTILE_PERCENT
