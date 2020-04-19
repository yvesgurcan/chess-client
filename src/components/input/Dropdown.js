import React from 'react';

export default ({ children: options, ...props }) => (
    <select {...props}>
        {options &&
            options.map(option => (
                <option key={option} value={option}>
                    {option}
                </option>
            ))}
    </select>
);
