import React from 'react'

const InputField = ({ type, name, placeholder, onChange, value }) => {

    return (
        <>
            <input
                className="w-full border border-gray-300 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                name={name}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
        </>
    )
}

export default InputField;