"use client";
import { useEffect, useState } from "react";
import { Description, Label, Radio, RadioGroup } from "@headlessui/react";

export default function NewRadioButton({ data, value, isActive, required, title, updateCheck, containerStyle, orangeColor, disabled, padding, btnGrouping }) {
  const [selected, setSelected] = useState(updateCheck || data[0]);

  const onValueChange = (item) => {
    setSelected(item);
    isActive(item);
  };

  useEffect(() => {
    if (updateCheck) {
      setSelected(updateCheck);
    }
  }, [updateCheck]);

  useEffect(() => {
    if (value) {
      setSelected(value);
    }
  }, [value]);

  return (
    <div className={containerStyle}>
      <p className={`${orangeColor ? "text-base font-semibold text-gray-900 mb-1 capitalize" : "text-base font-medium mb-1 capitalize text-gray-500"}`}>
        {title} {required ? "*" : null}
      </p>
      <div className="max-w-md mx-auto">
        <RadioGroup value={selected} onChange={(item) => onValueChange(item)} disabled={disabled}>
          <Label className="sr-only">Server size</Label>
          <div className={`flex ${btnGrouping ? "" : "gap-4"} capitalize`}>
            {data.map((element, index) => (
              <Radio
                key={index}
                value={element}
                className={({ active, checked }) =>
                  `${active ? `${orangeColor ? "ring-2 ring-offset-2 ring-orange-500" : "ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-red-300"}` : ""}
                  ${checked ? `${orangeColor ? "bg-orange-500 border-transparent text-white hover:bg-orange-500" : "bg-red-600 text-white"}` : "bg-white"}
                  ${disabled ? "opacity-50" : "opacity-100"}
                  ${padding ? "py-3" : "py-0"}
                    relative flex cursor-pointer  ${btnGrouping ? (index === 0 ? "rounded-l-lg" : index === data.length - 1 ? "rounded-r-lg" : "") : " rounded-lg"} px-3 py-1 shadow-md focus:outline-none`
                }
              >
                {({ checked }) => (
                  <>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <Label as="p" className={`font-medium  ${checked ? "text-white" : "text-gray-900"}`}>
                            {element}
                          </Label>
                          <Description as="span" className={`inline ${checked ? "text-sky-100" : "text-gray-500"}`}></Description>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Radio>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
