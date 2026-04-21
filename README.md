# @tokimo/ui

A React 19 component library extracted from [Tokimo](https://github.com/tokimo-lab/tokimo) — a web desktop OS. Built with Tailwind CSS v4, Floating UI, and Lucide icons. **Zero third-party UI framework dependency.**

## Features

- 🎨 **Tailwind-first** — every component is styled with Tailwind utilities; light/dark via `dark:` variant
- 🪟 **Floating UI** for popovers, dropdowns, tooltips, modals
- 🌐 **i18n built-in** — `ConfigProvider` + `Locale` (en-US / zh-CN ship by default; bring your own)
- 🧩 **Tree-shakeable** — every component is its own export from `src/index.ts`
- 🪶 **No runtime CSS-in-JS** — what you see is what you ship

## Install

```bash
pnpm add @tokimo/ui
# peer deps:
pnpm add react react-dom
```

You also need Tailwind CSS v4 set up in your app.

## Usage

```tsx
import { Button, ConfigProvider, Modal, zhCN } from "@tokimo/ui";

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <Button onClick={() => Modal.confirm({ title: "Hi" })}>Open</Button>
    </ConfigProvider>
  );
}
```

Default locale is **en-US**. Wrap your tree with `<ConfigProvider locale={zhCN}>` (or your own `Locale` impl) to override.

## Components

`Alert`, `AppSidebar`, `AutoComplete`, `Avatar`, `Badge`, `Button`, `Calendar`, `Card`, `Checkbox`, `ConfigProvider`, `DatePicker`, `Drawer`, `Dropdown`, `EmojiPicker`, `Empty`, `Form`, `Input`, `InputNumber`, `List`, `Menu`, `MiniAreaChart`, `Modal`, `Pagination`, `Popconfirm`, `Popover`, `Progress`, `Radio`, `ScrollArea`, `Segmented`, `Select`, `Skeleton`, `Slider`, `Spin`, `Switch`, `Table`, `Tabs`, `Tag`, `TimePicker`, `Toast`, `Tooltip`, `Tree`, `Upload`, …

## Development

```bash
pnpm install
pnpm typecheck
pnpm lint
```

## License

[MIT](./LICENSE) © Tokimo Lab
