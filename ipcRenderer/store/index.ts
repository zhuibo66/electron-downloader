import { createStore } from 'redux';
import rootReducer, { modules } from './reducers/index';
import { composeWithDevTools } from 'redux-devtools-extension';
import { useSelector } from 'react-redux';

const store = createStore(rootReducer, composeWithDevTools());
export default store;

// 获取modules 推断其类型
const stores = () => modules;
type TStore = ReturnType<typeof stores>;

export const useModule = () => {
    const state = useSelector(state => state);
    const obj = {};
    // 重新组装module
    Reflect.ownKeys(modules).forEach(key => {
        const oldState = Reflect.get(modules, key);
        const newState = Reflect.get(state, key);
        // 这里返回的新对象，一定要把原对象里面的_proto__带上，因为使用class定义的方法，都是定义在原型链上的
        // 法1、使用Object.assign这个方法，对于如果是基本的数据类型（number，string，boolean。。。）是深拷贝，如果是引用类型（object，array。。。）是浅拷贝
        // 法2、使用es6的扩展运算符合并对象后，需要把新对象的__proto__，指向原对象。

        //法1
        obj[key] = Object.assign(oldState, newState);

        // 法2
        // obj[key] = {
        //   ...oldState,
        //   ...newState,
        // };
        // obj[key].__proto__ = oldState.__proto__;
    });
    return obj as TStore;
};
