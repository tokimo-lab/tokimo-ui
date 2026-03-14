/**
 * @acme/components - 通用 UI 组件库
 *
 * 此包包含与业务逻辑无关的通用 UI 组件，可在多个应用间复用。
 */

export type { AlertProps } from "./Alert";
export { Alert } from "./Alert";
export type { AutoCompleteOption, AutoCompleteProps } from "./AutoComplete";
export { AutoComplete } from "./AutoComplete";
export type { AvatarProps } from "./Avatar";
export { Avatar } from "./Avatar";
export type { BadgeProps } from "./Badge";
export { Badge } from "./Badge";
export type { ButtonProps } from "./Button";
// ─── Base components ───
export { Button } from "./Button";
export type { CardProps } from "./Card";
export { Card } from "./Card";
export type { CheckboxProps } from "./Checkbox";
export { Checkbox } from "./Checkbox";
export type { CollapseProps } from "./Collapse";
export { Collapse } from "./Collapse";
export type { ContextMenuItem, ContextMenuProps } from "./ContextMenu";
export { ContextMenu, useContextMenu } from "./ContextMenu";
export type { DescriptionsProps } from "./Descriptions";
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
export type { EmptyProps } from "./Empty";
export { Empty } from "./Empty";
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
export { Input, Password, SearchInput, TextArea } from "./Input";
export type { InputNumberProps } from "./InputNumber";
export { InputNumber } from "./InputNumber";
// ─── Icons (re-exported from lucide with antd-compatible names) ───
export * from "./icons";
export type { ListProps } from "./List";
export { List } from "./List";
export type { MenuItem as MenuItemType, MenuProps } from "./Menu";
export { Menu } from "./Menu";
export type { ConfirmConfig, ModalProps, ScaledModalSize } from "./Modal";
// ─── Feedback / Navigation ───
export { Modal } from "./Modal";
export type { PaginationProps } from "./Pagination";
export { Pagination } from "./Pagination";
export type { PopconfirmProps } from "./Popconfirm";
export { Popconfirm } from "./Popconfirm";
export type { PopoverProps } from "./Popover";
export { Popover } from "./Popover";
export type { ProgressProps } from "./Progress";
export { Progress } from "./Progress";
export type { SegmentedToggleProps } from "./SegmentedToggle";
export { SegmentedToggle } from "./SegmentedToggle";
export type { SelectOption, SelectProps } from "./Select";
// ─── Complex components ───
export { Select } from "./Select";
export type { SkeletonProps } from "./Skeleton";
export { Skeleton } from "./Skeleton";
export type { SpinProps } from "./Spin";
export { Spin } from "./Spin";
export type { StatisticProps } from "./Statistic";
export { Statistic } from "./Statistic";
export type { SwitchProps } from "./Switch";
export { Switch } from "./Switch";
export type { TableColumnsType, TableProps } from "./Table";
export { Table } from "./Table";
export type { TabsProps } from "./Tabs";
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
export type { UploadChangeInfo, UploadFile, UploadProps } from "./Upload";
export { Dragger, Upload } from "./Upload";
// ─── Utilities ───
export { cn } from "./utils";
