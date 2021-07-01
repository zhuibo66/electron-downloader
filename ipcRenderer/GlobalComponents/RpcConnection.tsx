import React, { useEffect } from 'react';
import { useModule } from '@/store/index';
import App from '@/pages/index';
const RpcConnection = () => {
    const { aria2cModule } = useModule();
    useEffect(() => {
        aria2cModule.connect();
        return () => {
            aria2cModule.disconnect();
        };
    }, []);

    return aria2cModule.connectionState ? <App /> : null;
};

export default RpcConnection;
