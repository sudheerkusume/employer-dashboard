function InputBox({ name, title, placeholder, onChange, value, required, titleTextStyle, type, disabled, ...rest }) {

    return (
        <div className={`relative shadow-sm focus-within:ring-1 focus-within:ring-orange-400 focus-within:border-orange-400 border border-gray-300 rounded-md transition-all ${disabled ? "opacity-50" : "opacity-100"} bg-white`}>
            <label htmlFor={name} className="text-gray-500 capitalize label">
                <span className={titleTextStyle || "text-sm"}>{title}</span>
                {required ? "*" : null}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="w-full px-3 py-2.5 bg-transparent border-none outline-none text-sm text-gray-900 h-[42px]"
                required={required}
                {...rest}
            />
        </div>
    );
}

export default InputBox;
