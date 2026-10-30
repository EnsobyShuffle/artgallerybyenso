# Art Gallery by Enso：中国大陆部署迁移

更新时间：2026-10-31（Asia/Shanghai）

## 目标与当前状态

保持现有艺术家、作品、界面和来源记录，将生产访问路径迁入中国大陆。验收包括页面、图片、收藏、笔记及手机/微信内访问；不能用海外构建成功代替国内网络测试。

- 原站：https://artgallerybyenso.netlify.app
- 源码：EnsobyShuffle/artgallerybyenso
- 迁移分支：`migration/tencent-mainland`
- 本轮基于 main：`399df0d2601d5575da5004183fc66553679aa54a`
- 状态：已完成首轮代码准备与离线检查，尚未部署腾讯云，尚未切域名。
- 腾讯云控制台需要正常登录；账号、实名、环境、域名、备案、资源费用仍待实际核对。
- 内容任务仍可能更新 main，每轮先比较最新 main，保留并合入新增内容后重跑审计，不能用本快照覆盖更新。

## 第一轮成果

- 当前数据合并后：9 位艺术家、324 条作品记录；这些是记录数量，不是完整性或许可审核结论。
- 20 条作品使用仓库内的图片；其余自动加载图像仍依赖外部来源。
- 审计发现 616 处运行时外部资源引用、344 个去重 URL；清单见 `research/mainland-migration-audit.json`。
- 外部引用不等于该域名在国内一定被封。需逐项确认许可、原图及实际可达性；关键展示图像优先合法再托管。
- 新增 `/personal-data.html`：收藏/笔记备份下载、导入预览、合并、冲突保护和失败回退。旧域名上的数据不会自动出现在新域名，必须先在原域名导出再在新域名导入。
- 已建立公开文件白名单打包脚本，不上传研究目录、环境配置、凭证、测试或私人笔记。
- 本轮预览包包含 28 个文件，约 5.29 MB；包名明确标注 preview，不代表国内生产验收通过。

## 可重复执行的准备流程

```bash
node scripts/test-personal-data.cjs
node --check personal-data.js
node --check personal-data-core.js
python3 scripts/prepare-cloudbase.py
```

产物：`build/cloudbase/`、`build/cloudbase-files.json`、`build/artgallery-cloudbase-preview.zip`。

生产检查：`python3 scripts/prepare-cloudbase.py --release`。当前会因外部图像引用而阻止生成生产包；不要将失败屏蔽后称为已就绪。每轮内容更新后重新核对清单。严格模式仅是一项静态检查，不能替代国内网络、授权、交互和回退验收。

## 腾讯云部署准备

官方文档（2026-10-31 已阅读）：
- https://docs.cloudbase.net/cli-v1/hosting
- https://docs.cloudbase.net/cli-v1/config

`cloudbaserc.example.json` 使用官方 hosting 配置，目标为上海地域。它是模板，不含真实环境 ID 或凭证。

在账号与具体环境确认后，复制成未跟踪的 `cloudbaserc.json`，以安全的运行时方式提供 `TCB_ENV_ID`。实际部署前检查环境属于用户、静态托管已开通、域名路由正确且路径不与其他站点冲突。不要把多个网站都直接部署到同一个托管根目录；应使用独立应用/正确域名路由。当前模板仅用于单独的画廊应用根路径。

以下命令需已有正常登录状态、有效环境 ID 和已批准的目标站点；本轮未执行：

```bash
tcb hosting detail -e "$TCB_ENV_ID"
tcb hosting deploy ./build/cloudbase --verify --safe -e "$TCB_ENV_ID"
```

不使用 `--prune` 清理远端。正式域名需要检查备案及 HTTPS。Netlify `_headers` 不会自动成为 CloudBase 响应头；在目标平台另核对 `X-Robots-Tag: noindex, nofollow`、`X-Content-Type-Options: nosniff` 和内容类型。HTML 已有 noindex 元信息，但这不是访问控制。不得将需要私密访问的内容改为公开。

## 下一工作包

1. 核对图像许可，从已具备明确可复用来源的作品开始迁移；保留来源页与权利信息。
2. 在原站交付备份入口后，验证一组收藏/笔记导出并导入新域名；有冲突保留当前笔记，用户原备份文件留作对照。
3. 完成腾讯云登录、账号与环境核对，提交真实首付款、续费与备案条件；不在公开仓库存放实名材料或账单。
4. 发布到腾讯云测试目标并验证文件一致性；暂不切正式域名。
5. 国内电信、移动、联通及微信内测试页面、图片、搜索、详情、收藏、笔记、刷新与手机布局，记录日期/网络/结果；没有证据的项目保持待验证。
6. 保留原站和代码版本，验收通过后再切入口；内容持续任务随后改用新发布流程。

## 验证边界

本轮执行的是源码和离线数据验证；未执行真实浏览器交互、国内多运营商测试、ICP备案、腾讯云上传或付款。数据恢复测试覆盖合并、冲突、重复导入、错误格式、恶意属性、写入失败回退及原数据损坏时不覆盖。不得将“准备完成”写成“已迁移上线”。
