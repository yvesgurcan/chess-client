import React from 'react';

export default ({ children: options, ...props }) => (
    <select {...props}>
        {options &&
            options.map(option => (
                <option
                    key={
                        option && option.text !== undefined
                            ? option.text
                            : option.value !== undefined
                            ? option.value
                            : option
                    }
                    value={
                        option && option.value !== undefined
                            ? option.value
                            : option
                    }
                >
                    {option && option.text !== undefined
                        ? option.text
                        : option.value !== undefined
                        ? option.value
                        : option}
                </option>
            ))}
    </select>
);
