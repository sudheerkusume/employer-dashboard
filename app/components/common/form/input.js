import React from "react";

function Input(props) {
  const { title, placeholder, type, name, id, onChange, onBlur, isError, value, errormsg, disabled, required, containerstyle, inputProps, max, min, step, maxLength, orangeColor, kyc, nocaps } = props;

  return (
    <div className={containerstyle}>
      <div className={`relative border border-gray-300 rounded-md px-3 py-2 shadow-sm focus-within:ring-1 ${orangeColor ? "focus-within:ring-orange-500 focus-within:border-orange-500" : "focus-within:ring-red-600 focus-within:border-red-600"} ${disabled ? "opacity-50" : "opacity-100"} bg-white `}>
        <label htmlFor="name" className={`${kyc && "text-[11px]"} label capitalize text-gray-500`}>
          {title}
          {required ? "*" : null}
        </label>
        <input type={type} name={name} id={id} className={nocaps ? `block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 text-[1.125rem] mt-[0.188rem]` : `block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 text-[1.125rem] mt-[0.188rem] ${!value && value?.length === 0 ? "opacity-50" : "opacity-100"}`} placeholder={placeholder} onChange={onChange} onBlur={onBlur} disabled={disabled} value={value} required={required} max={max} min={min} step={step} maxLength={maxLength} autoComplete={"off"} autoCorrect={"off"} {...inputProps} />
      </div>

      {isError && (
        <p className={`${orangeColor ? "text-orange-600" : "text-red-600"} mt-2 text-sm`} id="email-error">
          {errormsg}
        </p>
      )}
    </div>
  );
}

export default Input;
