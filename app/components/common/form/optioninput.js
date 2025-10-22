import ComboBox from "./combobox";
import React from "react";

function OptionInput(props) {
  const { title, placeholder, type, name, id, onInputChange, onBlur, isError, value, errormsg, disabled, required, comboData, onComboChange, comboValue, onFilterChange, comboTextField, onIsdBlur, comboContainerStyle, containerStyle, inputContainerStyle, comboPlaceholder, inputProps } = props;

  return (
    <>
      <div className={containerStyle}>
        <div className={`relative  border border-gray-300 rounded-md shadow-sm focus-within:ring-1 focus-within:ring-red-600 focus-within:border-red-600 ${disabled ? "opacity-50" : "opacity-100"}`}>
          <label htmlFor="name" className="z-10 text-gray-500 capitalize label">
            {title} {required ? "*" : null}
          </label>

          <div className="flex">
            <div id="country" name="country" autoComplete="country" className="h-full text-gray-500 bg-transparent border-transparent rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
              <ComboBox
                // title={"Combo Box"}
                placeholder={comboPlaceholder}
                width={1}
                data={comboData}
                textField={comboTextField}
                onChange={onComboChange}
                value={comboValue}
                onFilterChange={onFilterChange}
                onBlur={onIsdBlur}
                isError={false}
                disabled={disabled}
                errormsg={"Combobox Validation Message"}
                nested={true}
                containerStyle={comboContainerStyle}
              />
            </div>

            <div className={inputContainerStyle}>
              <input type={type} name={name} id={id} className="block w-full mt-[12px] border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 text-[1.125re] pl-3" placeholder={placeholder} onChange={onInputChange} onBlur={onBlur} disabled={disabled} value={value} required={required} {...inputProps} />
            </div>
          </div>
        </div>

        {isError && (
          <p className="mt-2 text-sm text-red-600" id="email-error">
            {errormsg}
          </p>
        )}
      </div>
    </>
  );
}

export default OptionInput;
