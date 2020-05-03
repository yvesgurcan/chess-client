import { useState, useEffect } from 'react';

const isServiceWorkerRegistered = async () => {
    if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        return !!registrations.length > 0;
    }

    return false;
};

const registerServiceWorker = () => {
    return navigator.serviceWorker.register('/service-worker.js');
};

const unregisterServiceWorker = async () => {
    if (navigator.serviceWorker) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
            registration.unregister();
        }
    }
};

export default () => {
    const [serviceWorkEnabled, setServiceWorkEnabled] = useState(false);

    useEffect(() => {
        async function getServiceWorkerRegistration() {
            const serviceWorkerRegistered = await isServiceWorkerRegistered();
            setServiceWorkEnabled(serviceWorkerRegistered);
        }

        getServiceWorkerRegistration();
    }, [serviceWorkEnabled]);

    const handleEnableServiceWorker = async enableServiceWorker => {
        if (enableServiceWorker) {
            try {
                await registerServiceWorker();
                setServiceWorkEnabled(true);
            } catch (error) {
                console.error({ error });
            }
            return;
        }

        try {
            await unregisterServiceWorker();
            setServiceWorkEnabled(false);
        } catch (error) {
            console.error({ error });
        }
    };

    return [serviceWorkEnabled, handleEnableServiceWorker];
};
