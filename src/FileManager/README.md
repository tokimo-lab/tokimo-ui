# FileManager

通用文件管理器 UI 组件库，支持网格视图、列表视图、多列 Finder 风格视图。

## 依赖项

- `material-icon-theme`: 文件图标映射
- `mime`: MIME 类型推断
- `dayjs`: 日期格式化

## Material Icon Theme SVG 资源

`MaterialFileIcon` 组件需要从 `/material-icons/*.svg` URL 加载图标 SVG。

**Consumer app 必须**：

1. 将 `material-icon-theme` 包中的 SVG 文件复制到 public 目录：

```bash
# 从 node_modules 复制到 public/material-icons/
cp -r node_modules/material-icon-theme/icons/*.svg public/material-icons/
```

2. 或在构建流程中自动化（如 Vite `vite-plugin-static-copy` 插件）

**SVG 路径约定**：所有 SVG 必须可通过 `/material-icons/<filename>.svg` 访问。

## 组件列表

- `types.ts` — 类型定义 + 纯函数工具
- `MaterialFileIcon` — 文件/文件夹图标
- `useMarqueeSelection` — 框选 hook
- `FileBreadcrumb` — 路径面包屑
- `FileToolbar` — 视图切换 + 排序工具栏
- `FileItem` — 单个文件/文件夹项
- `FileGrid` — 网格视图
- `FileColumnView` — Finder 风格多列视图
- `FileColumnPreview` — 列视图预览面板
