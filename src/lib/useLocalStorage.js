import { useState, useEffect } from 'react';
import { LOCAL_STORAGE_PREFIX } from './constants';

export default (key, defaultValue) => {
    const [item, setItem] = useState(defaultValue);

    useEffect(() => {
        async function getLocalStorageValue() {
            const value = await localStorage.getItem(
                `${LOCAL_STORAGE_PREFIX}${key}`
            );

            setItem(JSON.parse(value));
        }

        getLocalStorageValue();
    }, []);

    const setLocalStorageValue = async value => {
        try {
            await localStorage.setItem(
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
