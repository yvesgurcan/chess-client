import { useEffect } from 'react';
import useLocalStorage from './useLocalStorage';
import { sendRequest } from './util';
import { v4 as uuid } from 'uuid';

export default () => {
    const [userData, setUserData] = useLocalStorage('user', {});

    useEffect(() => {
        async function createNewUser() {
            const userId = uuid();
            const content = { userId };
            await sendRequest(
                [
                    { name: 'userId', value: userId },
                    { name: 'content', value: JSON.stringify(content) }
                ],
                'post',
                'user'
            );
            setUserData(content);
        }

        if (!userData) {
            createNewUser();
        }
    }, [userData]);

    return [userData];
};
