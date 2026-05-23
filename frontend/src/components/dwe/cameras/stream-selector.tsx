import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const StreamSelector = ({
  options,
  placeholder,
  label,
  value,
  onChange,
  disabled = false,
}: {
  options: string[];
  placeholder: string;
  label: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) => {
  const isValueValid = value && options.includes(value);
  const selectValue = isValueValid ? value : "";

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      <Select value={selectValue} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full text-sm text-foreground outline-none focus:ring-1 focus:ring-inset focus:ring-primary/50">
          <SelectValue
            placeholder={placeholder}
            className="truncate"
          ></SelectValue>
        </SelectTrigger>
        <SelectContent className="">
          <SelectGroup>
            {options.map((opt) => (
              <SelectItem key={opt} value={opt}>
                {opt}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  );
};
