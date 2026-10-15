---
{
    "title": "ALTER STORAGE POLICY",
    "language": "ja",
    "description": "このステートメントは、既存のデータのホット・コールド階層間移行ポリシーを変更するために使用します。リソースを変更できるのは root または admin ユーザーのみです。"
}
---

## 説明

このステートメントは、既存のデータのホット・コールド階層間移行ポリシーを変更するために使用します。リソースを変更できるのは root または admin ユーザーのみです。

## 構文
```sql
ALTER STORAGE POLICY  '<policy_name>' PROPERTIES ("<key>"="<value>"[, ... ]);
```

## 必須パラメータ


1.`<policy_name>`  
> ストレージポリシーの名前。変更するストレージポリシーを一意に識別するもので、既存のポリシー名を指定する必要があります。 

## オプションパラメータ
`PROPERTIES ("<key>"="<value>"[, ... ])` 

1.`retention_days`  
> データ保持期間。データをストレージに保持する期間を定義します。この期間を超えたデータは自動的に削除されます。 

2.`redundancy_level`
> 冗長性レベル。高可用性と耐障害性を確保するためのデータのレプリカ数を定義します。たとえば、値が 2 の場合、各データブロックには二つのレプリカがあります。 

3.`storage_type`   
> ストレージの種類。SSD、HDD、ハイブリッドストレージなど、使用するストレージ媒体を指定します。性能とコストに影響します。 

4.`cooloff_time`    
> 削除までの待機時間。データが削除対象としてマークされてから実際に削除されるまでの時間です。誤操作によるデータ損失の防止に役立ちます。 

5.`location_policy` 
> 地理的な配置ポリシー。災害復旧のためのリージョン間レプリケーションなど、データの地理的な配置を定義します。 

## 例

1. データのホット・コールド階層間移行に使用する cooldown_datetime を変更する:
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES("cooldown_datetime" = "2023-06-08 00:00:00");
```
2. データのホット・コールド階層間移行のカウントダウンに使用する cooldown_ttl を変更する:

```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "10000");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "1h");
```
```sql
ALTER STORAGE POLICY has_test_policy_to_alter PROPERTIES ("cooldown_ttl" = "3d");
```
