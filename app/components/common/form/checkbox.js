'use client';
import { useEffect, useState } from "react";

export default function CheckBox(props) {

  const { isChecked, onChange, disabled, containerstyle, orangeColor, label } = props;

  const [present, setPresent] = useState(isChecked)

  const handleChange = () => {
    setPresent(!present)
    onChange(!present)
  }

  useEffect(() => {
    setPresent(isChecked)
  }, [isChecked]);

  return (
    <fieldset className={containerstyle}>
      <legend className="sr-only">Notifications</legend>
      <div className="relative flex items-start">
        <label className="font-medium text-gray-900">
          {label}
        </label>
        <div className="ml-3 flex h-5 items-center">
          <input
            id="comments"
            aria-describedby="comments-description"
            name="comments"
            type="checkbox"
            className={`${orangeColor ? "border-gray-300 text-orange-500 focus:ring-orange-500 h-4 w-4 rounded" : "border-gray-300 text-red-500 focus:ring-red-500 h-4 w-4 rounded"}`}
            onChange={handleChange}
            checked={present}
            disabled={disabled}
          />
        </div>
      </div>
    </fieldset>
  )
}

