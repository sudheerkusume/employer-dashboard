'use client';
import React, { useEffect, useState } from "react";

function TextArea(props) {
  const {
    title,
    placeholder,
    type,
    name,
    id,
    onChange,
    onBlur,
    isError,
    value,
    errormsg,
    disabled,
    required,
    containerstyle,
    inputProps,
    max,
    min,
    step,
    maxLength,
    row,
    orangeColor
  } = props;

  const [count, setCount] = useState(0)


  useEffect(() => {
    setCount(value.length)
  }, [value])

  return (
    <div className={containerstyle}>
      <div
        className={`relative border border-gray-300 pt- rounded-md px-3 py-2 shadow-sm focus-within:ring-1 ${orangeColor ? "focus-within:ring-orange-500 focus-within:border-orange-500" : "focus-within:ring-red-600 focus-within:border-red-600"} ${disabled ? "opacity-50" : "opacity-100"} bg-white`}
      >
        <label htmlFor="name" className="label capitalize text-gray-500">
          {title}
          {required ? "*" : null}
        </label>
        <textarea
          type={type}
          name={name}
          id={id}
          className="block w-full border-0 p-0 text-gray-900 placeholder-gray-500 focus:ring-0 text-[1.125re] mt-3 md:mt-[0.188rem]"
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          disabled={disabled}
          value={value}
          required={required}
          max={max}
          min={min}
          step={step}
          maxLength={maxLength}
          {...inputProps}
          rows={row}
        />
        <span className={count === 0 ? "hidden" : "flex justify-end text-sm text-gray-400"}>{"Total Character "}{count}</span>
      </div>

      {isError && (
        <p className={`${orangeColor ? "text-orange-600" : "text-red-600"} mt-2 text-sm`} id="email-error">
          {errormsg}
        </p>
      )}
    </div>
  );
}


export default TextArea;
