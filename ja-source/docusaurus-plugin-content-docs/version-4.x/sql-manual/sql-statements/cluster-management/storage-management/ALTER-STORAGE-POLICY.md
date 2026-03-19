---
{
  "title": "ALTER STORAGE POLICY",
  "description": "この文は既存のhot-coldティア化マイグレーションポリシーを変更するために使用されます。rootまたはadminユーザーのみがリソースを変更できます。",
  "language": "ja"
}
---
## 説明

このステートメントは、既存のhot-coldティアード移行ポリシーを変更するために使用されます。rootまたはadminユーザーのみがリソースを変更できます。

## 構文

```sql
ALTER STORAGE POLICY  '<policy_name>' PROPERTIE ("<key>"="<value>"[, ... ]);
```
## 必須パラメータ


1.`<policy_name>`  
> ストレージポリシーの名前。これは変更したいストレージポリシーの一意識別子であり、既存のポリシー名を指定する必要があります。

## オプションパラメータ
`PROPERTIE ("<key>"="<value>"[, ... ])` 

1.`retention_days`  
> データ保持期間。データをストレージに保持する期間を定義します。この期間を超えたデータは自動的に削除されます。

2.`redundancy_level`
> 冗長レベル。高可用性と耐障害性を確保するためのデータレプリカ数を定義します。例えば、値が2の場合、各データブロックは2つのレプリカを持ちます。

3.`storage_type`   
> ストレージタイプ。SSD、HDD、またはハイブリッドストレージなど、使用するストレージメディアを指定します。これはパフォーマンスとコストに影響します。

4.`cooloff_time`    
> クールオフ時間。データが削除対象としてマークされてから実際に削除されるまでの時間間隔。これにより、誤操作によるデータ損失を防ぐことができます。

5.`location_policy` 
> 地理的位置ポリシー。災害復旧のためのクロスリージョンレプリケーションなど、データの地理的配置を定義します。

## 例

1. ホット・コールド階層データ移行のcooldown_datetimeを変更する：

```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
```
2. ホット・コールド階層データ移行カウントダウンのcooldown_ttlを変更する：

```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "10000");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "1h");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "3d");
```
