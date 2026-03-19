---
{
  "title": "リリース 2.0.12",
  "language": "ja",
  "description": "コミュニティの開発者およびユーザーの皆様のご貢献に感謝いたします。Dorisバージョン2.0.12では99の改善とバグ修正を提供いたします。"
}
---
コミュニティの開発者とユーザーの皆様の貢献に感謝いたします。Doris version 2.0.12では99の改善とバグ修正をお届けします。

**クイックダウンロード:** https://doris.apache.org/download/

**GitHub Release:** https://github.com/apache/doris/releases

## 動作変更

- デフォルトのテーブルコメントをテーブルタイプに設定することを廃止しました。代わりに、デフォルトで空に設定されます。例えば、COMMENT 'OLAP'からCOMMENT ' 'に変更されます。この新しい動作は、テーブルコメントに依存するBIソフトウェアにとってより親しみやすいものです。[#35855](https://github.com/apache/doris/pull/35855)

- `@@autocommit`変数の型を`BOOLEAN`から`BIGINT`に変更し、特定のMySQLクライアント（.NET MySQL.Dataなど）からのエラーを防ぎます。[#33282](https://github.com/apache/doris/pull/33282)

## 改善

- `disable_nested_complex_type`パラメータを削除し、ネストした`ARRAY`、`MAP`、`STRUCT`型の作成をデフォルトで許可するようになりました。[#36255](https://github.com/apache/doris/pull/36255)

- HMS catalogが`SHOW CREATE DATABASE`コマンドをサポートしました。[#28145](https://github.com/apache/doris/pull/28145)

- クエリプロファイルに転置インデックスのメトリクスを追加しました。[#36545](https://github.com/apache/doris/pull/36545)

- Cross-クラスター Replication (CCR)が転置インデックスをサポートしました。[#31743](https://github.com/apache/doris/pull/31743)

完全なリストはGitHubの[link](https://github.com/apache/doris/compare/2.0.11...2.0.12)からアクセスでき、主な機能と改善点を以下にハイライトしています。

## 謝辞

このリリースに貢献してくださった全ての方々に感謝いたします：

@airborne12, D14@amorynan, D14@BiteTheDDDDt, D14@cambyzju, D14@caoliang-web, D14@dataroaring, D14@eldenmoon, D14@feiniaofeiafei, D14@felixwluo, D14@gavinchou, D14@HappenLee, D14@hello-stephen, D14@jacktengg, D14@Jibing-Li, D14@Johnnyssc, D14@liaoxin01, D14@LiBinfeng-01, D14@luwei16, D14@mongo360, D14@morningman, D14@morrySnow, D14@mrhhsg, D14@Mryange, D14@mymeiyi, D14@qidaye, D14@qzsee, D14@starocean999, D14@w41ter, D14@wangbo, D14@wsjz, D14@wuwenchi, D14@xiaokang, D14@XuPengfei-1020, D14@xy720, D14@yongjinhou, D14@yujun777, D14@Yukang-Lian, D14@Yulei-Yang, D14@zclllyybb, D14@zddr, D14@zhannngchen, D14@zhiqiang-hhhh, D14@zy-kkk, D14@zzzxl1993
