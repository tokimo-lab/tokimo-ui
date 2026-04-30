/**
 * @tokimo/ui - 通用 UI 组件库
 *
 * 此包包含与业务逻辑无关的通用 UI 组件，可在多个应用间复用。
 */

export type { AlertProps } from "./Alert";
export { Alert } from "./Alert";
export type { AppAccentColor, AppSetupGuideProps } from "./AppSetupGuide";
export { AppSetupGuide } from "./AppSetupGuide";
export type {
  AppSidebarFooterAction,
  AppSidebarItem,
  AppSidebarProps,
  AppSidebarSection,
} from "./AppSidebar";
export { AppSidebar } from "./AppSidebar";
export type { AutoCompleteOption, AutoCompleteProps } from "./AutoComplete";
export { AutoComplete } from "./AutoComplete";
export type { AvatarProps } from "./Avatar";
export {
  Avatar,
  getAvatarColor,
  getAvatarInitial,
  setAvatarUrlResolver,
} from "./Avatar";
export type { BadgeProps } from "./Badge";
export { Badge } from "./Badge";
export type { ButtonProps } from "./Button";
// ─── Base components ───
export { Button } from "./Button";
export type { CardProps } from "./Card";
export { Card } from "./Card";
export type { CheckboxProps } from "./Checkbox";
export { Checkbox } from "./Checkbox";
export { CircularProgress } from "./CircularProgress";
export type { CollapseItem, CollapseProps } from "./Collapse";
export { Collapse } from "./Collapse";
export type { ColorPickerProps } from "./ColorPicker";
export { ColorPicker } from "./ColorPicker";
export type {
  ActiveDescendantControls,
  ContextMenuItem,
  ContextMenuProps,
} from "./ContextMenu";
export {
  ActiveDescendantContext,
  ContextMenu,
  useContextMenu,
} from "./ContextMenu";
export type {
  DatePickerProps,
  DateTimePickerProps,
  TimePickerProps,
} from "./DatePicker";
export { DatePicker, DateTimePicker, TimePicker } from "./DatePicker";
export type { DescriptionsItem, DescriptionsProps } from "./Descriptions";
export { Descriptions } from "./Descriptions";
export type { DividerProps } from "./Divider";
export { Divider } from "./Divider";
export type { DrawerProps } from "./Drawer";
export { Drawer } from "./Drawer";
export type {
  DropdownMenuConfig,
  DropdownMenuItem,
  DropdownProps,
} from "./Dropdown";
export { Dropdown } from "./Dropdown";
// ─── Date format ───
export type {
  DateFormatConfig,
  DateFormatContextValue,
  DateFormatStorage,
} from "./dateFormat";
export {
  cookieStorage as dateFormatCookieStorage,
  DateFormatProvider,
  localStorageStorage as dateFormatLocalStorageStorage,
  noopStorage as dateFormatNoopStorage,
  useDateFormat,
  useDateFormatOrNull,
} from "./dateFormat";
export type { DragHandleProps, UseDndOptions, UseDndReturn } from "./dnd";
export { DragHandle, useDnd } from "./dnd";
export type { EmojiPickerProps } from "./EmojiPicker";
export { EmojiPicker } from "./EmojiPicker";
export type { EmptyProps } from "./Empty";
export { Empty } from "./Empty";
// ─── FileManager ───
export * from "./FileManager";
export { FloatingVibrancy } from "./FloatingVibrancy";
export type { FieldValues as FormFieldValues, FormInstance } from "./Form";
export {
  Form,
  FormItemTooltip,
  useForm,
  useFormContext,
  useWatch,
} from "./Form";
export type { ImageProps } from "./Image";
export { Image } from "./Image";
export type { InlineEmojiPickerProps } from "./InlineEmojiPicker";
export { InlineEmojiPicker } from "./InlineEmojiPicker";
export type { InputProps } from "./Input";
export { Input, Password, SearchInput, TextArea } from "./Input";
export type { InputNumberProps } from "./InputNumber";
export { InputNumber } from "./InputNumber";
// ─── Icons (re-exported from lucide with antd-compatible names) ───
export * from "./icons";
export type { ListProps } from "./List";
export { List } from "./List";
// ─── Locale / ConfigProvider ───
export type { Locale } from "./locale";
export { ConfigProvider, enUS, jaJP, useLocale, zhCN } from "./locale";
export type { MenuItem as MenuItemType, MenuProps } from "./Menu";
export { Menu } from "./Menu";
export type { MiniAreaChartProps } from "./MiniAreaChart";
export { MiniAreaChart } from "./MiniAreaChart";
export type {
  ConfirmConfig,
  ConfirmVariant,
  ModalProps,
  ScaledModalSize,
} from "./Modal";
// ─── Feedback / Navigation ───
export {
  Modal,
  ModalContainerContext,
  setActiveModalContainer,
  useConfirm,
} from "./Modal";
export type { PaginationProps } from "./Pagination";
export { Pagination } from "./Pagination";
export type { PathBarProps } from "./PathBar";
export { PathBar } from "./PathBar";
export type {
  PillTab,
  PillTabBarProps,
  PillTabFilter,
  PillTabSort,
  PillTabSortOption,
} from "./PillTabBar";
export { PillTabBar } from "./PillTabBar";
export type { PopconfirmProps } from "./Popconfirm";
export { Popconfirm } from "./Popconfirm";
export type { PopoverProps } from "./Popover";
export { Popover } from "./Popover";
export type { PosterCardProps } from "./PosterCard";
export { PosterCard } from "./PosterCard";
export type { ProgressProps } from "./Progress";
export { Progress } from "./Progress";
export type { ScrollAreaProps, ScrollAreaRef } from "./ScrollArea";
export { ScrollArea } from "./ScrollArea";
export type {
  ScrollNavItem,
  ScrollNavProps,
  ScrollNavSectionProps,
} from "./ScrollNav";
export { ScrollNav } from "./ScrollNav";
export type {
  SegmentedControlOption,
  SegmentedControlProps,
} from "./SegmentedControl";
export { SegmentedControl } from "./SegmentedControl";
export type { SelectOption, SelectProps } from "./Select";
// ─── Complex components ───
export { Select, selectTriggerClassName } from "./Select";
export type { SelectTriggerProps } from "./SelectTrigger";
export { SelectTrigger } from "./SelectTrigger";
export type {
  SettingGroupProps,
  SettingRowProps,
  SettingSliderProps,
} from "./SettingRow";
export { SettingGroup, SettingRow, SettingSlider } from "./SettingRow";
export type { SettingsMenuItem, SettingsMenuProps } from "./SettingsMenu";
export { SettingsMenu } from "./SettingsMenu";
export type { SkeletonProps } from "./Skeleton";
export { Skeleton } from "./Skeleton";
export type { SliderProps } from "./Slider";
export { Slider } from "./Slider";
export type { SpinProps } from "./Spin";
export { Spin } from "./Spin";
export type { StatisticProps } from "./Statistic";
export { Statistic } from "./Statistic";
export type { StickySaveBarProps } from "./StickySaveBar";
export { StickySaveBar } from "./StickySaveBar";
export type { SwitchProps } from "./Switch";
export { Switch } from "./Switch";
export type { TableColumn, TableColumnsType, TableProps } from "./Table";
export { Table } from "./Table";
export type { TabItem, TabsProps } from "./Tabs";
export { Tabs } from "./Tabs";
export type { TagProps } from "./Tag";
export { Tag } from "./Tag";
export type { TemplateInputProps, TemplateVariable } from "./TemplateInput";
export { TemplateInput } from "./TemplateInput";
export type { ToastType } from "./Toast";
export { ToastProvider, useToast } from "./Toast";
export type { TooltipProps } from "./Tooltip";
// ─── Overlay / Floating ───
export { Tooltip } from "./Tooltip";
// ─── Theme ───
export type {
  AccentColor,
  Theme,
  ThemeConfig,
  ThemeContextValue,
  ThemeMode,
  ThemeStorage,
} from "./theme";
export {
  applyAccentAttribute,
  applyCustomAccentVars,
  applyThemeClass,
  cookieStorage,
  detectSystemTheme,
  getCustomHex,
  isCustomAccent,
  localStorageStorage,
  noopStorage,
  ThemeProvider,
  useTheme,
  useThemeOrNull,
} from "./theme";
// ─── Context ───
export type { UIContextValue } from "./UIContext";
export { UIContext, useUIContext } from "./UIContext";
export type { UploadChangeInfo, UploadFile, UploadProps } from "./Upload";
export { Dragger, Upload } from "./Upload";
// ─── Utilities ───
export { cn } from "./utils";
