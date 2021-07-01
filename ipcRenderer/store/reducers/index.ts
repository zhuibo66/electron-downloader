import { combineReducers } from 'redux';
import downloadModule from './downloadModule';
import aria2cModule from './aria2cModule';
export const modules = {
    aria2cModule,
    downloadModule,
};

/**
 * 把所有的模块转换成符合redux的方法
 * @param {*} modules 所有模块
 * @returns
 */
export const transferModulesToReduersFun = modules => {
    const obj = {};
    Reflect.ownKeys(modules).forEach(key => {
        const value = modules[key];
        //这里是为了打包后，导致方法名，变量名都是e，这些混淆过的名称
        const contextName = value.constructor.name;
        obj[contextName] = (state = value, action) => {
            const { type, payload } = action;
            if (new RegExp('^' + contextName + '_').test(type)) {
                return { ...state, ...payload };
            }
            return { ...state };
        };
    });
    return obj;
};

export default combineReducers(transferModulesToReduersFun(modules));
