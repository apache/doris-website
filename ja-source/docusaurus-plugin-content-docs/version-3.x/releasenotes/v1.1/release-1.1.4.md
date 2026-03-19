---
{
  "title": "リリース 1.1.4",
  "language": "ja",
  "description": "このリリースでは、Dorisチームは1.1.3以降、約60の問題またはパフォーマンス改善を修正しました。このリリースは1のバグ修正リリースです。"
}
---
このリリースでは、Doris Teamは1.1.3以降約60の問題またはパフォーマンス改善を修正しました。このリリースは1.1のバグ修正リリースであり、すべてのユーザーにこのリリースへのアップグレードを推奨します。


# Features

- Huawei Cloudのobsブローカーロードをサポート。[#13523](https://github.com/apache/doris/pull/13523)

- SparkLoadがparquetとorcファイルをサポート。[#13438](https://github.com/apache/doris/pull/13438)

# Improvements

- 重負荷時のクエリパフォーマンスに影響するため、メトリックフックでmutexを取得しないように変更。[#10941](https://github.com/apache/doris/pull/10941)


# BugFix

- spark loadがファイルをロードする際にwhere条件が効かない問題。[#13804](https://github.com/apache/doris/pull/13804)

- vectorizedモードでnullable列がある場合にif関数が誤った結果を返す問題。[#13779](https://github.com/apache/doris/pull/13779)

- anti joinを他のjoin述語と組み合わせて使用した際の誤った結果を修正。[#13743](https://github.com/apache/doris/pull/13743)

- concat(ifnull)関数を呼び出した際のBEクラッシュ。[#13693](https://github.com/apache/doris/pull/13693)

- group by句に関数がある場合のプランナーバグを修正。[#13613](https://github.com/apache/doris/pull/13613)

- lateral view句でテーブル名と列名が正しく認識されない問題。[#13600](https://github.com/apache/doris/pull/13600)

- MVとテーブルエイリアスを使用した際の不明な列エラー。[#13605](https://github.com/apache/doris/pull/13605)

- JSONReaderがvalueとparseアロケーターの両方のメモリを解放する問題。[#13513](https://github.com/apache/doris/pull/13513)

- enable_vectorized_alter_tableがtrueの場合に、負の値の列でto_bitmap()を使用したMVの作成を許可してしまう問題を修正。[#13448](https://github.com/apache/doris/pull/13448)

- from_date_format_str関数でマイクロ秒が失われる問題。[#13446](https://github.com/apache/doris/pull/13446)

- 子のsmap情報を使用した置換後にソート式のnullabilityプロパティが正しくない可能性がある問題。[#13328](https://github.com/apache/doris/pull/13328)

- 1000個の条件を持つcase when文でコアダンプが発生する問題を修正。[#13315](https://github.com/apache/doris/pull/13315)

- stream loadでデータの最後の行が失われるバグを修正。[#13066](https://github.com/apache/doris/pull/13066)

- バックアップ前と同じレプリケーション数でテーブルまたはパーティションを復元する問題。[#11942](https://github.com/apache/doris/pull/11942)
