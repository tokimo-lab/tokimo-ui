import {
  cloneElement,
  createContext,
  type FormHTMLAttributes,
  type ReactNode,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "./utils";

/* ─── Types ─── */
// biome-ignore lint/suspicious/noExplicitAny: antd compat
export type FieldValues = Record<string, any>;
type FieldErrors = Record<string, string | undefined>;
type FieldRule = {
  required?: boolean;
  message?: string;
  type?: "url" | "email";
  min?: number;
  max?: number;
  pattern?: RegExp;
  // biome-ignore lint/suspicious/noExplicitAny: antd compat
  validator?: (rule: FieldRule, value: any) => Promise<void> | void;
  // biome-ignore lint/suspicious/noExplicitAny: antd compat
  [key: string]: any;
};

/** Rule can be a static object or a function returning a rule (antd compat) */
type FormRule = FieldRule | ((form: FormInstance) => FieldRule);

/* ─── Form Instance ─── */
export interface FormInstance<T extends FieldValues = FieldValues> {
  getFieldsValue: () => T;
  getFieldValue: (name: keyof T) => unknown;
  setFieldsValue: (values: Partial<T>) => void;
  setFieldValue: (name: keyof T, value: unknown) => void;
  resetFields: () => void;
  validateFields: () => Promise<T>;
  isFieldTouched: (name: keyof T) => boolean;
  /** Check if fields are touched (antd compat) */
  isFieldsTouched: (nameList?: (keyof T)[], allTouched?: boolean) => boolean;
  /** Internal — used by FormItem */
  _register: (
    name: string,
    rules?: FormRule[],
    onChange?: (v: unknown) => void,
  ) => void;
  _unregister: (name: string) => void;
  _getFieldError: (name: string) => string | undefined;
  _values: React.MutableRefObject<T>;
  _setValues: (v: T) => void;
  _errors: FieldErrors;
  _setErrors: React.Dispatch<React.SetStateAction<FieldErrors>>;
  _touched: Set<string>;
  _listeners: Map<string, (v: unknown) => void>;
  _rules: Map<string, FormRule[]>;
  _initialValues: T;
  _rerender: () => void;
}

export function useForm<T extends FieldValues = FieldValues>(
  initialValues?: Partial<T>,
): [FormInstance<T>] {
  const init = (initialValues ?? {}) as T;
  const valuesRef = useRef<T>({ ...init });
  const [, forceUpdate] = useState(0);
  const errorsRef = useRef<FieldErrors>({});
  const [errors, setErrors] = useState<FieldErrors>({});
  const touchedRef = useRef<Set<string>>(new Set());
  const listenersRef = useRef<Map<string, (v: unknown) => void>>(new Map());
  const rulesRef = useRef<Map<string, FormRule[]>>(new Map());

  const instance = useMemo<FormInstance<T>>(() => {
    const inst: FormInstance<T> = {
      getFieldsValue: () => ({ ...valuesRef.current }),
      getFieldValue: (name) => valuesRef.current[name],
      setFieldsValue: (values) => {
        Object.assign(valuesRef.current, values);
        for (const [key, val] of Object.entries(values)) {
          listenersRef.current.get(key)?.(val);
        }
        forceUpdate((n) => n + 1);
      },
      setFieldValue: (name, value) => {
        (valuesRef.current as Record<string, unknown>)[name as string] = value;
        listenersRef.current.get(name as string)?.(value);
        forceUpdate((n) => n + 1);
      },
      resetFields: () => {
        valuesRef.current = { ...init };
        for (const [key, fn] of listenersRef.current) {
          fn((init as Record<string, unknown>)[key]);
        }
        setErrors({});
        errorsRef.current = {};
        touchedRef.current.clear();
        forceUpdate((n) => n + 1);
      },
      validateFields: async () => {
        const newErrors: FieldErrors = {};
        for (const [name, rules] of rulesRef.current) {
          const value = valuesRef.current[name as keyof T];
          for (const rawRule of rules) {
            const rule =
              typeof rawRule === "function"
                ? rawRule(instance as unknown as FormInstance)
                : rawRule;
            const errMsg = await validateRule(rule, value, name);
            if (errMsg) {
              newErrors[name] = errMsg;
              break;
            }
          }
        }
        setErrors(newErrors);
        errorsRef.current = newErrors;
        const hasErrors = Object.values(newErrors).some(Boolean);
        if (hasErrors) {
          throw new Error("Validation failed");
        }
        return { ...valuesRef.current };
      },
      isFieldTouched: (name) => touchedRef.current.has(name as string),
      isFieldsTouched: (nameList, allTouched) => {
        const names = nameList
          ? nameList.map((n) => String(n))
          : Array.from(rulesRef.current.keys());
        if (allTouched) return names.every((n) => touchedRef.current.has(n));
        return names.some((n) => touchedRef.current.has(n));
      },
      _register: (name, rules, onChange) => {
        if (rules) rulesRef.current.set(name, rules);
        if (onChange) listenersRef.current.set(name, onChange);
      },
      _unregister: (name) => {
        rulesRef.current.delete(name);
        listenersRef.current.delete(name);
      },
      _getFieldError: (name) => errorsRef.current[name],
      _values: valuesRef,
      _setValues: (v) => {
        valuesRef.current = v;
        forceUpdate((n) => n + 1);
      },
      _errors: errors,
      _setErrors: setErrors,
      _touched: touchedRef.current,
      _listeners: listenersRef.current,
      _rules: rulesRef.current,
      _initialValues: init,
      _rerender: () => forceUpdate((n) => n + 1),
    };
    return inst;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [errors, init]);

  // Keep errors synced
  instance._errors = errors;

  return [instance];
}

async function validateRule(
  rule: FieldRule,
  value: unknown,
  name: string,
): Promise<string | undefined> {
  const strVal = typeof value === "string" ? value : "";

  if (rule.required) {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return rule.message ?? `${name} 为必填项`;
    }
  }

  if (rule.type === "url" && strVal) {
    try {
      new URL(strVal);
    } catch {
      return rule.message ?? "请输入有效的 URL";
    }
  }

  if (rule.type === "email" && strVal) {
    if (!/\S+@\S+\.\S+/.test(strVal)) {
      return rule.message ?? "请输入有效的邮箱";
    }
  }

  if (rule.min !== undefined && strVal && strVal.length < rule.min) {
    return rule.message ?? `至少 ${rule.min} 个字符`;
  }

  if (rule.max !== undefined && strVal && strVal.length > rule.max) {
    return rule.message ?? `最多 ${rule.max} 个字符`;
  }

  if (rule.pattern && strVal && !rule.pattern.test(strVal)) {
    return rule.message ?? "格式不正确";
  }

  if (rule.validator) {
    try {
      await rule.validator(rule, value);
    } catch (err) {
      return rule.message ?? (err instanceof Error ? err.message : "验证失败");
    }
  }
  return undefined;
}

/* ─── Form Context ─── */
const FormContext = createContext<FormInstance | null>(null);

export function useFormContext() {
  return useContext(FormContext);
}

/* ─── Form ─── */
export interface FormProps
  extends Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> {
  /** Form instance from useForm() */
  form?: FormInstance;
  /** Layout */
  layout?: "horizontal" | "vertical" | "inline";
  /** Label column span (for horizontal) */
  labelCol?: { span?: number };
  /** Wrapper column span (for horizontal) */
  wrapperCol?: { span?: number };
  /** Initial values */
  initialValues?: FieldValues;
  /** Submit handler */
  // biome-ignore lint/suspicious/noExplicitAny: antd compat
  onFinish?: (values: any) => void;
  /** Finish failed */
  onFinishFailed?: (errorInfo: {
    errorFields: Array<{ name: string; errors: string[] }>;
  }) => void;
  /** Required mark display */
  requiredMark?: boolean;
  /** Form size */
  size?: "small" | "middle" | "large";
  children?: ReactNode;
}

export function Form({
  form: formProp,
  layout = "vertical",
  labelCol,
  wrapperCol,
  initialValues,
  onFinish,
  onFinishFailed,
  className,
  children,
  ...rest
}: FormProps) {
  const [internalForm] = useForm(initialValues);
  const form = formProp ?? internalForm;

  // Set initial values if provided and form is external
  if (initialValues && formProp) {
    const current = form.getFieldsValue();
    const needsInit = Object.keys(initialValues).some(
      (k) => current[k] === undefined,
    );
    if (needsInit) {
      form.setFieldsValue(initialValues);
    }
  }

  return (
    <FormContext.Provider value={form}>
      <form
        className={cn(
          layout === "inline" && "flex flex-wrap gap-4",
          layout === "vertical" && "space-y-4",
          className,
        )}
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            const values = await form.validateFields();
            onFinish?.(values);
          } catch {
            const errorFields = Object.entries(form._errors)
              .filter(([, v]) => v)
              .map(([k, v]) => ({
                name: k,
                errors: [v!],
              }));
            onFinishFailed?.({ errorFields });
          }
        }}
        {...rest}
      >
        {children}
      </form>
    </FormContext.Provider>
  );
}

/* ─── Form.Item ─── */
export interface FormItemProps {
  /** Field name */
  name?: string;
  /** Label */
  label?: ReactNode;
  /** Validation rules */
  rules?: FormRule[];
  /** Required shorthand */
  required?: boolean;
  /** Extra info below input */
  extra?: ReactNode;
  /** The value prop name (default: "value") */
  valuePropName?: string;
  /** Trigger event name (default: "onChange") */
  trigger?: string;
  /** Initial value for this field */
  initialValue?: unknown;
  /** Whether to hide the field */
  hidden?: boolean;
  /** Conditional field rendering via shouldUpdate */
  shouldUpdate?:
    | boolean
    | ((prevValues: FieldValues, curValues: FieldValues) => boolean);
  /** Tooltip for label */
  tooltip?: ReactNode;
  /** No style wrapper (antd compat) */
  noStyle?: boolean;
  /** Field dependencies */
  dependencies?: string[];
  /** Layout direction */
  layout?: "horizontal" | "vertical";
  /** Label col span */
  labelCol?: { span?: number };
  /** Wrapper col span */
  wrapperCol?: { span?: number };
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode | ((form: FormInstance) => ReactNode);
}

Form.Item = function FormItem({
  name,
  label,
  rules = [],
  required,
  extra,
  valuePropName = "value",
  trigger = "onChange",
  initialValue,
  hidden = false,
  shouldUpdate: _shouldUpdate,
  tooltip,
  className,
  style,
  children,
}: FormItemProps) {
  const form = useFormContext();
  const [, rerender] = useState(0);

  // Merge required into rules if not already
  const mergedRules = useMemo(() => {
    if (required && !rules.some((r) => typeof r !== "function" && r.required)) {
      return [
        { required: true, message: `${label ?? name} 为必填项` },
        ...rules,
      ];
    }
    return rules;
  }, [rules, required, label, name]);

  // Register field
  const onChangeRef = useRef<((v: unknown) => void) | undefined>(undefined);
  onChangeRef.current = (_v: unknown) => rerender((n) => n + 1);

  useMemo(() => {
    if (name && form) {
      form._register(name, mergedRules, onChangeRef.current);
      // Set initial value if provided
      if (
        initialValue !== undefined &&
        form._values.current[name] === undefined
      ) {
        (form._values.current as Record<string, unknown>)[name] = initialValue;
      }
    }
  }, [name, form, mergedRules, initialValue]);

  if (hidden) return null;

  // shouldUpdate + render function support
  if (typeof children === "function" && form) {
    return <>{(children as (form: FormInstance) => ReactNode)(form)}</>;
  }

  const error = name ? form?._errors[name] : undefined;
  const value = name
    ? (form?._values.current as Record<string, unknown>)?.[name]
    : undefined;

  // Clone child with value and onChange
  let child = children;
  if (
    name &&
    form &&
    children &&
    typeof children !== "string" &&
    typeof children !== "number"
  ) {
    const childEl = children as React.ReactElement;
    if (childEl && typeof childEl === "object" && "type" in childEl) {
      const injectedProps: Record<string, unknown> = {
        [valuePropName]: value,
        [trigger]: (...args: unknown[]) => {
          let newValue: unknown;
          // Handle native events
          if (
            args[0] &&
            typeof args[0] === "object" &&
            "target" in (args[0] as Record<string, unknown>)
          ) {
            const target = (args[0] as React.ChangeEvent<HTMLInputElement>)
              .target;
            newValue =
              target.type === "checkbox" ? target.checked : target.value;
          } else {
            newValue = args[0];
          }
          (form._values.current as Record<string, unknown>)[name] = newValue;
          form._touched.add(name);
          form._rerender();
          // Call original handler
          const originalHandler = (childEl.props as Record<string, unknown>)[
            trigger
          ];
          if (typeof originalHandler === "function") {
            originalHandler(...args);
          }
        },
        id: name,
      };
      if (error) {
        injectedProps.status = "error";
      }

      child = cloneElement(childEl, injectedProps);
    }
  }

  return (
    <div className={cn("w-full", className)} style={style}>
      {label ? (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          {required ||
          mergedRules.some((r) => typeof r !== "function" && r.required) ? (
            <span className="text-red-500 mr-0.5">*</span>
          ) : null}
          {label}
          {tooltip ? (
            <span className="ml-1 text-slate-400 text-xs">{tooltip}</span>
          ) : null}
        </label>
      ) : null}
      <div>{child as ReactNode}</div>
      {error ? <div className="mt-1 text-xs text-red-500">{error}</div> : null}
      {extra ? (
        <div className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {extra}
        </div>
      ) : null}
    </div>
  );
};

Form.useForm = useForm;
