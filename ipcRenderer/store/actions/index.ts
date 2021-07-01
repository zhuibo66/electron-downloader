import store from '../index';

/**
 * 利用装饰器，通知redux更新数据
 * @param {*} target 目标实例的对象
 * @param {*} funName 执行的方法名
 * @param {*} descriptor 执行方法函数描述器
 * @returns
 */

export const Update: Function = (target, funName, descriptor) => {
    // 限定方法名为update
    if (funName != 'update') return;

    // 保留update原生函数
    const oldFunc = descriptor.value;
    const contextName = target.constructor.name;

    // 这里的方法定义不能使用箭头函数，
    // 因为箭头函数的this是跟当前的运行环境的上下文有关系的，所以才用直接function定义即可
    descriptor.value = function () {
        try {
            const module = { ...this };
            // 同步dispatch 如UserModule_SET ，即为发送action去更新UserModule，
            // 这边更新的名称都是约定好的，如果名称不一致则返回原内容，否在新内容，具体请看 \store\reducers\index
            store.dispatch({
                type: contextName + '_SET',
                payload: module,
            });

            //这里返回原方法的内容
            return oldFunc();
        } catch (e) {
            throw Error(e);
        }
    };

    // 冻结对象，感觉没啥用
    //   descriptor.configurable = false;
    //   descriptor.writable = false;
};
