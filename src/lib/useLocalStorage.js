import { useState, useEffect } from 'react';
import { LOCAL_STORAGE_PREFIX } from './constants';

export default (key, defaultValue) => {
    const [item, setItem] = useState(defaultValue);

    useEffect(() => {
        function getLocalStorageValue() {
            const value = localStorage.getItem(
                `${LOCAL_STORAGE_PREFIX}${key}`
            );

            setItem(JSON.parse(value));
        }

        getLocalStorageValue();
    }, []);

    const setLocalStorageValue = value => {
        try {
            localStorage.setItem(
                `${LOCAL_STORAGE_PREFIX}${key}`,
                JSON.stringify(value)
            );
            setItem(value);
        } catch (error) {
            console.error({ error });
        }
    };

    return [item, setLocalStorageValue];
};
