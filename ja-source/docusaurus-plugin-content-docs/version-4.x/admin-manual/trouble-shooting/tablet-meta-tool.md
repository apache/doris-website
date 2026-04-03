---
{
  "title": "タブレットメタデータ管理ツール",
  "language": "ja",
  "description": "コードの最新バージョンでは、tabletのメタ情報を保存するためにBEにRocksDBを導入しました。"
}
---
# Tablet メタデータ管理ツール

## 背景

最新バージョンのコードでは、ヘッダーファイルを通じてメタ情報を保存することによる様々な機能的および性能的問題を解決するために、tablet のメタ情報を保存するために BE に RocksDB を導入しました。現在、各データディレクトリ（root path）には対応する RocksDB インスタンスがあり、その中で対応する root path 上のすべての tablet がキー・バリュー形式で保存されています。

これらのメタデータの保守を容易にするため、関連する管理操作を完了するためのオンライン HTTP インターフェースとオフライン meta tool を提供しています。

HTTP インターフェースは tablet メタデータをオンラインで表示するためにのみ使用され、BE プロセスが実行中に使用できます。

一方、meta tool はオフラインメタデータ管理操作にのみ使用されます。使用前に BE を停止する必要があります。

meta tool ツールは BE の Lib / ディレクトリに保存されています。

## 操作

### Tablet Meta の表示

Tablet Meta 情報の表示はオンラインとオフラインの方法に分けることができます

#### オンライン

BE の HTTP インターフェースにアクセスして対応する Tablet Meta 情報を取得します：

api:

`http://{host}:{port}/api/meta/header/{tablet_id}/{schema_hash}`

> Host: be ホスト名
>
> port: BE の HTTP ポート
>
> tablet id: tablet id
>
> schema hash: tablet schema hash

例を示します：

`http://be_host:8040/api/meta/header/14156/2458238340`

最終的なクエリが成功した場合、Tablet Meta が json として返されます。

#### オフライン

meta\ tool ツールに基づいてディスク上の Tablet Meta を取得します。

コマンド：

```
./lib/meta_tool --root_path=/path/to/root_path --operation=get_meta --tablet_id=xxx --schema_hash=xxx
```
> root_path: be.confで設定された対応するroot_pathパスパス。

結果もJSON形式でのTablet Metaの表現です。

### ヘッダーの読み込み

ヘッダーの読み込み機能は、tabletの手動移行を実現するために提供されています。この機能はJSON形式のTablet Metaに基づいているため、シャードフィールドやバージョン情報の変更が含まれる場合、Tablet MetaのJSONコンテンツで直接変更できます。その後、以下のコマンドを使用して読み込みます。

コマンド:

```
./lib/meta_tool --operation=load_meta --root_path=/path/to/root_path --json_meta_path=path
```
### Delete header

BEのディスクからtablet metaを削除する機能を実現するため。単一削除とバッチ削除をサポート。

単一削除:

```
./lib/meta_tool --operation=delete_meta --root_path=/path/to/root_path --tablet_id=xxx --schema_hash=xxx`
```
バッチ削除:

```
./lib/meta_tool --operation=batch_delete_meta --tablet_file=/path/to/tablet_file.txt
```
`tablet_file.txt`の各行はタブレットの情報を表します。形式は以下の通りです：

`root_path,tablet_id,schema_hash`

各列はカンマで区切られています。

`tablet_file`の例：

```
/output/be/data/,14217,352781111
/output/be/data/,14219,352781111
/output/be/data/,14223,352781111
/output/be/data/,14227,352781111
/output/be/data/,14233,352781111
/output/be/data/,14239,352781111
```
バッチ削除では、`tablet_file`内の不正なタブレット情報フォーマットの行はスキップされます。実行完了後、削除成功数とエラー数が表示されます。

### Pb形式のTabletMeta

このコマンドは、古いファイルベース管理のPB形式Tablet Metaを表示し、Tablet MetaをJSON形式で表示するためのものです。

Command:

```
./lib/meta_tool --operation=show_meta --root_path=/path/to/root_path --pb_header_path=path
```
### Pb形式のセグメントメタ

このコマンドはPB形式のセグメントメタを表示し、セグメントメタをJSON形式で表示するためのものです。

コマンド:

```
./meta_tool --operation=show_segment_footer --file=/path/to/segment/file
```
