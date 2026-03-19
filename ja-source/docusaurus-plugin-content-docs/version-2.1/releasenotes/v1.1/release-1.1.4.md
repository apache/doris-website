---
{
  "title": "リリース 1.1.4",
  "language": "ja",
  "description": "このリリースでは、Dorisチームはバージョン1.1.3以降、約60の問題またはパフォーマンス改善を修正しました。このリリースはバージョン1のバグフィックスリリースです。"
}
---
このリリースでは、Doris Teamは1.1.3以降約60の問題修正またはパフォーマンス改善を行いました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーにこのリリースへのアップグレードを推奨します。

# Features

- Huawei Cloudのobsブローカーロードをサポート。[#13523](https://github.com/apache/doris/pull/13523)

- SparkLoadでparquetとorcファイルをサポート。[#13438](https://github.com/apache/doris/pull/13438)

# Improvements

- 高負荷時にクエリパフォーマンスに影響するため、メトリックフックでのmutex取得を行わないようにしました。[#10941](https://github.com/apache/doris/pull/10941)

# BugFix

- spark loadがファイルを読み込む際にwhere条件が有効にならない問題。[#13804](https://github.com/apache/doris/pull/13804)

- ベクトル化モードでnull許可列がある場合にif関数が誤った結果を返す問題。[#13779](https://github.com/apache/doris/pull/13779)

- 他の結合述語とanti joinを使用する際の誤った結果を修正。[#13743](https://github.com/apache/doris/pull/13743)

- concat(ifnull)関数呼び出し時のBEクラッシュ。[#13693](https://github.com/apache/doris/pull/13693)

- group by句に関数がある場合のプランナーバグを修正。[#13613](https://github.com/apache/doris/pull/13613)

- lateral view句でテーブル名と列名が正しく認識されない問題。[#13600](https://github.com/apache/doris/pull/13600)

- MVとテーブルエイリアス使用時の不明な列エラー。[#13605](https://github.com/apache/doris/pull/13605)

- JSONReaderでvalueとparse allocator両方のメモリを解放するよう修正。[#13513](https://github.com/apache/doris/pull/13513)

- enable_vectorized_alter_tableがtrueの場合に負の値列でto_bitmap()を使用したMV作成を許可する問題を修正。[#13448](https://github.com/apache/doris/pull/13448)

- from_date_format_str関数でマイクロ秒が失われる問題。[#13446](https://github.com/apache/doris/pull/13446)

- 子のsmap情報を使用した置換後にソート式のnull許可プロパティが正しくない可能性がある問題。[#13328](https://github.com/apache/doris/pull/13328)

- 1000個の条件を持つcase when文でのコアダンプを修正。[#13315](https://github.com/apache/doris/pull/13315)

- stream loadで最後の行のデータが失われるバグを修正。[#13066](https://github.com/apache/doris/pull/13066)

- バックアップ前と同じレプリケーション数でテーブルまたはパーティションを復元するよう修正。[#11942](https://github.com/apache/doris/pull/11942)
