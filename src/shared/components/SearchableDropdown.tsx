import React, { useState, useEffect, useRef } from 'react';
import { Field, Combobox, Option } from '@fluentui/react-components';
import { Search24Regular, Dismiss24Regular } from '@fluentui/react-icons';
import './SearchableDropdown.css';

export interface DropdownOption<T = any> {
  value: T;
  label: string;
  disabled?: boolean;
  metadata?: Record<string, any>;
}

export interface SearchableDropdownProps<T = any> {
  label: string;
  name: string;
  value: T | undefined;
  onChange: (value: T | undefined) => void;
  options?: DropdownOption<T>[];
  getItems?: (search: string) => Promise<DropdownOption<T>[]> | DropdownOption<T>[];
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  onCreateNew?: () => void;
  onSearch?: (query: string) => Promise<void> | void;
  renderOption?: (option: DropdownOption<T>) => React.ReactNode;
}

export function SearchableDropdown<T = any>({
  label,
  name,
  value,
  onChange,
  options: providedOptions,
  getItems,
  placeholder = 'Select...',
  required = false,
  error,
  helpText,
  disabled = false,
  loading = false,
  searchable = true,
  onCreateNew,
  onSearch,
  renderOption,
}: SearchableDropdownProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [dynamicOptions, setDynamicOptions] = useState<DropdownOption<T>[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Use getItems if provided, otherwise use providedOptions
  const options = getItems ? dynamicOptions : providedOptions || [];

  useEffect(() => {
    if (onSearch && searchQuery) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, onSearch]);

  // Load options when using getItems
  useEffect(() => {
    if (getItems && isOpen) {
      // Debounce search query updates
      const timeoutId = setTimeout(() => {
        const loadOptions = async () => {
          setIsLoadingOptions(true);
          try {
            const items = await Promise.resolve(getItems(searchQuery || ''));
            setDynamicOptions(Array.isArray(items) ? items : []);
          } catch (error) {
            console.error('Error loading dropdown options:', error);
            setDynamicOptions([]);
          } finally {
            setIsLoadingOptions(false);
          }
        };
        loadOptions();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [getItems, isOpen, searchQuery]);

  // When value changes and using getItems, try to find the item in current options
  // Handle both object values (like BankAccount) and ID values
  const selectedOption = options?.find((opt) => {
    if (!value) return false;

    // If value is an object with id, compare with option.value (id) or option.data.id
    if (typeof value === 'object' && value !== null && 'id' in value) {
      const valueId = (value as any).id;
      // Check if option.value matches the id
      if (opt.value === valueId) return true;
      // Check if option.data.id matches
      if ((opt as any).data && (opt as any).data.id === valueId) return true;
      // Check if option.value is an object with same id
      if (typeof opt.value === 'object' && opt.value !== null && 'id' in opt.value) {
        return (opt.value as any).id === valueId;
      }
    }

    // Direct comparison
    return opt.value === value;
  });

  // Extract display value from selected option or from value object directly
  let displayValue = selectedOption?.label || '';

  // If no label found and value is an object, try to build label from value
  if (!displayValue && value && typeof value === 'object' && value !== null) {
    const valueObj = value as any;
    if ('account_name' in valueObj && 'account_number' in valueObj) {
      displayValue = `${valueObj.account_name} - ${valueObj.account_number}`;
    } else if ('account_code' in valueObj && 'account_name' in valueObj) {
      displayValue = `${valueObj.account_code} - ${valueObj.account_name}`;
    } else if ('customer_code' in valueObj && 'display_name' in valueObj) {
      displayValue = `${valueObj.customer_code} - ${valueObj.display_name}`;
    } else if ('product_code' in valueObj && 'name' in valueObj) {
      displayValue = `${valueObj.product_code} - ${valueObj.name}`;
    } else if ('name' in valueObj) {
      displayValue = valueObj.name;
    } else if ('display_name' in valueObj) {
      displayValue = valueObj.display_name;
    }
  }

  const filteredOptions =
    searchable && searchQuery && !getItems
      ? options.filter((opt) => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
      : options;

  const handleSelect = async (selectedValue: string) => {
    // If using getItems, we need to find the option from the current dynamicOptions
    let option: DropdownOption<T> | undefined;

    if (getItems) {
      // Try to find in current options
      option = options.find((opt) => String(opt.value) === selectedValue);
      // If not found, reload options and try again
      if (!option && isOpen) {
        try {
          const items = await Promise.resolve(getItems(''));
          const allItems = Array.isArray(items) ? items : [];
          option = allItems.find((opt) => String(opt.value) === selectedValue);
        } catch (error) {
          console.error('Error loading option:', error);
        }
      }
    } else {
      option = options.find((opt) => String(opt.value) === selectedValue);
    }

    if (option) {
      // If option has data property, pass that; otherwise pass the value
      const optionValue = (option as any).data || option.value;
      onChange(optionValue);
    }
    setIsOpen(false);
  };

  return (
    <Field
      label={required ? `${label} *` : label}
      validationMessage={error}
      validationState={error ? 'error' : 'none'}
    >
      <Combobox
        id={name}
        value={displayValue}
        onOpenChange={(_, data) => setIsOpen(data.open)}
        open={isOpen}
        disabled={disabled}
        placeholder={placeholder}
        onOptionSelect={(_, data) => {
          if (data.optionValue) {
            handleSelect(data.optionValue);
          }
        }}
      >
        {searchable && (
          <div className="searchable-dropdown-input">
            <Search24Regular />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="searchable-dropdown-search"
              onClick={(e) => e.stopPropagation()}
            />
            {searchQuery && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery('');
                }}
                className="searchable-dropdown-clear"
              >
                <Dismiss24Regular />
              </button>
            )}
          </div>
        )}
        {loading || isLoadingOptions ? (
          <Option disabled>Loading...</Option>
        ) : !options || filteredOptions.length === 0 ? (
          <Option disabled>No options found</Option>
        ) : (
          filteredOptions.map((option) => (
            <Option
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {renderOption ? renderOption(option) : option.label}
            </Option>
          ))
        )}
        {onCreateNew && searchQuery && (
          <Option value="__create__" onSelect={() => onCreateNew()}>
            <div className="searchable-dropdown-create">+ Create "{searchQuery}"</div>
          </Option>
        )}
      </Combobox>
      {helpText && !error && <div className="form-help-text">{helpText}</div>}
    </Field>
  );
}
