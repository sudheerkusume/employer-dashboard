import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { Combobox, ComboboxButton, ComboboxInput, ComboboxOption, ComboboxOptions } from "@headlessui/react";
import React, { useState } from "react";

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

function titleCase(str) {
  if (typeof str !== 'string' || str.trim() === '') {
    return '';
  }

  return str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
}

function ComboBox(props) {
  const { title, placeholder, onChange, onBlur, isError, value, errormsg, disabled, required, data, textField, onFilterChange, nested, containerStyle, itemRender, serverFilter, titleTextStyle, displayTextStyle, orangeColor, toUpperCase, airportValue, iata, optionsHeight } = props;

  const [query, setQuery] = useState("");
  const [optionSelected, setOptionSelected] = useState(false);
  const filteredData = query === "" ? data : data?.length > 0 && data?.filter((item) => item && (textField ? item[textField].toLowerCase().replace(/\s+/g, "").includes(query.toLowerCase().replace(/\s+/g, "")) : item.toLowerCase().replace(/\s+/g, "").includes(query.toLowerCase().replace(/\s+/g, ""))));

  const mainData = serverFilter ? data : filteredData;
  return (
    <div className={containerStyle}>
      <Combobox as="div" value={value} onChange={onChange} disabled={disabled}>
        <div className={`relative ${nested ? `pl-3 py-1 border border-gray-400` : `py-2 shadow-sm focus-within:ring-1 ${orangeColor ? "focus-within:ring-orange-500" : "focus-within:ring-gray-600"} border border-gray-300 px-3`}  rounded-md  ${orangeColor ? "focus-within:border-orange-500" : "focus-within:border-gray-600"} ${disabled ? "opacity-50" : "opacity-100"} bg-white`}>
          <label htmlFor="name" className="text-gray-500 capitalize label">
            <span className={titleTextStyle || "text-base"}>{title}</span>
            {required ? "*" : null}
          </label>
          {
            <div className="relative mt-1">
              <ComboboxInput
                className={`${displayTextStyle || `text-base`} block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 mt-[0.188rem]`}
                onChange={(event) => {
                  if (!optionSelected) {
                    setQuery(event.target.value);
                  } else {
                    optionSelected && setOptionSelected(false);
                  }
                  onFilterChange && onFilterChange(event, textField);
                }}
                required={required || false}
                disabled={disabled || false}
                onBlur={onBlur}
                placeholder={placeholder || ""}
                displayValue={(item) => {
                  return item && toUpperCase ? (item && textField ? item[textField].toUpperCase() : item.toUpperCase()) : iata ? (item && textField ? item[textField] : item) : titleCase(item && textField ? item[textField] : item);
                }}
                autoComplete={"off"}
                autoCorrect={"off"}
              />
              <ComboboxButton className={`absolute inset-y-0 right-0  flex items-center rounded-r-md px-2 focus:outline-none`}>
                <ChevronUpDownIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
              </ComboboxButton>
            </div>
          }
          {mainData?.length > 0 && (
            <ComboboxOptions className={optionsHeight ? `absolute z-50 mt-1 ${optionsHeight} left-0 w-full overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm [&:first-child]:rounded-t-lg [&:last-child]:rounded-b-lg` : `absolute z-10 mt-1 max-h-60 left-0 w-full overflow-auto rounded-md bg-white text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm [&:first-child]:rounded-t-lg [&:last-child]:rounded-b-lg`}>
              {mainData.map((item, index) => (
                <ComboboxOption
                  key={index}
                  value={item || ""}
                  onClick={() => {
                    !serverFilter && setQuery("");
                    setOptionSelected(true);
                  }}
                  className={({ focus }) => classNames("relative cursor-default select-none py-2 pl-3 pr-9", focus ? `${orangeColor ? "bg-orange-400 text-white" : "bg-gray-600 text-white"}` : "text-gray-900")}
                >
                  {({ focus, selected }) => (
                    <>
                      {itemRender ? (
                        itemRender(item, selected)
                      ) : (
                        <span className={classNames(`${airportValue ? "block" : "block truncate"}`, selected && "font-semibold")}>
                          {airportValue ? (item && toUpperCase ? (item[textField] ? item?.iata.toUpperCase() + " - " + item[textField].toUpperCase() + ", " + item?.city?.name : item?.iata.toUpperCase() + " - " + item.toUpperCase() + ", " + item?.city?.name) : item?.iata.toUpperCase() + " - " + titleCase(item[textField] ? item[textField] + ", " + item?.city?.name : item?.iata.toUpperCase() + " - " + item + ", " + item?.city?.name)) : item && toUpperCase ? (item[textField] ? item[textField].toUpperCase() : item.toUpperCase()) : iata ? (item[textField] ? item[textField] : item) : titleCase(item[textField] ? item[textField] : item)}
                        </span>
                      )}

                      {selected && (
                        <span className={classNames("absolute inset-y-0 right-0 flex items-center pr-4", focus ? "text-white" : `${orangeColor ? "text-orange-400" : "text-gray-600"}`)}>
                          <CheckIcon className="w-5 h-5" aria-hidden="true" />
                        </span>
                      )}
                    </>
                  )}
                </ComboboxOption>
              ))}
            </ComboboxOptions>
          )}
        </div>
      </Combobox>

      {isError && (
        <p className={`${orangeColor ? "text-orange-600" : "text-gray-600"} mt-2 text-sm`} id="email-error">
          {errormsg}
        </p>
      )}
    </div>
  );
}

export default ComboBox;
