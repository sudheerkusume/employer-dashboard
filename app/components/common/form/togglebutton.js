import { Switch } from "@headlessui/react";

function ToggleButton(props) {
  const { enabled, setEnabled, containerStyle, enablebg, disablebg, switchStyle, circleStyle, translate, disabled, switchColor, circleColor } = props;

  return (
    <div className={containerStyle}>
      <Switch
        checked={enabled}
        onChange={setEnabled}
        disabled={disabled}
        className={`${enabled ? enablebg : disablebg}
          relative inline-flex ${switchStyle} shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
      >
        <span
          aria-hidden="true"
          className={`${enabled ? translate : "translate-x-0"}
            pointer-events-none inline-block ${circleStyle} transform rounded-full ${circleColor ? switchColor : "bg-white"} shadow-lg ring-0 transition duration-200 ease-in-out`}
        />
      </Switch>
    </div>
  );
}

export default ToggleButton;
