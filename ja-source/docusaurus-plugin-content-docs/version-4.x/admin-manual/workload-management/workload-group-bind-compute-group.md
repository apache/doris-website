---
{
  "title": "ワークロードグループのCompute Groupへのバインド",
  "language": "ja",
  "description": "DorisはCompute Group機能を通じて、クラスタ内のBE（Backend）リソースの論理パーティショニングをサポートします。"
}
---
## 背景
Dorisは、Compute Group機能を通じてクラスタ内のBE（Backend）リソースの論理パーティショニングをサポートし、独立したサブクラスタユニットを形成して、異なるビジネス側の計算およびストレージリソースの物理的な分離を実現します。ビジネス側間のロード特性に大きな違いがあるため、Workload Groupsに対する設定要件はしばしば明確な区別を示します。

初期バージョンでは、ユーザーによって設定されたWorkload Groupsは、すべてのCompute Groupsにわたってグローバルに有効となり、異なるビジネス側が同じWorkload Group設定のセットを共有することが強制されていました。例えば、ビジネスAの高並行クエリとビジネスBの大規模データ分析は、まったく異なるリソースクォータを必要とする可能性がありますが、古いアーキテクチャはそのような差別化されたニーズを満たすことができず、リソース管理の柔軟性を制限していました。

これに対処するため、最新バージョンでは、Workload GroupsをCompute Groupsにバインドするメカニズムが導入され、各Compute Groupが独立したWorkload Groupsで設定できるようになりました。

## Compute Group紹介
Compute Groupは、当初ストレージ・コンピューティング分離アーキテクチャの下でのコアコンセプトとして、単一クラスタ内で独立したサブクラスタの論理パーティショニングを実現するように設計されています。ストレージ・コンピューティング統合アーキテクチャでは、同等の機能を持つコンセプトはResource Groupと呼ばれています。両者ともクラスタリソースの分離とグループ管理を実現できます。

Dorisのコンピュータリソースマネジメントシステムについて議論する際、Compute GroupとResource Groupは論理的に同等なコンセプトと見なすことができ、この理解により理解コストが大幅に削減されます。ただし、特定のインターフェース呼び出しレベルでは、両者とも元の独立した呼び出し仕様と使用ロジックを変更せずに維持しています。

したがって、この記事で言及されているWorkload GroupsをCompute Groupsにバインドするコンセプトと使用方法は、ストレージ・コンピューティング統合アーキテクチャとストレージ・コンピューティング分離アーキテクチャの両方に適用されます。

## 原理の紹介
クラスタにCompute Group AとCompute Group Bという名前の2つのCompute Groupsがあり、それぞれビジネス側Aとビジネス側Bにサービスを提供し、2つのビジネスシステムが完全に独立して動作していると仮定します。

同時に、クラスタには2つのWorkload Groupsが設定されています：ビジネスAによって作成されたgroup_aと、ビジネスBによって作成されたgroup_bです。この2つのグループのリソース設定クォータの合計は、クラスタの総リソースの100%をちょうど満たします。

### 以前のバージョンでのWorkload Groupの設計
以前のバージョンでは、group_1とgroup_2は、異なるBEsがすでにCompute Groupsに従ってグループ化されていても、すべてのBEノードで有効になっていました。
以前の設計では、ビジネスAがgroup_aを作成すると、すべてのWorkload Groupsの累積リソース値がすでに100%に達していたため、新しいWorkload Groupsを作成することができませんでした。さらに、group_bはビジネスBによって作成され、ビジネスAとビジネスBは完全に独立したビジネス側であるため、ビジネスAはgroup_bにアクセスすることも変更することもできませんでした。
権限ポリシーが両者にWorkload Groupsへのアクセスを許可したとしても、ビジネスロジックの完全な独立性により、リソース設定要件に大きな違いがある可能性があります（例：ビジネスAの高並行クエリとビジネスBのバッチコンピューティングが異なるリソース割り当てを必要とする）。これにより、古いアーキテクチャでは差別化管理のニーズを満たすことが困難になります。

![wg_bind_cg](/images/wg_bind_cg1.png)

### 現在の設計
現在のバージョンでは、Workload GroupはCompute Groupへのバインドをサポートしており、これは異なるCompute Groupsが異なるWorkload Group設定を持つことができることを意味します。下図に示すとおりです：

![wg_bind_cg](/images/wg_bind_cg2.png)

## 使用方法

:::tip
DorisはデフォルトのCompute Groupメカニズムを提供します：指定された割り当てなしに新しいBEノードが追加される場合、自動的にデフォルトのCompute Groupに配置されます。具体的には、コンピューティング・ストレージ分離アーキテクチャでは、デフォルトのCompute Groupはdefault_compute_groupという名前ですが、統合コンピューティング・ストレージアーキテクチャでは、defaultという名前です。
:::

1. group_aという名前のWorkload Groupを作成し、compute_group_aという名前のCompute Groupにバインドします。

```
create workload group group_a for compute_group_a properties('cpu_share'='1024')
```
2. 作成時にCompute Groupが指定されていない場合、Workload GroupはデフォルトのCompute Groupにバインドされます。

```
create workload group group_a properties('cpu_share'='1024')
```
3. compute_group_aからgroup_aという名前のWorkload Groupを削除します。

```
create workload group group_a for compute_group_a properties('cpu_share'='1024')
```
4. Workload Groupを削除する際にCompute Groupが指定されていない場合、システムはdefaultという名前のCompute GroupからWorkload Groupを削除しようと試みます。

```
create workload group group_a properties('cpu_share'='1024')
```
5. 同様に、Workload Groupを変更する際は、ALTER文でCompute Groupを指定する必要があります。Compute Groupが指定されていない場合、システムはデフォルトのCompute Group配下のWorkload Groupを変更しようと試みます。なお、ALTER文はWorkload Groupのプロパティのみを変更し、Compute Groupとのバインド関係は変更できません。

```
alter workload group group_a for compute_group_a properties('cpu_share'='2048')
```
## 注意
1. Workload GroupとCompute Groupの間のバインド関係の変更は現在サポートされていません。Workload Groupは作成時に固定のCompute Groupに属し、Compute Group間で移動することはできません。
2. Dorisを古いバージョンから新しいバージョンにアップグレードする際、システムは古いWorkload Groupに基づいて、各Compute Groupに対して同じ名前（ただし異なるID）の新しいWorkload Groupを自動的に作成します。例えば、古いバージョンのクラスターに2つのCompute Groupがあり、group_aという名前のWorkload Groupが存在する場合、アップグレード後、Dorisはこれら2つのCompute Groupのそれぞれに新しいgroup_a Workload Groupを作成します。これらの新しいWorkload Groupは元のgroup_aとは異なるIDを持ち、どのCompute Groupにも関連付けられていなかった元のgroup_aはシステムによって自動的に削除されます。
3. Workload Groupの認証管理は変更されません。Workload Groupの認証は引き続きその名前との関連付けによって実現されます。
4. Dorisには、normalという名前のデフォルトのWorkload Groupがあります。新しいCompute Groupが作成されるたびに、DorisはそのためにnormalのWorkload Groupを自動的に生成します。逆に、Compute Groupが削除されると、対応するnormalのWorkload Groupも自動的に削除されます。これは、normalのWorkload Groupのライフサイクル管理がDorisによって完全に自動化されており、手動による介入が不要であることを意味します。
