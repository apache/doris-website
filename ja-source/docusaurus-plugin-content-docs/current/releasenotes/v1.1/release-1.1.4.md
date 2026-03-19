---
{
  "title": "リリース 1.1.4",
  "language": "ja",
  "description": "このリリースでは、DorisチームはV1.1.3以降約60の問題やパフォーマンス改善を修正しました。このリリースは1のbugfixリリースです。"
}
---
このリリースでは、Doris Teamは1.1.3以降、約60の問題またはパフォーマンス改善を修正しました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーはこのリリースにアップグレードすることを推奨します。


# Features

- Huawei CloudのOBS brokerロードをサポート。[#13523](https://github.com/apache/doris/pull/13523)

- SparkLoadでparquetおよびorcファイルをサポート。[#13438](https://github.com/apache/doris/pull/13438)

# Improvements

- 高負荷時のクエリパフォーマンスに影響するため、metric hookでmutexを取得しないように変更。[#10941](https://github.com/apache/doris/pull/10941)


# BugFix

- spark loadでファイルを読み込む際にwhere条件が効かない問題。[#13804](https://github.com/apache/doris/pull/13804)

- ベクトル化モードでnullableカラムがある場合にif関数が誤った結果を返す問題。[#13779](https://github.com/apache/doris/pull/13779)

- 他のjoin述語と組み合わせてanti joinを使用する際の不正な結果を修正。[#13743](https://github.com/apache/doris/pull/13743)

- concat(ifnull)関数呼び出し時のBEクラッシュ。[#13693](https://github.com/apache/doris/pull/13693)

- group by句に関数がある場合のプランナーのバグを修正。[#13613](https://github.com/apache/doris/pull/13613)

- lateral view句でテーブル名とカラム名が正しく認識されない問題。[#13600](https://github.com/apache/doris/pull/13600)

- MVとテーブルエイリアスを使用した際の不明なカラムエラー。[#13605](https://github.com/apache/doris/pull/13605)

- JSONReaderでvalueとparse allocatorの両方のメモリを解放するよう修正。[#13513](https://github.com/apache/doris/pull/13513)

- enable_vectorized_alter_tableがtrueの場合に負の値カラムでto_bitmap()を使用したMV作成を許可する問題を修正。[#13448](https://github.com/apache/doris/pull/13448)

- from_date_format_str関数でマイクロ秒が失われる問題。[#13446](https://github.com/apache/doris/pull/13446)

- 子のsmapインフォを使用してsubstituteした後、sort exprsのnullabilityプロパティが正しくない可能性がある問題。[#13328](https://github.com/apache/doris/pull/13328)

- case when文に1000個の条件がある際のcore dumpを修正。[#13315](https://github.com/apache/doris/pull/13315)

- stream loadで最後の行のデータが失われるバグを修正。[#13066](https://github.com/apache/doris/pull/13066)

- バックアップ前と同じレプリケーション数でテーブルまたはパーティションを復元するよう修正。[#11942](https://github.com/apache/doris/pull/11942)
